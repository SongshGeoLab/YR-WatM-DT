"""Analysis helpers for scenario sensitivity and impact assessment.

This module provides functions to analyze how parameter changes affect
different variables, enabling sensitivity analysis and uncertainty quantification.

Usage:
    from scripts.analysis_helpers import sensitivity_test
    from scripts.query_scenarios import ScenarioQuery

    query = ScenarioQuery("data_parquet")
    results = sensitivity_test(
        query,
        vary_param="Fertility Variation",
        fixed_params={"Climate change scenario switch for water yield": 2}
    )

Google-style docstrings are used.
"""

from typing import Any, Dict, List, Optional, Union

import polars as pl

from scripts.query_scenarios import ScenarioQuery


def sensitivity_test(
    query: ScenarioQuery,
    vary_param: str,
    fixed_params: Optional[Dict[str, Union[int, float, str, List[Any]]]] = None,
    variables: Optional[List[str]] = None,
    time_range: Optional[tuple] = None,
    metric: str = "cv",
) -> pl.DataFrame:
    """Test sensitivity of variables to parameter changes.

    Analyzes how changing one parameter affects different variables,
    while optionally fixing other parameters.

    Args:
        query: ScenarioQuery instance.
        vary_param: Parameter name to vary (e.g., "Fertility Variation").
        fixed_params: Optional dict of parameters to fix (e.g., {"Climate...": 2}).
        variables: List of variables to analyze. If None, tests all available variables.
        time_range: Optional (start, end) year tuple to focus analysis.
        metric: Sensitivity metric to use:
            - 'cv': Coefficient of Variation (std/mean * 100)
            - 'range': Absolute range (max - min)
            - 'range_pct': Range as percentage of mean
            - 'std': Standard deviation
            - 'iqr': Interquartile range (p75 - p25)

    Returns:
        DataFrame with columns:
            - variable: Variable name
            - sensitivity: Sensitivity score (higher = more sensitive to parameter)
            - mean_value: Mean across all scenarios
            - std_value: Standard deviation
            - min_value: Minimum value
            - max_value: Maximum value
            - range_value: max - min
            - cv: Coefficient of variation
            - n_scenarios: Number of scenarios analyzed

    Example:
        >>> from scripts.query_scenarios import ScenarioQuery
        >>> from scripts.analysis_helpers import sensitivity_test
        >>>
        >>> query = ScenarioQuery("data_parquet")
        >>> results = sensitivity_test(
        ...     query,
        ...     vary_param="Fertility Variation",
        ...     fixed_params={"Climate change scenario switch for water yield": 2},
        ...     time_range=(2020, 2100),
        ...     metric="cv"
        ... )
        >>> print(results.sort("sensitivity", descending=True).head(10))
        # Shows top 10 variables most sensitive to fertility changes
    """
    # Get all available variables if not specified
    if variables is None:
        variables = query.list_variables()
        # Filter out some non-informative variables
        variables = [
            v
            for v in variables
            if v
            not in [
                "time",
                "scenarios",
                "step",
            ]
        ]

    # Get unique values of the varying parameter
    all_scenarios = query.scenarios
    if vary_param not in query.param_cols:
        raise ValueError(
            f"Unknown parameter: {vary_param}. Available: {query.param_cols}"
        )

    vary_values = all_scenarios[vary_param].unique().sort().to_list()

    print(f"🔬 Sensitivity Test: {vary_param}")
    print(f"   Varying values: {vary_values}")
    if fixed_params:
        print(f"   Fixed parameters: {list(fixed_params.keys())}")
    print(f"   Variables to test: {len(variables)}")
    print(f"   Metric: {metric}")

    # Build filters combining fixed params
    filters = fixed_params.copy() if fixed_params else {}

    # Don't filter on the varying parameter - we want all its values
    # (it will be included in the query via filters being passed to get_series)

    results = []

    for i, variable in enumerate(variables, 1):
        try:
            print(f"   [{i}/{len(variables)}] Testing {variable}...", end=" ")

            # Query data for this variable
            data = query.get_series(
                variables=variable,
                filters=filters,  # Only fixed params
                time_range=time_range,
                include_params=True,
            )

            if data.height == 0:
                print("❌ No data")
                continue

            # Group by the varying parameter and calculate statistics
            param_stats = (
                data.group_by(vary_param)
                .agg(
                    [
                        pl.col("value").mean().alias("mean_by_param"),
                        pl.col("value").std().alias("std_by_param"),
                        pl.col("value").min().alias("min_by_param"),
                        pl.col("value").max().alias("max_by_param"),
                    ]
                )
                .sort(vary_param)
            )

            # Calculate overall statistics across all parameter values
            overall_mean = param_stats["mean_by_param"].mean()
            overall_std = param_stats["mean_by_param"].std()
            overall_min = param_stats["min_by_param"].min()
            overall_max = param_stats["max_by_param"].max()
            overall_range = overall_max - overall_min

            # Calculate sensitivity metric
            if metric == "cv":
                # Coefficient of Variation
                if overall_mean != 0:
                    sensitivity = (overall_std / abs(overall_mean)) * 100
                else:
                    sensitivity = 0
            elif metric == "range":
                # Absolute range
                sensitivity = overall_range
            elif metric == "range_pct":
                # Range as percentage of mean
                if overall_mean != 0:
                    sensitivity = (overall_range / abs(overall_mean)) * 100
                else:
                    sensitivity = 0
            elif metric == "std":
                # Standard deviation
                sensitivity = overall_std
            elif metric == "iqr":
                # Interquartile range
                p25 = param_stats["mean_by_param"].quantile(0.25)
                p75 = param_stats["mean_by_param"].quantile(0.75)
                sensitivity = p75 - p25
            else:
                raise ValueError(
                    f"Unknown metric: {metric}. Use 'cv', 'range', 'range_pct', 'std', or 'iqr'"
                )

            results.append(
                {
                    "variable": variable,
                    "sensitivity": float(sensitivity),
                    "mean_value": float(overall_mean),
                    "std_value": float(overall_std),
                    "min_value": float(overall_min),
                    "max_value": float(overall_max),
                    "range_value": float(overall_range),
                    "cv": float(
                        (overall_std / abs(overall_mean)) * 100
                        if overall_mean != 0
                        else 0
                    ),
                    "n_scenarios": data["scenario_name"].n_unique(),
                    "n_param_values": param_stats.height,
                }
            )

            print(f"✅ Sensitivity: {sensitivity:.2f}")

        except Exception as e:
            print(f"❌ Error: {str(e)}")
            continue

    # Convert to DataFrame and sort by sensitivity
    result_df = pl.DataFrame(results).sort("sensitivity", descending=True)

    print(f"\n✅ Completed! {len(results)}/{len(variables)} variables analyzed")

    return result_df


