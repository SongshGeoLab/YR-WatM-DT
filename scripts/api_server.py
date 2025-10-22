"""FastAPI server exposing Parquet-backed data endpoints for visualization.

Core Endpoints:
    GET  /variables                 -> list of variable names (excluding TIME)
    GET  /params                    -> mapping of parameter name -> unique values
    POST /resolve_scenario          -> resolve scenario_name from parameter values
    GET  /time                      -> time vector [{step, time}, ...]
    GET  /series                    -> variable series for single scenario (optional window)
    GET  /series/multi              -> variable series for multiple scenarios with "Any" logic
    GET  /series/statistics         -> peak/valley/trend statistics for time series

Analysis Endpoints:
    GET  /analysis/sensitivity      -> sensitivity analysis for parameter impacts (NEW)

Configuration Endpoints:
    GET  /config/terminology        -> parameter display labels
    GET  /config/scenarios_preset   -> predefined scenario combinations
    GET  /config/water_stress       -> water stress thresholds
    GET  /config/explanations/{key} -> explanation content

Data Endpoints:
    GET  /climate-data              -> RCP scenario climate data
    GET  /yellow-river-basin        -> basin boundary GeoJSON
    GET  /basin/geojson             -> basin boundary GeoJSON (alias)
    GET  /page5-data                -> water demand analysis

Run:
    make dev                        -> full-stack dev server (recommended)
    poetry run uvicorn scripts.api_server:app --host 0.0.0.0 --port 8000 --reload

API Docs:
    http://127.0.0.1:8000/docs      -> interactive API documentation

Google-style docstrings are used.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Union, cast

import geopandas as gpd
import pandas as pd
import polars as pl
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from src.core.config_loader import get_config_loader

# Add src to path for config loader
sys.path.insert(0, str(Path(__file__).parent.parent))

DATA_PARQUET = Path("data_parquet")
DATA_DIR = Path("data")
GEOJSON_CACHE: Dict[str, dict] = {}
_VARIABLES_MAP_CACHE: Optional[Dict[str, str]] = None  # original_name -> safe_name

# Global query instance for caching
_query_instance: Optional[Any] = None


def _get_query_instance() -> Any:
    """Get or create global query instance with caching enabled."""
    global _query_instance
    if _query_instance is None:
        print("🚀 Initializing ScenarioQuery with caching...")
        from scripts.query_scenarios import ScenarioQuery

        _query_instance = ScenarioQuery(DATA_PARQUET)
        print("✅ ScenarioQuery initialized with cache")
    return _query_instance


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
# NOTE: For production, set API_CORS_ALLOW_ORIGINS environment variable to restrict origins
# Development default allows all origins for easier testing
_allowed_origins_env = os.getenv("API_CORS_ALLOW_ORIGINS", "")
if _allowed_origins_env:
    # Production: use specific origins from environment
    _allowed_origins = _allowed_origins_env.split(",")
else:
    # Development: allow all origins
    _allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for GeoJSON data
app.mount("/static", StaticFiles(directory="data"), name="static")


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
            '/series/multi?variable=YRB%20WSI&filters={"Climate change scenario switch for water yield": 2}&aggregate=true',
            "/series/statistics?variable=YRB%20WSI&scenario=sc_0",
            "/analysis/sensitivity?vary_param=Fertility%20Variation&metric=cv&top_n=10",
            "/basin/geojson",
            "/config/terminology",
            "/config/scenarios_preset",
            "/config/explanations",
            "/config/water_stress",
            "/page5-data",
            "/climate-data",
            "/yellow-river-basin",
        ],
    }


@app.get("/config/terminology")
def get_terminology(lang: str = Query("en", pattern="^(en|cn)$")) -> Dict[str, Any]:
    """Get terminology mappings for parameter display labels.

    Args:
        lang: Language code ('en' or 'cn'). Defaults to 'en'.

    Returns:
        Dictionary mapping parameter keys to display labels and descriptions.
    """
    config_loader = get_config_loader()
    return config_loader.get_terminology(lang=lang)


@app.get("/config/scenarios_preset")
def get_scenarios_preset(
    lang: str = Query("en", pattern="^(en|cn)$"),
) -> List[Dict[str, Any]]:
    """Get preset scenario configurations.

    Args:
        lang: Language code ('en' or 'cn'). Defaults to 'en'.

    Returns:
        List of preset scenarios with parameters and descriptions.
    """
    config_loader = get_config_loader()
    return config_loader.get_preset_scenarios(lang=lang)


@app.get("/config/water_stress")
def get_water_stress_config() -> Dict[str, Any]:
    """Get water stress index configuration including thresholds and colors.

    Returns:
        Water stress configuration dictionary.
    """
    config_loader = get_config_loader()
    return config_loader.get_water_stress_config()


@app.get("/config/explanations/{key}")
def get_explanation(
    key: str, lang: str = Query("en", pattern="^(en|cn)$")
) -> Dict[str, Any]:
    """Get explanation content for a specific topic.

    Args:
        key: Explanation key (e.g., 'diet_water_footprint').
        lang: Language code ('en' or 'cn'). Defaults to 'en'.

    Returns:
        Explanation content with title and detailed text.

    Raises:
        HTTPException: If explanation key not found.
    """
    config_loader = get_config_loader()
    explanation = config_loader.get_explanation(key, lang=lang)

    if explanation is None:
        raise HTTPException(
            status_code=404, detail=f"Explanation not found for key: {key}"
        )

    return explanation


@app.get("/cache/stats")
def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics and performance metrics.

    Returns:
        Dictionary with cache statistics including memory usage, hit rates, etc.
    """
    try:
        query = _get_query_instance()
        stats = query.get_cache_stats()

        # Add additional performance metrics
        stats.update(
            {
                "cache_enabled": True,
                "default_scenarios_precomputed": len(query.default_scenario_cache),
                "cache_directory": str(query.cache_dir),
            }
        )

        return stats
    except Exception as e:
        return {"cache_enabled": False, "error": str(e)}


