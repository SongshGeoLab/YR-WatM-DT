"""Visualization helpers for multi-scenario analysis with Plotly.

This module provides convenient functions to visualize scenario query results
using Plotly, with built-in support for confidence intervals and multi-scenario
comparisons.

Usage:
    from scripts.viz_helpers import plot_multi_scenario, plot_scenario_comparison
    from scripts.query_scenarios import ScenarioQuery

    query = ScenarioQuery("data_parquet")
    data = query.get_series("Total population", filters={...})

    # One-line plotting
    fig = plot_multi_scenario(data, title="Population Projection")
    fig.show()

Google-style docstrings are used.
"""

from typing import Dict, Optional

import plotly.express as px
import plotly.graph_objects as go
import polars as pl


def plot_multi_scenario(
    data: pl.DataFrame,
    title: str = "Multi-Scenario Analysis",
    xlabel: str = "Year",
    ylabel: str = "Value",
    show_ci: bool = True,
    show_range: bool = False,
    show_quantiles: bool = False,
    color: str = "#2E86AB",
    height: int = 600,
    width: int = 1000,
) -> go.Figure:
    """Plot multi-scenario time series with statistics.

    Automatically aggregates data across scenarios and plots mean, confidence
    intervals, and optionally min-max range and quantiles.

    Args:
        data: Polars DataFrame from ScenarioQuery.get_series()
        title: Plot title
        xlabel: X-axis label
        ylabel: Y-axis label
        show_ci: Show 95% confidence interval
        show_range: Show min-max range
        show_quantiles: Show 5th and 95th percentiles
        color: Primary color for the mean line
        height: Plot height in pixels
        width: Plot width in pixels

    Returns:
        Plotly Figure object

    Example:
        >>> from scripts.query_scenarios import ScenarioQuery
        >>> from scripts.viz_helpers import plot_multi_scenario
        >>>
        >>> query = ScenarioQuery("data_parquet")
        >>> data = query.get_series(
        ...     "Total population",
        ...     filters={"Climate change scenario switch for water yield": 2}
        ... )
        >>>
        >>> fig = plot_multi_scenario(
        ...     data,
        ...     title="Population - RCP4.5",
        ...     ylabel="Population (万人)"
        ... )
        >>> fig.show()
    """
    # Calculate statistics
    stats = (
        data.group_by("time")
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
                # Calculate standard error for 95% CI of the mean (not observation uncertainty)
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
        .sort("time")
    )

    n_scenarios = stats["n_scenarios"][0]

    # Convert to pandas for Plotly
    stats_pd = stats.to_pandas()

    # Create figure
    fig = go.Figure()

    # Add min-max range (lightest shade)
    if show_range:
        fig.add_trace(
            go.Scatter(
                x=stats_pd["time"],
                y=stats_pd["max"],
                fill=None,
                mode="lines",
                line=dict(color=color, width=0),
                showlegend=False,
                hoverinfo="skip",
            )
        )
        fig.add_trace(
            go.Scatter(
                x=stats_pd["time"],
                y=stats_pd["min"],
                fill="tonexty",
                mode="lines",
                line=dict(color=color, width=0),
                fillcolor=f"rgba{tuple(list(px.colors.hex_to_rgb(color)) + [0.1])}",
                name="Min-Max Range",
                hovertemplate="<b>Min-Max Range</b><br>Time: %{x}<br>Min: %{y:.2f}<extra></extra>",
            )
        )

    # Add quantile range (medium shade)
    if show_quantiles:
        fig.add_trace(
            go.Scatter(
                x=stats_pd["time"],
                y=stats_pd["p95"],
                fill=None,
                mode="lines",
                line=dict(color=color, width=0),
                showlegend=False,
                hoverinfo="skip",
            )
        )
        fig.add_trace(
            go.Scatter(
                x=stats_pd["time"],
                y=stats_pd["p05"],
                fill="tonexty",
                mode="lines",
                line=dict(color=color, width=0),
                fillcolor=f"rgba{tuple(list(px.colors.hex_to_rgb(color)) + [0.2])}",
                name="5th-95th Percentile",
                hovertemplate="<b>5th-95th Percentile</b><br>Time: %{x}<br>P05: %{y:.2f}<extra></extra>",
            )
        )

    # Add confidence interval (darker shade)
    if show_ci:
        fig.add_trace(
            go.Scatter(
                x=stats_pd["time"],
                y=stats_pd["ci_upper"],
                fill=None,
                mode="lines",
                line=dict(color=color, width=0),
                showlegend=False,
                hoverinfo="skip",
            )
        )
        fig.add_trace(
            go.Scatter(
                x=stats_pd["time"],
                y=stats_pd["ci_lower"],
                fill="tonexty",
                mode="lines",
                line=dict(color=color, width=0),
                fillcolor=f"rgba{tuple(list(px.colors.hex_to_rgb(color)) + [0.3])}",
                name="95% Confidence Interval",
                hovertemplate="<b>95% CI</b><br>Time: %{x}<br>CI Lower: %{y:.2f}<extra></extra>",
            )
        )

    # Add mean line (solid)
    fig.add_trace(
        go.Scatter(
            x=stats_pd["time"],
            y=stats_pd["mean"],
            mode="lines",
            line=dict(color=color, width=3),
            name=f"Mean ({n_scenarios} scenarios)",
            text=stats_pd["std"].round(2).astype(str),
            hovertemplate="<b>Mean</b><br>Time: %{x}<br>Value: %{y:.2f}<br>±Std: %{text}<extra></extra>",
        )
    )

    # Update layout
    fig.update_layout(
        title=dict(text=title, font=dict(size=18, family="Arial Black")),
        xaxis_title=xlabel,
        yaxis_title=ylabel,
        hovermode="x unified",
        height=height,
        width=width,
        template="plotly_white",
        legend=dict(
            yanchor="top",
            y=0.99,
            xanchor="left",
            x=0.01,
            bgcolor="rgba(255,255,255,0.8)",
        ),
    )

    return fig