def compare_scenarios_across_variables(
    query: ScenarioQuery,
    scenario_filters_list: List[Dict[str, Union[int, float, str, List[Any]]]],
    scenario_labels: Optional[List[str]] = None,
    variables: Optional[List[str]] = None,
    time_range: Optional[tuple] = None,
    normalize: bool = False,
) -> pl.DataFrame:
    """Compare multiple scenario configurations across all variables.

    Args:
        query: ScenarioQuery instance.
        scenario_filters_list: List of filter dicts, each defining a scenario.
        scenario_labels: Optional labels for scenarios (defaults to sc_1, sc_2, ...).
        variables: List of variables to compare. If None, uses all available.
        time_range: Optional (start, end) year tuple.
        normalize: If True, normalize values to 0-1 range for comparison.

    Returns:
        Wide DataFrame with variables as rows and scenarios as columns.

    Example:
        >>> results = compare_scenarios_across_variables(
        ...     query,
        ...     scenario_filters_list=[
        ...         {"Fertility Variation": 1.6, "Climate...": 2},  # Low fertility
        ...         {"Fertility Variation": 1.8, "Climate...": 2},  # High fertility
        ...     ],
        ...     scenario_labels=["Low Fertility", "High Fertility"]
        ... )
    """
    if variables is None:
        variables = query.list_variables()

    if scenario_labels is None:
        scenario_labels = [f"Scenario_{i+1}" for i in range(len(scenario_filters_list))]

    results = []

    for variable in variables:
        row: Dict[str, Union[str, float, None]] = {"variable": variable}

        for i, filters in enumerate(scenario_filters_list):
            label = scenario_labels[i]

            try:
                data = query.get_series(
                    variables=variable, filters=filters, time_range=time_range
                )

                if data.height > 0:
                    mean_val = data["value"].mean()
                    row[label] = float(mean_val)
                else:
                    row[label] = None

            except Exception:
                row[label] = None

        results.append(row)

    result_df = pl.DataFrame(results)

    # Normalize if requested
    if normalize and len(scenario_labels) > 0:
        for col in scenario_labels:
            if col in result_df.columns:
                col_data = result_df[col]
                min_val = col_data.min()
                max_val = col_data.max()
                if max_val != min_val:
                    result_df = result_df.with_columns(
                        ((col_data - min_val) / (max_val - min_val)).alias(
                            f"{col}_normalized"
                        )
                    )

    return result_df


