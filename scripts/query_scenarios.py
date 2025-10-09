"""Flexible scenario data query utility for analysis workflows.

This module provides robust functions to filter scenarios by parameter constraints
and extract time series for one or more variables. Designed for exploratory analysis
where you fix some parameters and vary others to study their impacts.

Usage Examples
--------------
# 1. Fix some parameters, get all matching scenarios
query = ScenarioQuery("data_parquet")
scenarios = query.filter_scenarios({
    "Fertility Variation": 1.6,
    "Climate change scenario switch for water yield": 1
})
print(scenarios)  # DataFrame with all scenarios matching constraints

# 2. Get time series for specific variable(s) under filtered scenarios
data = query.get_series(
    variables=["Total population", "YRB WSI"],
    filters={"Fertility Variation": 1.6},
    time_range=(2020, 2050)
)
# Returns long-form DataFrame: [scenario_name, variable, step, time, value, param1, param2, ...]

# 3. Pivot for comparison analysis
wide_data = query.get_series_wide(
    variable="GDP per capita",
    filters={"Diet change scenario switch": 1},
    index_col="time",
    columns_col="water-saving irrigation efficiency ratio"
)
# Returns pivoted DataFrame: rows=time, columns=parameter values

Google-style docstrings are used throughout.
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import json

import polars as pl


class ScenarioQuery:
    """Query engine for scenario-based time series data stored in Parquet format.
    
    Attributes:
        data_dir: Path to directory containing Parquet files (time.parquet, scenarios.parquet, variable parquets)
        scenarios: Cached DataFrame of all scenario parameter combinations
        time: Cached DataFrame of time vector [step, time]
    """

    def __init__(self, data_dir: Union[str, Path] = "data_parquet"):
        """Initialize query engine and load metadata.
        
        Args:
            data_dir: Path to Parquet data directory (default: "data_parquet")
        """
        self.data_dir = Path(data_dir)
        if not self.data_dir.exists():
            raise FileNotFoundError(f"Data directory not found: {self.data_dir}")
        
        # Load and cache metadata
        self.scenarios = pl.read_parquet(self.data_dir / "scenarios.parquet")
        self.time = pl.read_parquet(self.data_dir / "time.parquet")
        
        # Extract parameter columns (all except scenario_name)
        self.param_cols = [c for c in self.scenarios.columns if c != "scenario_name"]
        # Load variable name mapping (original -> safe)
        self.variables_map_path = self.data_dir / "variables_map.json"
        self.variables_map: Dict[str, str] = {}
        if self.variables_map_path.exists():
            self.variables_map = json.loads(self.variables_map_path.read_text(encoding="utf-8"))
    
    def filter_scenarios(
        self, 
        filters: Dict[str, Union[float, int, str, List]]
    ) -> pl.DataFrame:
        """Filter scenarios by parameter constraints.
        
        Args:
            filters: Dictionary mapping parameter names to values or lists of values.
                     - Single value: exact match (e.g., {"Fertility Variation": 1.6})
                     - List: match any value (e.g., {"Climate scenario": [1, 2]})
        
        Returns:
            DataFrame of matching scenarios with all parameter columns.
        
        Example:
            >>> query = ScenarioQuery()
            >>> filtered = query.filter_scenarios({
            ...     "Fertility Variation": 1.6,
            ...     "Climate change scenario switch for water yield": [1, 2]
            ... })
            >>> print(filtered.shape)  # (N_matching_scenarios, N_params+1)
        """
        df = self.scenarios
        
        for param, value in filters.items():
            if param not in self.param_cols:
                raise ValueError(f"Unknown parameter: {param}. Available: {self.param_cols}")
            
            if isinstance(value, (list, tuple)):
                df = df.filter(pl.col(param).is_in(value))
            else:
                df = df.filter(pl.col(param) == value)
        
        return df
    
    def get_series(
        self,
        variables: Union[str, List[str]],
        filters: Optional[Dict[str, Union[float, int, str, List]]] = None,
        time_range: Optional[Tuple[float, float]] = None,
        include_params: bool = True
    ) -> pl.DataFrame:
        """Retrieve time series for variable(s) under filtered scenarios.
        
        Args:
            variables: Variable name(s) to retrieve (e.g., "Total population" or ["var1", "var2"])
            filters: Optional parameter constraints (see filter_scenarios)
            time_range: Optional (start_time, end_time) tuple to subset time dimension
            include_params: If True, join parameter values to output (default: True)
        
        Returns:
            Long-form DataFrame with columns:
                - scenario_name
                - variable (if multiple variables requested)
                - step
                - time
                - value
                - [param1, param2, ...] (if include_params=True)
        
        Example:
            >>> query = ScenarioQuery()
            >>> data = query.get_series(
            ...     variables=["YRB WSI", "Total population"],
            ...     filters={"Fertility Variation": 1.6},
            ...     time_range=(2020, 2050)
            ... )
            >>> print(data.columns)
            # ['scenario_name', 'variable', 'step', 'time', 'value', 'Fertility Variation', ...]
        """
        if isinstance(variables, str):
            variables = [variables]
        
        # Filter scenarios first
        if filters:
            scenarios = self.filter_scenarios(filters)
            scenario_names = scenarios.get_column("scenario_name").to_list()
        else:
            scenarios = self.scenarios
            scenario_names = scenarios.get_column("scenario_name").to_list()
        
        # Load and concatenate variable data
        dfs = []
        for var in variables:
            # Support original name or safe name
            safe = self.variables_map.get(var, var)
            var_file = self.data_dir / f"{safe}.parquet"
            if not var_file.exists():
                raise FileNotFoundError(f"Variable file not found: {var_file}")
            
            df = pl.read_parquet(var_file).filter(
                pl.col("scenario_name").is_in(scenario_names)
            )
            dfs.append(df)
        
        # Union all variables
        result = pl.concat(dfs) if len(dfs) > 1 else dfs[0]
        
        # Join time
        result = result.join(self.time, on="step", how="left")
        
        # Filter time range if specified
        if time_range:
            start, end = time_range
            result = result.filter(
                (pl.col("time") >= start) & (pl.col("time") <= end)
            )
        
        # Join parameters if requested
        if include_params:
            result = result.join(scenarios, on="scenario_name", how="left")
        
        return result
    
    def get_series_wide(
        self,
        variable: str,
        filters: Optional[Dict[str, Union[float, int, str, List]]] = None,
        time_range: Optional[Tuple[float, float]] = None,
        index_col: str = "time",
        columns_col: Optional[str] = None,
        values_col: str = "value"
    ) -> pl.DataFrame:
        """Retrieve time series in wide (pivoted) format for comparison.
        
        Args:
            variable: Single variable name to retrieve
            filters: Optional parameter constraints
            time_range: Optional (start_time, end_time) tuple
            index_col: Column to use as index (default: "time")
            columns_col: Parameter to pivot as columns (e.g., "Fertility Variation").
                         If None, uses scenario_name.
            values_col: Column containing values to pivot (default: "value")
        
        Returns:
            Wide-form DataFrame with index_col as first column, 
            and one column per unique value of columns_col.
        
        Example:
            >>> query = ScenarioQuery()
            >>> wide = query.get_series_wide(
            ...     variable="GDP per capita",
            ...     filters={"Diet change scenario switch": 1},
            ...     columns_col="Fertility Variation"
            ... )
            >>> # Result: rows=time, columns=[1.6, 1.7, 1.8]
        """
        # Get long-form data
        long = self.get_series(
            variables=variable,
            filters=filters,
            time_range=time_range,
            include_params=(columns_col is not None)
        )
        
        # Drop 'variable' column if present (single variable query)
        if "variable" in long.columns:
            long = long.drop("variable")
        
        # Use scenario_name if no columns_col specified
        pivot_col = columns_col if columns_col else "scenario_name"
        
        # Pivot
        wide = long.pivot(
            values=values_col,
            index=index_col,
            columns=pivot_col
        )
        
        return wide
    
    def get_param_summary(self, filters: Optional[Dict] = None) -> pl.DataFrame:
        """Get summary statistics of parameters across filtered scenarios.
        
        Args:
            filters: Optional parameter constraints
        
        Returns:
            DataFrame with parameter names, unique values, and counts.
        
        Example:
            >>> query = ScenarioQuery()
            >>> summary = query.get_param_summary({"Fertility Variation": 1.6})
            >>> print(summary)
            # Shows distribution of other parameters when Fertility=1.6
        """
        scenarios = self.filter_scenarios(filters) if filters else self.scenarios
        
        summaries = []
        for param in self.param_cols:
            unique_vals = scenarios.get_column(param).unique().sort().to_list()
            summaries.append({
                "parameter": param,
                "n_unique": len(unique_vals),
                "values": str(unique_vals),
                "n_scenarios": scenarios.height
            })
        
        return pl.DataFrame(summaries)
    
    def list_variables(self) -> List[str]:
        """List all available variables in the data directory.
        
        Returns:
            List of variable names (filenames without .parquet extension).
        """
        parquet_files = list(self.data_dir.glob("*.parquet"))
        variables = [f.stem for f in parquet_files if f.stem not in ["time", "scenarios"]]
        # Prefer original names if mapping exists
        if self.variables_map:
            inv = {v: k for k, v in self.variables_map.items()}
            variables = [inv.get(v, v) for v in variables]
        return sorted(set(variables))


# ---------------------- Convenience Functions ----------------------

def quick_query(
    variable: str,
    filters: Dict[str, Union[float, int, str, List]],
    data_dir: Union[str, Path] = "data_parquet",
    time_range: Optional[Tuple[float, float]] = None
) -> pl.DataFrame:
    """Quick one-liner query for a single variable with filters.
    
    Args:
        variable: Variable name
        filters: Parameter constraints
        data_dir: Parquet data directory
        time_range: Optional (start, end) time filter
    
    Returns:
        Long-form DataFrame with scenario_name, step, time, value, and parameters.
    
    Example:
        >>> data = quick_query(
        ...     "Total population",
        ...     {"Fertility Variation": 1.6, "Climate change scenario switch for water yield": 1},
        ...     time_range=(2020, 2050)
        ... )
    """
    query = ScenarioQuery(data_dir)
    return query.get_series(variable, filters=filters, time_range=time_range)


def compare_params(
    variable: str,
    fixed_params: Dict[str, Union[float, int, str]],
    vary_param: str,
    data_dir: Union[str, Path] = "data_parquet",
    time_range: Optional[Tuple[float, float]] = None
) -> pl.DataFrame:
    """Compare impact of one varying parameter while fixing others.
    
    Args:
        variable: Variable to analyze
        fixed_params: Parameters to hold constant
        vary_param: Parameter to vary (will become columns in output)
        data_dir: Parquet data directory
        time_range: Optional time filter
    
    Returns:
        Wide-form DataFrame with time as index and vary_param values as columns.
    
    Example:
        >>> comparison = compare_params(
        ...     variable="YRB WSI",
        ...     fixed_params={"Fertility Variation": 1.6, "Diet change scenario switch": 1},
        ...     vary_param="water-saving irrigation efficiency ratio",
        ...     time_range=(2020, 2100)
        ... )
        >>> # Result: rows=years, columns=[0.8, 0.9, 1.0] (different irrigation efficiencies)
    """
    query = ScenarioQuery(data_dir)
    return query.get_series_wide(
        variable=variable,
        filters=fixed_params,
        time_range=time_range,
        columns_col=vary_param
    )


# ---------------------- CLI Interface (Optional) ----------------------

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Query scenario data from Parquet")
    parser.add_argument("--data-dir", type=Path, default="data_parquet", help="Parquet data directory")
    parser.add_argument("--list-vars", action="store_true", help="List available variables")
    parser.add_argument("--list-params", action="store_true", help="List available parameters")
    parser.add_argument("--variable", type=str, help="Variable to query")
    parser.add_argument("--filters", type=str, help='Filters as JSON string, e.g. \'{"Fertility Variation": 1.6}\'')
    parser.add_argument("--output", type=Path, help="Output CSV path (optional)")
    
    args = parser.parse_args()
    
    query = ScenarioQuery(args.data_dir)
    
    if args.list_vars:
        print("Available variables:")
        for var in query.list_variables():
            print(f"  - {var}")
    
    elif args.list_params:
        print("Available parameters:")
        for param in query.param_cols:
            unique_vals = query.scenarios.get_column(param).unique().sort().to_list()
            print(f"  - {param}: {unique_vals}")
    
    elif args.variable:
        import json
        filters = json.loads(args.filters) if args.filters else None
        
        data = query.get_series(args.variable, filters=filters)
        print(f"Retrieved {data.height} rows × {len(data.columns)} columns")
        print(data.head())
        
        if args.output:
            data.write_csv(args.output)
            print(f"Saved to {args.output}")
    
    else:
        parser.print_help()