def plot_scenario_comparison(
    data: pl.DataFrame,
    group_by: str,
    title: str = "Scenario Comparison",
    xlabel: str = "Year",
    ylabel: str = "Value",
    height: int = 600,
    width: int = 1000,
    color_discrete_map: Optional[Dict] = None,
) -> go.Figure:
    """Plot comparison of different parameter values.

    Groups scenarios by a parameter and plots each group's mean trajectory.

    Args:
        data: Polars DataFrame from ScenarioQuery.get_series(include_params=True)
        group_by: Parameter name to group by (e.g., "Fertility Variation")
        title: Plot title
        xlabel: X-axis label
        ylabel: Y-axis label
        height: Plot height in pixels
        width: Plot width in pixels
        color_discrete_map: Optional dict mapping parameter values to colors

    Returns:
        Plotly Figure object

    Example:
        >>> data = query.get_series(
        ...     "Total population",
        ...     filters={"Climate change scenario switch for water yield": 2},
        ...     include_params=True
        ... )
        >>>
        >>> fig = plot_scenario_comparison(
        ...     data,
        ...     group_by="Fertility Variation",
        ...     title="Population by Fertility Rate"
        ... )
        >>> fig.show()
    """
    # Group by parameter and calculate statistics
    stats = (
        data.group_by(["time", group_by])
        .agg(
            [
                pl.col("value").mean().alias("mean"),
                pl.col("value").std().alias("std"),
                pl.col("scenario_name").n_unique().alias("n_scenarios"),
            ]
        )
        .with_columns(
            [
                # Calculate standard error for 95% CI of the mean
                (pl.col("std") / pl.col("n_scenarios").cast(pl.Float64).sqrt()).alias(
                    "se"
                ),
            ]
        )
        .sort(["time", group_by])
    )

    # Convert to pandas
    stats_pd = stats.to_pandas()

    # Create figure with one line per group
    fig = px.line(
        stats_pd,
        x="time",
        y="mean",
        color=group_by,
        color_discrete_map=color_discrete_map,
        title=title,
        labels={"time": xlabel, "mean": ylabel},
    )

    # Add error bands for each group
    for group_value in stats_pd[group_by].unique():
        group_data = stats_pd[stats_pd[group_by] == group_value]

        # Get color from existing trace
        trace_color = None
        for trace in fig.data:
            if trace.name == str(group_value):
                trace_color = trace.line.color
                break

        # Add CI band (using standard error for mean)
        fig.add_trace(
            go.Scatter(
                x=group_data["time"].tolist() + group_data["time"].tolist()[::-1],
                y=(group_data["mean"] + 1.96 * group_data["se"]).tolist()
                + (group_data["mean"] - 1.96 * group_data["se"]).tolist()[::-1],
                fill="toself",
                fillcolor=f'rgba{tuple(list(px.colors.hex_to_rgb(trace_color or "#888888")) + [0.2])}',
                line=dict(color="rgba(255,255,255,0)"),
                showlegend=False,
                hoverinfo="skip",
            )
        )

    # Update layout
    fig.update_layout(
        height=height,
        width=width,
        template="plotly_white",
        hovermode="x unified",
        legend=dict(title=dict(text=group_by)),
    )

    # Make lines thicker
    fig.update_traces(line=dict(width=3), selector=dict(mode="lines"))

    return fig