@app.post("/cache/clear")
def clear_cache() -> Dict[str, str]:
    """Clear all cached query results.

    Returns:
        Success message.
    """
    try:
        query = _get_query_instance()
        query.clear_cache()
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")


@app.get("/cache/warmup")
def warmup_cache() -> Dict[str, Any]:
    """Warm up cache with common queries.

    This endpoint pre-computes frequently used queries to improve performance.

    Returns:
        Statistics about the warmup process.
    """
    try:
        query = _get_query_instance()

        # Get list of common variables
        variables = _read_variables()[:5]  # Limit to first 5 variables

        warmup_stats: Dict[str, Any] = {
            "variables_processed": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "errors": [],
        }

        # Warm up default scenarios (already done in initialization)
        warmup_stats["default_scenarios"] = len(query.default_scenario_cache)

        # Warm up some common filter combinations
        common_filters = [
            {
                "Climate change scenario switch for water yield": [1, 2]
            },  # RCP2.6 & RCP4.5
            {"Fertility Variation": 1.7},  # Default fertility
            {"Diet change scenario switch": 2},  # Default diet
        ]

        for var in variables:
            for filters in common_filters:
                try:
                    # This will either hit cache or compute and cache
                    query.get_series(var, filters=filters)
                    warmup_stats["variables_processed"] = (
                        warmup_stats["variables_processed"] + 1
                    )
                except Exception as e:
                    cast(List[str], warmup_stats["errors"]).append(f"{var}: {str(e)}")

        return warmup_stats

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cache warmup failed: {str(e)}")


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
    elif matched.height == 1:
        scenario_name = matched.get_column("scenario_name").item()
        return {"scenario_name": scenario_name}
    else:
        # Multiple scenarios match (e.g., with and without SNWTP) - return the first one
        # This is for backward compatibility with frontend that expects a single scenario
        scenario_name = matched.get_column("scenario_name").item(0)
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


