"""Build static data files for the static frontend deployment.

Reads the raw parquet data and converts it into compact JSON files under
``viz/public/static-data/``, so the frontend can run without the FastAPI
backend. Time series are downsampled from 1/16-year steps to yearly means.

Outputs:
    viz/public/static-data/
        series/<safe_name>.json   {scenario_name: [yearly values...]}
        time.json                 {"years": [1981, ..., 2100], "step0_year": 1981}
        scenarios.json            all scenarios with their 7 parameter values
        params.json               parameter name -> sorted unique values
        variables_map.json        original name -> safe name
        climate_data.json         precipitation/temperature by RCP scenario
        scenarios_preset.json     copy of config/scenarios_preset.json
        explanations.json         copy of config/explanations.yaml
        swntp.geojson             converted from data/shp/SWNP
        loess_plateau.geojson     converted from data/shp/Losses
        main_river.geojson        converted from data/shp/mainRiver
        stations.geojson          converted from data/shp/stations

Usage:
    python scripts/build_static_data.py
"""

from __future__ import annotations

import json
from pathlib import Path

import geopandas as gpd
import polars as pl
import yaml

ROOT = Path(__file__).resolve().parent.parent
DATA_PARQUET = ROOT / "data_parquet"
DATA_DIR = ROOT / "data"
CONFIG_DIR = ROOT / "config"
OUT_DIR = ROOT / "viz" / "public" / "static-data"

# Variables actually consumed by the frontend (see variables_map.json).
ACTIVE_VARS = [
    "YRB available surface water",
    "irrigation water demand province sum",
    "production water demand province sum",
    "OA water demand province sum",
    "domestic water demand province sum",
    "water consumption of province in YRB sum",
    "YRB WSI",
    "Total population",
]

STEPS_PER_YEAR = 16
STEP0_YEAR = 1981


def yearly_mean(df: pl.DataFrame) -> dict[str, list[float]]:
    """Downsample (scenario, step, value) rows to per-scenario yearly means."""
    agg = (
        df.with_columns((pl.col("step") // STEPS_PER_YEAR).alias("year"))
        .group_by(["scenario_name", "year"])
        .agg(pl.col("value").mean())
        .sort(["scenario_name", "year"])
    )
    piv = agg.pivot(index="scenario_name", on="year", values="value")
    out: dict[str, list[float]] = {}
    for row in piv.iter_rows():
        sc_name = row[0]
        out[sc_name] = [round(float(v), 3) for v in row[1:]]
    return out


def build_series() -> None:
    vm = json.loads((DATA_PARQUET / "variables_map.json").read_text())
    (OUT_DIR / "series").mkdir(parents=True, exist_ok=True)
    for var_name in ACTIVE_VARS:
        safe = vm[var_name]
        src = DATA_PARQUET / f"{safe}.parquet"
        df = pl.scan_parquet(src).select("scenario_name", "step", "value")
        data = yearly_mean(df.collect())
        dest = OUT_DIR / "series" / f"{safe}.json"
        dest.write_text(json.dumps(data, separators=(",", ":")))
        n = len(data)
        print(f"  {safe}: {n} scenarios -> {dest.name} ({dest.stat().st_size/1e6:.1f}MB)")


def build_time() -> None:
    t = pl.read_parquet(DATA_PARQUET / "time.parquet")
    n_years = (t["step"].max() // STEPS_PER_YEAR) + 1
    years = [STEP0_YEAR + i for i in range(n_years)]
    (OUT_DIR / "time.json").write_text(
        json.dumps({"years": years, "step0_year": STEP0_YEAR}, separators=(",", ":"))
    )
    print(f"  time: {n_years} years ({years[0]}-{years[-1]})")


def build_scenarios() -> None:
    sc = pl.read_parquet(DATA_PARQUET / "scenarios.parquet")
    rows = sc.to_dicts()
    (OUT_DIR / "scenarios.json").write_text(
        json.dumps(rows, separators=(",", ":"))
    )
    params = {
        c: sorted(sc[c].unique().to_list())
        for c in sc.columns
        if c != "scenario_name"
    }
    (OUT_DIR / "params.json").write_text(
        json.dumps(params, separators=(",", ":"))
    )
    print(f"  scenarios: {len(rows)} rows; params: {len(params)} keys")


def build_climate() -> None:
    out = {"precipitation": {}, "temperature": {}}
    for scenario in ["ssp126", "ssp245", "ssp585"]:
        pe = pl.read_parquet(DATA_PARQUET / "rcp_ssp" / "pe_data.parquet")
        pe = pe.filter(pl.col("Scenario") == scenario)
        pe = pe.filter(pl.col("Value").is_finite() & pl.col("Value").is_not_null())
        out["precipitation"][scenario] = {
            "years": pe["Year"].to_list(),
            "values": [round(float(v), 3) for v in pe["Value"].to_list()],
        }
        tas = pl.read_parquet(DATA_PARQUET / "rcp_ssp" / "tas_data.parquet")
        tas = tas.filter(
            (pl.col("Scenario") == scenario) & (pl.col("CropType") == "taxavg")
        )
        tas = tas.filter(pl.col("Value").is_finite() & pl.col("Value").is_not_null())
        out["temperature"][scenario] = {
            "years": tas["Year"].to_list(),
            "values": [round(float(v), 3) for v in tas["Value"].to_list()],
        }
    (OUT_DIR / "climate_data.json").write_text(
        json.dumps(out, separators=(",", ":"))
    )
    print("  climate_data: 3 RCP scenarios x (precipitation, temperature)")


def build_config() -> None:
    preset = CONFIG_DIR / "scenarios_preset.json"
    (OUT_DIR / "scenarios_preset.json").write_text(preset.read_text())
    expl = yaml.safe_load((CONFIG_DIR / "explanations.yaml").read_text())
    (OUT_DIR / "explanations.json").write_text(
        json.dumps(expl.get("explanations", {}), separators=(",", ":"))
    )
    (OUT_DIR / "variables_map.json").write_text(
        json.dumps(
            {
                "name_to_safe": json.loads((DATA_PARQUET / "variables_map.json").read_text()),
            },
            separators=(",", ":"),
        )
    )
    print("  config: scenarios_preset, explanations, variables_map")


def build_geojson() -> None:
    shp = {
        "swntp": DATA_DIR / "shp" / "SWNP" / "SWNP.shp",
        "loess_plateau": DATA_DIR / "shp" / "Losses" / "loess_plateau.shp",
        "main_river": DATA_DIR / "shp" / "mainRiver" / "mainYR.shp",
        "stations": DATA_DIR / "shp" / "stations" / "5stations.shp",
    }
    for name, path in shp.items():
        gdf = gpd.read_file(path)
        if gdf.crs and str(gdf.crs) != "EPSG:4326":
            gdf = gdf.to_crs("EPSG:4326")
        geojson = json.loads(gdf.to_json())
        dest = OUT_DIR / f"{name}.geojson"
        dest.write_text(json.dumps(geojson, separators=(",", ":")))
        print(f"  {name}: {len(geojson.get('features', []))} features -> {dest.name}")
    # Basin geojson already ships with the frontend (viz/public).


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Building static data...")
    build_time()
    build_scenarios()
    build_climate()
    build_config()
    build_geojson()
    build_series()
    total = sum(f.stat().st_size for f in OUT_DIR.rglob("*") if f.is_file())
    print(f"Done. Total: {total/1e6:.1f}MB in {OUT_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
