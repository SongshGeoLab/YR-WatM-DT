"""Minimal Dash + Plotly app for exploring VISUM Decision Theater outputs.

This app reads Parquet artifacts produced by scripts/preprocess_to_parquet.py
and provides interactive selection of variable and scenario, rendering a
time series chart.

Run
    poetry run python scripts/dash_app.py --data-parquet data_parquet

Google-style docstrings are used throughout.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import List

import plotly.graph_objects as go
import polars as pl
from dash import ALL, Dash, Input, Output, dcc, html


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments.

    Returns:
        argparse.Namespace: Parsed arguments containing paths and host/port.
    """

    parser = argparse.ArgumentParser(description="Run Dash explorer app")
    parser.add_argument(
        "--data-parquet",
        type=Path,
        default=Path("data_parquet"),
        help="Directory containing Parquet dataset",
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path("data"),
        help="Directory containing metadata.json (used for variable list)",
    )
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8050)
    return parser.parse_args()


def read_variables_from_metadata(metadata_path: Path) -> List[str]:
    """Read variable names from metadata.json, excluding TIME.

    Args:
        metadata_path: Path to metadata.json

    Returns:
        List[str]: Variable names.
    """
    with metadata_path.open("r", encoding="utf-8") as f:
        meta = json.load(f)
    names: List[str] = []
    for item in meta.get("outcomes", []):
        if not isinstance(item, list) or len(item) < 3:
            continue
        _, name, _ = item[:3]
        if name == "TIME":
            continue
        names.append(name)
    return names


def build_app(data_parquet: Path, data_dir: Path) -> Dash:
    """Create Dash app with variable/scenario selectors and a time series figure.

    Args:
        data_parquet: Directory containing time.parquet, scenarios.parquet, and variable parquet files
        data_dir: Directory containing metadata.json

    Returns:
        Dash: Configured Dash application.
    """
    time_df = pl.read_parquet(data_parquet / "time.parquet")
    scenarios_df = pl.read_parquet(data_parquet / "scenarios.parquet")
    # Parameter columns (all columns except scenario_name)
    param_cols = [c for c in scenarios_df.columns if c != "scenario_name"]
    # Unique sorted values per parameter
    param_values = {
        p: scenarios_df.get_column(p).unique().sort().to_list() for p in param_cols
    }
    # Baseline defaults from first row
    baseline = scenarios_df.head(1).to_dicts()[0]

    variables = read_variables_from_metadata(data_dir / "metadata.json")
    variables = sorted(variables)

    app = Dash(__name__)
    app.title = "Decision Theater Explorer"

    app.layout = html.Div(
        [
            html.H3("Decision Theater Explorer"),
            html.Div(
                [
                    html.Div(
                        [
                            html.Label("Variable"),
                            dcc.Dropdown(
                                id="variable",
                                options=[{"label": v, "value": v} for v in variables],
                                value=variables[0] if variables else None,
                                clearable=False,
                            ),
                        ],
                        style={
                            "width": "32%",
                            "display": "inline-block",
                            "verticalAlign": "top",
                        },
                    ),
                    html.Div(
                        [
                            html.Label("Scenario (auto from parameters)"),
                            dcc.Input(
                                id="scenario",
                                type="text",
                                readOnly=True,
                                style={"width": "100%"},
                            ),
                        ],
                        style={
                            "width": "32%",
                            "display": "inline-block",
                            "marginLeft": "2%",
                            "verticalAlign": "top",
                        },
                    ),
                ],
                style={"marginBottom": "12px"},
            ),
            html.Details(
                [html.Summary("Parameters (select values to locate scenario)")]
            ),
            html.Div(
                [
                    html.Div(
                        [
                            html.Label(p),
                            dcc.Dropdown(
                                id={"type": "param", "name": p},
                                options=[
                                    {"label": str(v), "value": v}
                                    for v in param_values[p]
                                ],
                                value=baseline.get(p),
                                clearable=False,
                            ),
                        ],
                        style={
                            "width": "32%",
                            "display": "inline-block",
                            "marginRight": "2%",
                            "verticalAlign": "top",
                        },
                    )
                    for p in param_cols
                ],
                style={"marginBottom": "12px"},
            ),
            dcc.Graph(id="series-plot", style={"height": "70vh"}),
        ],
        style={"padding": "16px"},
    )

    @app.callback(
        Output("series-plot", "figure"),
        Output("scenario", "value"),
        Input("variable", "value"),
        Input({"type": "param", "name": ALL}, "value"),
        prevent_initial_call=False,
    )
    def update_figure_from_params(variable: str, selected_values: list):  # noqa: D401
        """Update figure and resolved scenario based on selected parameters."""
        if not variable or not selected_values:
            return go.Figure(), ""

        # Build filter expression in the order of param_cols used in layout
        conditions = [pl.col(p) == v for p, v in zip(param_cols, selected_values)]
        if not conditions:
            return go.Figure(), ""
        matched = scenarios_df.filter(pl.all_horizontal(conditions))
        if matched.height == 0:
            fig = go.Figure()
            fig.update_layout(title="No scenario matches the selected parameters")
            return fig, ""
        scenario_name = matched.get_column("scenario_name").item()

        var_path = data_parquet / f"{variable}.parquet"
        if not var_path.exists():
            fig = go.Figure()
            fig.update_layout(title=f"Missing Parquet for variable: {variable}")
            return fig, scenario_name

        df = pl.read_parquet(var_path).filter(pl.col("scenario_name") == scenario_name)
        df = df.join(time_df, on="step", how="left").sort("step")

        fig = go.Figure()
        fig.add_trace(
            go.Scatter(
                x=df.get_column("time").to_list(),
                y=df.get_column("value").to_list(),
                mode="lines",
                name=f"{variable} | {scenario_name}",
            )
        )
        fig.update_layout(
            xaxis_title="Time",
            yaxis_title=variable,
            margin=dict(l=40, r=20, t=60, b=40),
        )
        return fig, scenario_name

    return app


def main() -> None:
    """Entrypoint to start the Dash application."""
    args = parse_args()
    app = build_app(args.data_parquet, args.data_dir)
    app.run_server(host=args.host, port=args.port, debug=False)


if __name__ == "__main__":
    main()