@app.get("/series/multi")
def get_series_multi(
    variable: str = Query(..., description="Variable name to query"),
    filters: str = Query(
        ...,
        description="JSON string with parameter filters. Supports lists for 'Any' logic, e.g. '{\"Fertility Variation\": [1.6, 1.7], \"Climate change scenario switch for water yield\": 2}'",
    ),
    start_year: Optional[int] = Query(
        None, ge=1900, description="Start year for time window"
    ),
    end_year: Optional[int] = Query(
        None, ge=1900, description="End year for time window"
    ),
    aggregate: bool = Query(
        True,
        description="If True, return aggregated statistics (mean, CI); if False, return all scenario data separately",
    ),
) -> Dict[str, Any]:
    """Get time series for multiple scenarios matching flexible parameter filters.

    This endpoint supports the 'Any' logic for parameters - you can specify:
    - Single value: exact match (e.g., {"Fertility Variation": 1.6})
    - List of values: match any (e.g., {"Climate scenario": [1, 2, 3]})
    - Omit parameter: no constraint on that parameter

    Args:
        variable: Variable name to retrieve.
        filters: JSON string mapping parameter names to values or lists.
        start_year: Optional start year to filter time series.
        end_year: Optional end year to filter time series.
        aggregate: If True, return mean/CI/min/max across scenarios; if False, return raw data for each scenario.

    Returns:
        If aggregate=True:
            {
                "variable": str,
                "n_scenarios": int,
                "filter_summary": {...},
                "series": {
                    "time": [...],
                    "mean": [...],
                    "std": [...],
                    "ci_lower": [...],
                    "ci_upper": [...],
                    "min": [...],
                    "max": [...]
                }
            }
        If aggregate=False:
            {
                "variable": str,
                "n_scenarios": int,
                "scenarios": [
                    {"scenario_name": "sc_0", "parameters": {...}, "series": {"time": [...], "value": [...]}},
                    ...
                ]
            }
    """
    try:
        query = _get_query_instance()

        # Parse filters from JSON string
        try:
            filter_dict = json.loads(filters)
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid JSON in filters parameter: {str(e)}",
            )

        # Build time range
        time_range = None
        if start_year is not None and end_year is not None:
            time_range = (start_year, end_year)
        elif start_year is not None:
            time_range = (start_year, 2100)  # Default upper bound
        elif end_year is not None:
            time_range = (2020, end_year)  # Default lower bound

        # Query data using ScenarioQuery
        data = query.get_series(
            variables=variable,
            filters=filter_dict,
            time_range=time_range,
            include_params=True,
        )

        if data.height == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No scenarios found matching filters: {filter_dict}",
            )

        n_scenarios = data["scenario_name"].n_unique()

        # Get parameter columns for metadata
        param_cols = [
            c
            for c in data.columns
            if c not in ["scenario_name", "step", "time", "value", "variable"]
        ]

        if aggregate:
            # Aggregate across multiple scenarios
            stats = (
                data.group_by(["step", "time"])
                .agg(
                    [
                        pl.col("value").mean().alias("mean"),
                        pl.col("value").std().alias("std"),
                        pl.col("value").min().alias("min"),
                        pl.col("value").max().alias("max"),
                        pl.col("value").quantile(0.05).alias("p05"),
                        pl.col("value").quantile(0.95).alias("p95"),
                        pl.col("scenario_name").n_unique().alias("n_scenarios"),
                    ]
                )
                .with_columns(
                    [
                        # Calculate standard error for 95% CI of the mean
                        # Handle null std and ensure n_scenarios > 0
                        (
                            pl.when(pl.col("n_scenarios") > 1)
                            .then(
                                pl.col("std").fill_null(0)
                                / pl.col("n_scenarios").cast(pl.Float64).sqrt()
                            )
                            .otherwise(pl.col("std").fill_null(0))
                        ).alias("se"),
                    ]
                )
                .with_columns(
                    [
                        (pl.col("mean") - 1.96 * pl.col("se")).alias("ci_lower"),
                        (pl.col("mean") + 1.96 * pl.col("se")).alias("ci_upper"),
                    ]
                )
                .sort("step")
            )

            # Build filter summary showing what values were actually matched
            filter_summary = {}
            for param in param_cols:
                unique_vals = data[param].unique().sort().to_list()
                filter_summary[param] = {
                    "requested": filter_dict.get(param, "any"),
                    "matched": (
                        unique_vals
                        if len(unique_vals) <= 10
                        else f"{len(unique_vals)} values"
                    ),
                }

            return {
                "variable": variable,
                "n_scenarios": int(n_scenarios),
                "filter_summary": filter_summary,
                "series": {
                    "time": stats["time"].to_list(),
                    "mean": stats["mean"].to_list(),
                    "std": stats["std"].to_list(),
                    "ci_lower": stats["ci_lower"].to_list(),
                    "ci_upper": stats["ci_upper"].to_list(),
                    "min": stats["min"].to_list(),
                    "max": stats["max"].to_list(),
                    "p05": stats["p05"].to_list(),
                    "p95": stats["p95"].to_list(),
                },
            }
        else:
            # Return all scenarios separately
            scenarios = []
            for scenario_name in data["scenario_name"].unique().to_list():
                scenario_data = data.filter(
                    pl.col("scenario_name") == scenario_name
                ).sort("step")

                # Extract parameter values for this scenario
                params = {}
                if scenario_data.height > 0:
                    for param in param_cols:
                        params[param] = scenario_data[param][0]

                scenarios.append(
                    {
                        "scenario_name": scenario_name,
                        "parameters": params,
                        "series": {
                            "time": scenario_data["time"].to_list(),
                            "value": scenario_data["value"].to_list(),
                        },
                    }
                )

            return {
                "variable": variable,
                "n_scenarios": len(scenarios),
                "scenarios": scenarios,
            }

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error querying multi-scenario data: {str(e)}"
        )


