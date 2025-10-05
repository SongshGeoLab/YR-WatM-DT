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
from typing import Dict, List, Optional

import polars as pl
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATA_PARQUET = Path("data_parquet")
DATA_DIR = Path("data")


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


def _read_scenarios() -> pl.DataFrame:
    return pl.read_parquet(DATA_PARQUET / "scenarios.parquet")


def _read_time() -> pl.DataFrame:
    return pl.read_parquet(DATA_PARQUET / "time.parquet")


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
            "/params",
            "/resolve_scenario",
            "/time",
            "/series?variable=YRB%20WSI&scenario=sc_0",
        ],
    }


@app.get("/variables")
def get_variables() -> List[str]:
    return _read_variables()


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
    variables = set(_read_variables())
    if variable not in variables:
        raise HTTPException(status_code=400, detail=f"Unknown variable: {variable}")
    var_path = DATA_PARQUET / f"{variable}.parquet"
    if not var_path.exists():
        raise HTTPException(status_code=404, detail="Variable parquet not found")

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
