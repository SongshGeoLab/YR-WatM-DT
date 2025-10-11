"""FastAPI server exposing Parquet-backed data endpoints for visualization.

Endpoints
    GET  /variables                 -> list of variable names (excluding TIME)
    GET  /params                    -> mapping of parameter name -> unique values
    POST /resolve_scenario          -> resolve scenario_name from parameter values
    GET  /time                      -> time vector [{step, time}, ...]
    GET  /series                    -> variable series for scenario (optional window)

Run
    poetry run uvicorn scripts.api_server:app --host 0.0.0.0 --port 8000

Google-style docstrings are used.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional, Union

import geopandas as gpd
import pandas as pd
import polars as pl
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

DATA_PARQUET = Path("data_parquet")
DATA_DIR = Path("data")
GEOJSON_CACHE: Dict[str, dict] = {}
_VARIABLES_MAP_CACHE: Optional[Dict[str, str]] = None  # original_name -> safe_name


def _read_variables() -> List[str]:
    """Read variable names from metadata.json, excluding TIME."""
    meta = json.loads((DATA_DIR / "metadata.json").read_text(encoding="utf-8"))
    names: List[str] = []
    for item in meta.get("outcomes", []):
        if not isinstance(item, list) or len(item) < 3:
            continue
        _, name, _ = item[:3]
        if name == "TIME":
            continue
        names.append(name)
    return sorted(names)


def _read_variables_map() -> Dict[str, str]:
    """Read mapping of original variable name -> safe variable name.

    Returns empty dict if mapping file doesn't exist (backward compatible).
    """
    global _VARIABLES_MAP_CACHE
    if _VARIABLES_MAP_CACHE is not None:
        return _VARIABLES_MAP_CACHE
    map_path = DATA_PARQUET / "variables_map.json"
    if map_path.exists():
        _VARIABLES_MAP_CACHE = json.loads(map_path.read_text(encoding="utf-8"))
    else:
        _VARIABLES_MAP_CACHE = {}
    return _VARIABLES_MAP_CACHE


def _resolve_variable_to_path(variable: str) -> Path:
    """Resolve a requested variable name (original or safe) to a Parquet path."""
    mapping = _read_variables_map()
    # If original name provided
    if variable in mapping:
        safe = mapping[variable]
        path = DATA_PARQUET / f"{safe}.parquet"
        if path.exists():
            return path
    # If safe name provided
    path = DATA_PARQUET / f"{variable}.parquet"
    if path.exists():
        return path
    # Fallback to original file naming (legacy)
    path = DATA_PARQUET / f"{variable}.parquet"
    return path


def _read_scenarios() -> pl.DataFrame:
    return pl.read_parquet(DATA_PARQUET / "scenarios.parquet")


def _read_time() -> pl.DataFrame:
    return pl.read_parquet(DATA_PARQUET / "time.parquet")


def _get_basin_geojson() -> dict:
    """Read Yellow River Basin shapefile and return GeoJSON.

    Returns:
        GeoJSON dict of the basin boundary.
    """
    if "basin" in GEOJSON_CACHE:
        return GEOJSON_CACHE["basin"]

    # Try to find the shapefile from config

    from hydra import compose, initialize_config_dir

    config_path = Path("config").absolute()
    try:
        with initialize_config_dir(version_base=None, config_dir=str(config_path)):
            cfg = compose(config_name="config.yaml")
            shp_folder = Path(cfg.ds.yr_shp.folder).expanduser()
            shp_file = shp_folder / cfg.ds.yr_shp.outlines.huanghe

            if not shp_file.exists():
                raise FileNotFoundError(f"Shapefile not found: {shp_file}")

            gdf = gpd.read_file(shp_file)

            # Convert to WGS84 if not already
            if gdf.crs and gdf.crs != "EPSG:4326":
                gdf = gdf.to_crs("EPSG:4326")

            # Convert to GeoJSON
            geojson = json.loads(gdf.to_json())
            GEOJSON_CACHE["basin"] = geojson
            return geojson

    except Exception as e:
        # Fallback: return empty FeatureCollection
        return {"type": "FeatureCollection", "features": [], "error": str(e)}


app = FastAPI(title="Decision Theater API", version="0.1.0")

# Allow local dev frontends (Dash, Vite, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict:
    return {
        "message": "Decision Theater API",
        "docs": "/docs",
        "endpoints": [
            "/variables",
            "/variables_map",
            "/params",
            "/resolve_scenario",
            "/time",
            "/series?variable=YRB%20WSI&scenario=sc_0",
            "/basin/geojson",
        ],
    }


@app.get("/basin/geojson")
def get_basin_geojson() -> dict:
    """Get Yellow River Basin boundary as GeoJSON.

    Returns:
        GeoJSON FeatureCollection of the basin boundary.
    """
    return _get_basin_geojson()


@app.get("/variables")
def get_variables() -> List[str]:
    return _read_variables()


@app.get("/variables_map")
def get_variables_map() -> Dict[str, str]:
    """Return mapping of original variable name -> safe variable name."""
    return _read_variables_map()


@app.get("/params")
def get_params() -> Dict[str, List]:
    scenarios = _read_scenarios()
    params = {}
    for c in scenarios.columns:
        if c == "scenario_name":
            continue
        params[c] = scenarios.get_column(c).unique().sort().to_list()
    return params


class ResolveRequest(BaseModel):
    values: Dict[str, object]


@app.post("/resolve_scenario")
def resolve_scenario(body: ResolveRequest) -> Dict[str, str]:
    scenarios = _read_scenarios()
    filters = []
    for k, v in body.values.items():
        if k not in scenarios.columns:
            raise HTTPException(status_code=400, detail=f"Unknown parameter: {k}")
        filters.append(pl.col(k) == v)
    if not filters:
        raise HTTPException(status_code=400, detail="No parameters provided")
    matched = scenarios.filter(pl.all_horizontal(filters))
    if matched.height == 0:
        raise HTTPException(
            status_code=404, detail="No scenario matches the selected parameters"
        )
    scenario_name = matched.get_column("scenario_name").item()
    return {"scenario_name": scenario_name}


@app.get("/time")
def get_time() -> List[Dict[str, float]]:
    time_df = _read_time().sort("step")
    return time_df.to_dicts()


@app.get("/series")
def get_series(
    variable: str = Query(...),
    scenario: str = Query(...),
    start_step: Optional[int] = Query(None, ge=0),
    end_step: Optional[int] = Query(None, ge=0),
) -> Dict[str, object]:
    # Allow original or safe variable names
    var_path = _resolve_variable_to_path(variable)
    if not var_path.exists():
        raise HTTPException(
            status_code=404, detail=f"Variable parquet not found for '{variable}'"
        )

    df = pl.read_parquet(var_path).filter(pl.col("scenario_name") == scenario)
    if df.height == 0:
        raise HTTPException(status_code=404, detail="Scenario not found for variable")
    if start_step is not None:
        df = df.filter(pl.col("step") >= start_step)
    if end_step is not None:
        df = df.filter(pl.col("step") <= end_step)
    df = df.join(_read_time(), on="step", how="left").sort("step")
    return {
        "variable": variable,
        "scenario": scenario,
        "series": {
            "time": df.get_column("time").to_list(),
            "value": df.get_column("value").to_list(),
        },
    }


@app.get("/reports/{filename}")
def get_report_file(filename: str):
    """Serve report files (JSON, images, etc.) from the reports directory."""
    file_path = Path("reports") / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {filename}")

    # Set appropriate media type based on file extension
    media_type = "application/json" if filename.endswith(".json") else None

    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=3600"},  # Cache for 1 hour
    )


@app.get("/page5-data")
def get_page5_data(
    water_saving_ratio: float = Query(0.9), energy_generation: float = Query(0.25)
) -> Dict[str, object]:
    """Get water demand analysis data for Page 5 frontend.

    This endpoint provides pre-computed water demand composition and time series data
    based on water-saving irrigation efficiency ratio and fire generation share parameters.
    """
    try:
        # Import the Page5 analysis functions
        import sys
        from pathlib import Path

        sys.path.insert(0, str(Path(__file__).parent.parent))

        from scripts.query_scenarios import ScenarioQuery

        # Initialize query engine
        query = ScenarioQuery(DATA_PARQUET)

        # Define water demand categories
        water_categories = [
            "irrigation water demand province sum",
            "production water demand province sum",
            "OA water demand province sum",
            "domestic water demand province sum",
        ]

        # Category display names and colors
        category_names = {
            "irrigation water demand province sum": "Irrigation",
            "production water demand province sum": "Production",
            "OA water demand province sum": "Other Activities",
            "domestic water demand province sum": "Domestic",
        }

        # Build filters
        filters: Dict[str, Union[float, int, str, List]] = {
            "water-saving irrigation efficiency ratio": water_saving_ratio,
            "fire generation share province target": energy_generation,
            "Fertility Variation": 1.7,
            "Ecological water flow variable": 0.25,
            "Climate change scenario switch for water yield": 1,
            "Diet change scenario switch": 1,
        }

        # Get water demand data
        water_demand_data = query.get_series(
            variables=water_categories, filters=filters, include_params=True
        )

        # Calculate composition data
        composition_data = (
            water_demand_data.group_by("variable")
            .agg(pl.col("value").sum().alias("total_demand"))
            .with_columns(
                pl.col("variable")
                .cast(pl.Utf8)
                .replace(category_names)
                .alias("category")
            )
            .with_columns(
                (pl.col("total_demand") / pl.col("total_demand").sum() * 100).alias(
                    "percentage"
                )
            )
            .sort("total_demand", descending=True)
        )

        # Calculate total water demand time series
        total_demand_ts = (
            water_demand_data.group_by(["scenario_name", "step", "time"])
            .agg(pl.col("value").sum().alias("total_demand"))
            .sort(["scenario_name", "step"])
        )

        # Calculate time series statistics
        ts_stats = (
            total_demand_ts.group_by(["step", "time"])
            .agg(
                [
                    pl.col("total_demand").mean().alias("mean"),
                    pl.col("total_demand").std().alias("std"),
                    pl.col("total_demand").min().alias("min"),
                    pl.col("total_demand").max().alias("max"),
                    pl.col("total_demand").quantile(0.05).alias("p05"),
                    pl.col("total_demand").quantile(0.95).alias("p95"),
                    pl.col("total_demand").count().alias("n_scenarios"),
                ]
            )
            .with_columns(
                [
                    (pl.col("mean") - 1.96 * pl.col("std")).alias("ci_lower"),
                    (pl.col("mean") + 1.96 * pl.col("std")).alias("ci_upper"),
                ]
            )
            .sort("step")
        )

        # Filter to 2020-2100 for frontend
        ts_stats_filtered = ts_stats.filter(
            (pl.col("time") >= 2020) & (pl.col("time") <= 2100)
        )

        # Calculate key statistics
        stats = {}
        if ts_stats_filtered.height > 0:
            stats["overall_mean"] = float(ts_stats_filtered["mean"].mean())
            stats["overall_std"] = float(ts_stats_filtered["mean"].std())

            max_idx = ts_stats_filtered["mean"].arg_max()
            stats["max_value"] = float(ts_stats_filtered["mean"][max_idx])
            stats["max_year"] = float(ts_stats_filtered["time"][max_idx])

            min_idx = ts_stats_filtered["mean"].arg_min()
            stats["min_value"] = float(ts_stats_filtered["mean"][min_idx])
            stats["min_year"] = float(ts_stats_filtered["time"][min_idx])

            # Trend analysis
            if ts_stats_filtered.height > 1:
                initial_value = ts_stats_filtered["mean"][0]
                final_value = ts_stats_filtered["mean"][-1]
                time_span = ts_stats_filtered["time"][-1] - ts_stats_filtered["time"][0]
                stats["total_change"] = float(final_value - initial_value)
                stats["total_change_pct"] = float(
                    (final_value - initial_value) / initial_value * 100
                )
                stats["annual_growth_rate"] = float(
                    (final_value / initial_value) ** (1 / time_span) - 1
                )

            stats["coefficient_of_variation"] = float(
                (stats["overall_std"] / stats["overall_mean"]) * 100
            )
            stats["value_range"] = float(stats["max_value"] - stats["min_value"])

        # Return structured data
        return {
            "parameters": {
                "water_saving_ratio": water_saving_ratio,
                "energy_generation": energy_generation,
                "other_constraints": {
                    "Fertility Variation": 1.7,
                    "Ecological water flow variable": 0.25,
                    "Climate change scenario switch for water yield": 1,
                    "Diet change scenario switch": 1,
                },
            },
            "composition": {
                "categories": composition_data["category"].to_list(),
                "values": composition_data["total_demand"].to_list(),
                "percentages": composition_data["percentage"].to_list(),
            },
            "time_series": {
                "time": ts_stats_filtered["time"].to_list(),
                "mean": ts_stats_filtered["mean"].to_list(),
                "ci_lower": ts_stats_filtered["ci_lower"].to_list(),
                "ci_upper": ts_stats_filtered["ci_upper"].to_list(),
                "min": ts_stats_filtered["min"].to_list(),
                "max": ts_stats_filtered["max"].to_list(),
                "n_scenarios": (
                    int(ts_stats_filtered["n_scenarios"][0])
                    if ts_stats_filtered.height > 0
                    else 0
                ),
            },
            "statistics": stats,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating Page5 data: {str(e)}"
        )


@app.get("/climate-data")
def get_climate_data():
    """Get climate scenario data for RCP pathways.

    Returns:
        Dict containing temperature and precipitation data for different RCP scenarios.
    """
    try:
        # Read precipitation data from parquet
        pe_df = pd.read_parquet(DATA_PARQUET / "rcp_ssp" / "pe_data.parquet")

        # Read temperature data from parquet
        tas_df = pd.read_parquet(DATA_PARQUET / "rcp_ssp" / "tas_data.parquet")

        # Process precipitation data
        pe_processed = {}
        for scenario in ["ssp126_corrected", "ssp245_corrected", "ssp585_corrected"]:
            if scenario in pe_df["Scenario"].values:
                scenario_data = pe_df[pe_df["Scenario"] == scenario]
                # Filter out invalid values (NaN, inf, -inf)
                valid_data = scenario_data.dropna()
                valid_data = valid_data[
                    valid_data["Value"].apply(
                        lambda x: not (
                            pd.isna(x) or x == float("inf") or x == float("-inf")
                        )
                    )
                ]
                pe_processed[scenario] = {
                    "years": valid_data["Year"].tolist(),
                    "values": valid_data["Value"].tolist(),
                }

        # Process temperature data
        tas_processed = {}
        for scenario in ["ssp126_corrected", "ssp245_corrected", "ssp585_corrected"]:
            if scenario in tas_df["Scenario"].values:
                scenario_data = tas_df[tas_df["Scenario"] == scenario]
                # Filter out invalid values (NaN, inf, -inf)
                valid_data = scenario_data.dropna()
                valid_data = valid_data[
                    valid_data["Value"].apply(
                        lambda x: not (
                            pd.isna(x) or x == float("inf") or x == float("-inf")
                        )
                    )
                ]
                tas_processed[scenario] = {
                    "years": valid_data["Year"].tolist(),
                    "values": valid_data["Value"].tolist(),
                }

        return {"precipitation": pe_processed, "temperature": tas_processed}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error loading climate data: {str(e)}"
        )


@app.get("/yellow-river-basin")
async def get_yellow_river_basin():
    """Get Yellow River Basin boundary as GeoJSON.

    Returns:
        GeoJSON containing the Yellow River Basin boundary geometry.
    """
    try:
        # Check cache first
        if "yellow_river_basin" in GEOJSON_CACHE:
            return GEOJSON_CACHE["yellow_river_basin"]

        # Path to the shapefile (from config)
        shp_path = (
            Path.home() / "Documents/Datasets/黄河流域矢量图/空间范围/huanghe.shp"
        )

        if not shp_path.exists():
            raise HTTPException(
                status_code=404, detail="Yellow River Basin shapefile not found"
            )

        # Read shapefile and convert to GeoJSON
        gdf = gpd.read_file(shp_path)

        # Convert to WGS84 if needed
        if gdf.crs != "EPSG:4326":
            gdf = gdf.to_crs("EPSG:4326")

        # Convert to GeoJSON
        geojson = gdf.__geo_interface__

        # Cache the result
        GEOJSON_CACHE["yellow_river_basin"] = geojson

        return geojson
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error loading Yellow River Basin data: {str(e)}"
        )