@app.get("/series/statistics")
def get_series_statistics(
    variable: str = Query(...),
    scenario: str = Query(...),
    start_year: int = Query(2020, ge=1900),
    end_year: int = Query(2100, ge=1900),
) -> Dict[str, Any]:
    """Calculate statistics for a time series including peak and valley values.

    Args:
        variable: Variable name.
        scenario: Scenario name.
        start_year: Start year for analysis window. Defaults to 2020.
        end_year: End year for analysis window. Defaults to 2100.

    Returns:
        Dictionary containing peak, valley, mean, and trend statistics.
    """
    # Get variable data
    var_path = _resolve_variable_to_path(variable)
    if not var_path.exists():
        raise HTTPException(
            status_code=404, detail=f"Variable parquet not found for '{variable}'"
        )

    # Load and filter data
    df = pl.read_parquet(var_path).filter(pl.col("scenario_name") == scenario)
    if df.height == 0:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{scenario}' not found for variable '{variable}'",
        )

    # Join with time and filter by year range
    df = df.join(_read_time(), on="step", how="left").sort("step")
    df = df.filter((pl.col("time") >= start_year) & (pl.col("time") <= end_year))

    if df.height == 0:
        raise HTTPException(
            status_code=400, detail=f"No data in year range {start_year}-{end_year}"
        )

    # Calculate statistics
    values = df.get_column("value")
    times = df.get_column("time")

    # Find peak (maximum)
    peak_idx = values.arg_max()
    peak_value = float(values[peak_idx])
    peak_year = float(times[peak_idx])

    # Find valley (minimum)
    valley_idx = values.arg_min()
    valley_value = float(values[valley_idx])
    valley_year = float(times[valley_idx])

    # Calculate basic statistics
    mean_value = float(values.mean())
    std_value = float(values.std())

    # Calculate trend (simple linear trend)
    if df.height > 1:
        first_value = float(values[0])
        last_value = float(values[-1])
        time_span = float(times[-1] - times[0])

        if time_span > 0:
            trend = (last_value - first_value) / time_span  # change per year
        else:
            trend = 0.0
    else:
        trend = 0.0

    return {
        "variable": variable,
        "scenario": scenario,
        "year_range": {"start": start_year, "end": end_year},
        "peak": {"value": peak_value, "year": int(peak_year)},
        "valley": {"value": valley_value, "year": int(valley_year)},
        "mean": mean_value,
        "std": std_value,
        "trend": trend,
        "range": peak_value - valley_value,
        "data_points": df.height,
    }