def plot_heatmap(
    data: pl.DataFrame,
    param1: str,
    param2: str,
    aggregate_func: str = "mean",
    title: str = "Scenario Heatmap",
    height: int = 600,
    width: int = 800,
    colorscale: str = "Viridis",
) -> go.Figure:
    """Create a heatmap showing how two parameters affect outcomes.

    Args:
        data: Polars DataFrame from ScenarioQuery.get_series(include_params=True)
        param1: First parameter name (x-axis)
        param2: Second parameter name (y-axis)
        aggregate_func: Aggregation function ('mean', 'std', 'max', 'min')
        title: Plot title
        height: Plot height in pixels
        width: Plot width in pixels
        colorscale: Plotly colorscale name

    Returns:
        Plotly Figure object

    Example:
        >>> data = query.get_series("YRB WSI", filters={...}, include_params=True)
        >>>
        >>> fig = plot_heatmap(
        ...     data,
        ...     param1="Fertility Variation",
        ...     param2="Diet change scenario switch",
        ...     title="WSI by Fertility and Diet"
        ... )
        >>> fig.show()
    """
    # Aggregate based on function
    agg_expr = {
        "mean": pl.col("value").mean(),
        "std": pl.col("value").std(),
        "max": pl.col("value").max(),
        "min": pl.col("value").min(),
    }.get(aggregate_func, pl.col("value").mean())

    # Create pivot table
    pivot_data = (
        data.group_by([param1, param2])
        .agg(agg_expr.alias("agg_value"))
        .pivot(values="agg_value", index=param2, columns=param1)
    )

    # Convert to pandas
    pivot_pd = pivot_data.to_pandas().set_index(param2)

    # Create heatmap
    fig = go.Figure(
        data=go.Heatmap(
            z=pivot_pd.values,
            x=pivot_pd.columns,
            y=pivot_pd.index,
            colorscale=colorscale,
            hovertemplate=f"{param1}: %{{x}}<br>{param2}: %{{y}}<br>Value: %{{z:.2f}}<extra></extra>",
        )
    )

    fig.update_layout(
        title=title,
        xaxis_title=param1,
        yaxis_title=param2,
        height=height,
        width=width,
        template="plotly_white",
    )

    return fig


def plot_distribution(
    data: pl.DataFrame,
    year: Optional[int] = None,
    title: str = "Value Distribution Across Scenarios",
    xlabel: str = "Value",
    color: str = "#2E86AB",
    height: int = 500,
    width: int = 800,
) -> go.Figure:
    """Plot distribution of values across scenarios for a specific year.

    Args:
        data: Polars DataFrame from ScenarioQuery.get_series()
        year: Year to analyze (None = average across all years)
        title: Plot title
        xlabel: X-axis label
        color: Histogram color
        height: Plot height in pixels
        width: Plot width in pixels

    Returns:
        Plotly Figure object

    Example:
        >>> data = query.get_series("Total population", filters={...})
        >>>
        >>> fig = plot_distribution(data, year=2050, title="Population in 2050")
        >>> fig.show()
    """
    # Filter by year if specified
    if year is not None:
        plot_data = data.filter(pl.col("time") == year)
        year_str = f" ({year})"
    else:
        plot_data = data
        year_str = " (All Years)"

    # Convert to pandas
    values = plot_data["value"].to_pandas()

    # Create histogram
    fig = go.Figure(
        data=go.Histogram(
            x=values,
            nbinsx=30,
            marker_color=color,
            opacity=0.7,
            hovertemplate="Value: %{x:.2f}<br>Count: %{y}<extra></extra>",
        )
    )

    # Add statistics annotation
    mean_val = values.mean()

    fig.add_vline(
        x=mean_val,
        line_dash="dash",
        line_color="red",
        annotation_text=f"Mean: {mean_val:.2f}",
        annotation_position="top",
    )

    fig.update_layout(
        title=title + year_str,
        xaxis_title=xlabel,
        yaxis_title="Frequency",
        height=height,
        width=width,
        template="plotly_white",
        showlegend=False,
    )

    return fig


# Convenience function that wraps ScenarioQuery + plotting
def quick_plot(
    query, variable: str, filters: Dict, plot_type: str = "multi_scenario", **kwargs
) -> go.Figure:
    """One-line function to query and plot data.

    Args:
        query: ScenarioQuery instance
        variable: Variable name to query
        filters: Parameter filters
        plot_type: Type of plot ('multi_scenario', 'comparison', 'heatmap', 'distribution')
        **kwargs: Additional arguments passed to the plotting function

    Returns:
        Plotly Figure object

    Example:
        >>> from scripts.query_scenarios import ScenarioQuery
        >>> from scripts.viz_helpers import quick_plot
        >>>
        >>> query = ScenarioQuery("data_parquet")
        >>> fig = quick_plot(
        ...     query,
        ...     variable="Total population",
        ...     filters={"Climate change scenario switch for water yield": 2},
        ...     plot_type="multi_scenario",
        ...     title="Population - RCP4.5"
        ... )
        >>> fig.show()
    """
    # Query data
    include_params = plot_type in ["comparison", "heatmap"]
    data = query.get_series(
        variables=variable,
        filters=filters,
        time_range=kwargs.pop("time_range", (2020, 2100)),
        include_params=include_params,
    )

    # Choose plotting function
    if plot_type == "multi_scenario":
        return plot_multi_scenario(data, **kwargs)
    elif plot_type == "comparison":
        return plot_scenario_comparison(data, **kwargs)
    elif plot_type == "heatmap":
        return plot_heatmap(data, **kwargs)
    elif plot_type == "distribution":
        return plot_distribution(data, **kwargs)
    else:
        raise ValueError(f"Unknown plot_type: {plot_type}")