def calculate_variable_correlation(
    query: ScenarioQuery,
    variable1: str,
    variable2: str,
    filters: Optional[Dict] = None,
    time_range: Optional[tuple] = None,
) -> Dict:
    """Calculate correlation between two variables across scenarios.

    Args:
        query: ScenarioQuery instance.
        variable1: First variable name.
        variable2: Second variable name.
        filters: Optional parameter filters.
        time_range: Optional (start, end) year tuple.

    Returns:
        Dict with correlation coefficient and statistics.

    Example:
        >>> corr_result = calculate_variable_correlation(
        ...     query,
        ...     "Total population",
        ...     "YRB WSI",
        ...     filters={"Climate change scenario switch for water yield": 2}
        ... )
        >>> print(f"Correlation: {corr_result['correlation']:.3f}")
    """
    # Query both variables
    data1 = query.get_series(
        variables=variable1, filters=filters, time_range=time_range
    )
    data2 = query.get_series(
        variables=variable2, filters=filters, time_range=time_range
    )

    # Merge on scenario and time
    merged = data1.join(
        data2,
        on=["scenario_name", "step", "time"],
        how="inner",
        suffix="_var2",
    ).rename({"value": "value_var1"})

    # Calculate correlation
    correlation = merged.select(
        pl.corr("value_var1", "value_var2").alias("correlation")
    )["correlation"][0]

    return {
        "variable1": variable1,
        "variable2": variable2,
        "correlation": float(correlation),
        "n_data_points": merged.height,
        "n_scenarios": merged["scenario_name"].n_unique(),
    }


def rank_variables_by_uncertainty(
    query: ScenarioQuery,
    filters: Optional[Dict] = None,
    variables: Optional[List[str]] = None,
    time_range: Optional[tuple] = None,
) -> pl.DataFrame:
    """Rank variables by their uncertainty across scenarios.

    Identifies which variables have the highest variability/uncertainty
    under given parameter constraints.

    Args:
        query: ScenarioQuery instance.
        filters: Optional parameter filters.
        variables: List of variables to rank. If None, uses all.
        time_range: Optional (start, end) year tuple.

    Returns:
        DataFrame sorted by uncertainty, with columns:
            - variable
            - cv (coefficient of variation)
            - std
            - range
            - n_scenarios

    Example:
        >>> ranking = rank_variables_by_uncertainty(
        ...     query,
        ...     filters={"Climate change scenario switch for water yield": 2},
        ...     time_range=(2050, 2100)
        ... )
        >>> print(ranking.head(10))  # Top 10 most uncertain variables
    """
    if variables is None:
        variables = query.list_variables()

    results = []

    for variable in variables:
        try:
            data = query.get_series(
                variables=variable, filters=filters, time_range=time_range
            )

            if data.height == 0:
                continue

            # Calculate statistics
            mean_val = data["value"].mean()
            std_val = data["value"].std()
            min_val = data["value"].min()
            max_val = data["value"].max()
            range_val = max_val - min_val
            cv = (std_val / abs(mean_val)) * 100 if mean_val != 0 else 0

            results.append(
                {
                    "variable": variable,
                    "cv": float(cv),
                    "std": float(std_val),
                    "range": float(range_val),
                    "mean": float(mean_val),
                    "n_scenarios": data["scenario_name"].n_unique(),
                }
            )

        except Exception:
            continue

    return pl.DataFrame(results).sort("cv", descending=True)