@app.get("/reports/{filename}")
def get_report_file(filename: str):
    """Serve report files (JSON, images, etc.) from the reports directory.

    Security: Validates path to prevent directory traversal attacks.
    """
    base_dir = Path("reports").resolve()
    file_path = (base_dir / filename).resolve()

    # Enforce containment: prevent path traversal (e.g., ../../etc/passwd)
    if not str(file_path).startswith(str(base_dir) + os.sep):
        raise HTTPException(status_code=400, detail="Invalid path")

    if not file_path.exists() or not file_path.is_file():
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
    based on water saving irrigation efficiency ratio and fire generation share parameters.
    """
    try:
        # Import the Page5 analysis functions
        import sys
        from pathlib import Path

        sys.path.insert(0, str(Path(__file__).parent.parent))

        # Initialize query engine
        query = _get_query_instance()

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
            "water saving irrigation efficiency ratio": water_saving_ratio,
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
                    # Calculate standard error for 95% CI of the mean
                    # Handle null std and ensure n_scenarios > 0
                    (
                        pl.when(pl.col("n_scenarios") > 1)
                        .then(
                            pl.col("std").fill_null(0)
                            / pl.col("n_scenarios").cast(pl.Float64).sqrt()
                        )
                        .otherwise(pl.col("std").fill_null(0))
                    ).alias("se"),
                ]
            )
            .with_columns(
                [
                    (pl.col("mean") - 1.96 * pl.col("se")).alias("ci_lower"),
                    (pl.col("mean") + 1.96 * pl.col("se")).alias("ci_upper"),
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
        for scenario in ["ssp126", "ssp245", "ssp585"]:
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

        # Process temperature data (use only average temperature: taxavg)
        tas_processed = {}
        for scenario in ["ssp126", "ssp245", "ssp585"]:
            if scenario in tas_df["Scenario"].values:
                scenario_data = tas_df[
                    (tas_df["Scenario"] == scenario)
                    & (tas_df["CropType"] == "taxavg")  # Only use average temperature
                ]
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

        # Path to the GeoJSON file in project directory
        geojson_path = DATA_DIR / "yellow_river_basin.geojson"

        if not geojson_path.exists():
            raise HTTPException(
                status_code=404, detail="Yellow River Basin GeoJSON not found"
            )

        # Read GeoJSON file
        with open(geojson_path, "r", encoding="utf-8") as f:
            geojson = json.load(f)

        # Cache the result
        GEOJSON_CACHE["yellow_river_basin"] = geojson

        return geojson
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error loading Yellow River Basin data: {str(e)}"
        )


@app.get("/analysis/sensitivity")
def analyze_sensitivity(
    vary_param: str = Query(
        ..., description="Parameter name to vary (e.g., 'Fertility Variation')"
    ),
    fixed_params: Optional[str] = Query(
        None,
        description="JSON string of fixed parameters, e.g. '{\"Climate change scenario switch for water yield\": 2}'",
    ),
    variables: Optional[str] = Query(
        None,
        description="JSON array of variables to test. If None, tests all variables.",
    ),
    start_year: Optional[int] = Query(
        None, ge=1900, description="Start year for analysis"
    ),
    end_year: Optional[int] = Query(None, ge=1900, description="End year for analysis"),
    metric: str = Query(
        "cv",
        pattern="^(cv|range|range_pct|std|iqr)$",
        description="Sensitivity metric: cv, range, range_pct, std, or iqr",
    ),
    top_n: Optional[int] = Query(None, ge=1, description="Return only top N results"),
) -> Dict[str, Any]:
    """Test sensitivity of variables to parameter changes.

    Analyzes how changing one parameter affects different variables,
    while optionally fixing other parameters. Returns variables ranked
    by their sensitivity to the varying parameter.

    Args:
        vary_param: Parameter to vary.
        fixed_params: Optional JSON string of fixed parameters.
        variables: Optional JSON array of variables to test.
        start_year: Optional start year.
        end_year: Optional end year.
        metric: Sensitivity metric (cv, range, range_pct, std, iqr).
        top_n: Return only top N most sensitive variables.

    Returns:
        {
            "vary_param": str,
            "vary_values": [...],
            "fixed_params": {...},
            "metric": str,
            "results": [
                {
                    "variable": str,
                    "sensitivity": float,
                    "mean_value": float,
                    "std_value": float,
                    "min_value": float,
                    "max_value": float,
                    "range_value": float,
                    "cv": float,
                    "n_scenarios": int
                },
                ...
            ]
        }

    Example:
        GET /analysis/sensitivity?vary_param=Fertility%20Variation&\
fixed_params={"Climate%20change%20scenario%20switch%20for%20water%20yield":2}&\
metric=cv&top_n=10
    """
    try:
        from scripts.analysis_helpers import sensitivity_test

        query_engine = _get_query_instance()

        # Parse fixed parameters
        fixed_params_dict = None
        if fixed_params:
            try:
                fixed_params_dict = json.loads(fixed_params)
            except json.JSONDecodeError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid JSON in fixed_params: {str(e)}",
                )

        # Parse variables list
        variables_list = None
        if variables:
            try:
                variables_list = json.loads(variables)
            except json.JSONDecodeError as e:
                raise HTTPException(
                    status_code=400, detail=f"Invalid JSON in variables: {str(e)}"
                )

        # Build time range
        time_range = None
        if start_year is not None and end_year is not None:
            time_range = (start_year, end_year)
        elif start_year is not None:
            time_range = (start_year, 2100)
        elif end_year is not None:
            time_range = (2020, end_year)

        # Run sensitivity test
        results_df = sensitivity_test(
            query_engine,
            vary_param=vary_param,
            fixed_params=fixed_params_dict,
            variables=variables_list,
            time_range=time_range,
            metric=metric,
        )

        # Limit to top N if requested
        if top_n is not None:
            results_df = results_df.head(top_n)

        # Get vary parameter values
        vary_values = query_engine.scenarios[vary_param].unique().sort().to_list()

        return {
            "vary_param": vary_param,
            "vary_values": vary_values,
            "fixed_params": fixed_params_dict or {},
            "metric": metric,
            "time_range": {
                "start": start_year or 2020,
                "end": end_year or 2100,
            },
            "n_variables": results_df.height,
            "results": results_df.to_dicts(),
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error in sensitivity analysis: {str(e)}"
        )
