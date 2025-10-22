#!/usr/bin/env python 3.11.0
# -*-coding:utf-8 -*-
# @Author  : Shuang (Twist) Song
# @Contact   : SongshGeo@gmail.com
# GitHub   : https://github.com/SongshGeo
# Website: https://cv.songshgeo.com/

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
    columns_col="water saving irrigation efficiency ratio"
)
# Returns pivoted DataFrame: rows=time, columns=parameter values

Google-style docstrings are used throughout.
"""

from __future__ import annotations

import hashlib
import json
import threading
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import polars as pl


class ScenarioQuery:
    """Query engine for scenario-based time series data stored in Parquet format.

    Attributes:
        data_dir: Path to directory containing Parquet files (time.parquet, scenarios.parquet, variable parquets)
        scenarios: Cached DataFrame of all scenario parameter combinations
        time: Cached DataFrame of time vector [step, time]
    """

    def __init__(
        self,
        data_dir: Union[str, Path] = "data_parquet",
        cache_dir: Optional[Path] = None,
    ):
        """Initialize query engine and load metadata.

        Args:
            data_dir: Path to Parquet data directory (default: "data_parquet")
            cache_dir: Optional path to cache directory (defaults to data_dir/cache)
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
            self.variables_map = json.loads(
                self.variables_map_path.read_text(encoding="utf-8")
            )

        # Setup cache (skip directory creation in Docker environment)
        self.cache_dir = cache_dir or (self.data_dir / "cache")
        # Skip directory creation in Docker environment (read-only filesystem)
        # self.cache_dir.mkdir(exist_ok=True)

        # In-memory cache for frequently accessed queries
        self.query_cache: Dict[str, pl.DataFrame] = {}
        self.cache_max_size = 100  # Maximum number of cached queries
        self._cache_lock = threading.Lock()  # Thread safety for cache operations

        # Pre-computed default scenario cache
        self.default_scenario_cache: Dict[str, pl.DataFrame] = {}

        # Initialize default scenario cache
        self._initialize_default_cache()

    def _generate_cache_key(
        self,
        variables: Union[str, List[str]],
        filters: Optional[Dict],
        time_range: Optional[Tuple[float, float]],
    ) -> str:
        """Generate a unique cache key for a query.

        Args:
            variables: Variable name(s) to query
            filters: Parameter filters
            time_range: Time range tuple

        Returns:
            Unique string key for caching
        """
        # Normalize variables to list
        if isinstance(variables, str):
            variables = [variables]

        # Create a deterministic key
        key_data = {
            "variables": sorted(variables),
            "filters": filters or {},
            "time_range": time_range,
        }

        # Convert to JSON string and hash
        key_str = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_str.encode()).hexdigest()

    def _is_default_scenario(self, filters: Optional[Dict]) -> bool:
        """Check if filters represent the default scenario (all parameters Any/null).

        Args:
            filters: Parameter filters to check

        Returns:
            True if this is a default scenario query
        """
        if not filters:
            return True

        # Check if all filter values are lists (representing "Any" logic)
        for value in filters.values():
            if not isinstance(value, list):
                return False

        return True

    def _initialize_default_cache(self):
        """Pre-compute results for default scenarios (all parameters Any).

        This pre-computes the most common query pattern to improve performance.
        """
        print("🔄 Initializing default scenario cache...")

        # Get list of available variables that have scenario_name column
        available_vars = []
        for file_path in self.data_dir.glob("*.parquet"):
            if file_path.name not in ["scenarios.parquet", "time.parquet"]:
                var_name = file_path.stem

                # Check if this file has scenario_name column (scenario-based data)
                try:
                    df = pl.read_parquet(file_path)
                    if "scenario_name" in df.columns:
                        # Convert safe name back to original if possible
                        original_name = next(
                            (k for k, v in self.variables_map.items() if v == var_name),
                            var_name,
                        )
                        available_vars.append(original_name)
                except Exception as e:
                    print(f"  ⚠️  Skipping {var_name}: {e}")
                    continue

        # Pre-compute default scenario for each variable
        for var in available_vars[
            :10
        ]:  # Limit to first 10 variables to avoid long startup
            try:
                print(f"  📊 Pre-computing default scenario for {var}...")
                result = self._compute_series(var, None, None, include_params=True)
                self.default_scenario_cache[var] = result
            except Exception as e:
                print(f"  ⚠️  Failed to pre-compute {var}: {e}")

        print(
            f"✅ Default cache initialized with {len(self.default_scenario_cache)} variables"
        )

    def filter_scenarios(
        self, filters: Dict[str, Union[float, int, str, List]]
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
                raise ValueError(
                    f"Unknown parameter: {param}. Available: {self.param_cols}"
                )

            if isinstance(value, (list, tuple)):
                df = df.filter(pl.col(param).is_in(value))
            else:
                df = df.filter(pl.col(param) == value)

        return df

    def _compute_series(
        self,
        variables: Union[str, List[str]],
        filters: Optional[Dict[str, Union[float, int, str, List]]] = None,
        time_range: Optional[Tuple[float, float]] = None,
        include_params: bool = True,
    ) -> pl.DataFrame:
        """Internal method to compute series without caching.

        This is the original get_series logic extracted for reuse.
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
            result = result.filter((pl.col("time") >= start) & (pl.col("time") <= end))

        # Join parameters if requested
        if include_params:
            result = result.join(scenarios, on="scenario_name", how="left")

        return result

    def get_series(
        self,
        variables: Union[str, List[str]],
        filters: Optional[Dict[str, Union[float, int, str, List]]] = None,
        time_range: Optional[Tuple[float, float]] = None,
        include_params: bool = True,
    ) -> pl.DataFrame:
        """Retrieve time series for variable(s) under filtered scenarios with caching.

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
        # Generate cache key
        cache_key = self._generate_cache_key(variables, filters, time_range)

        # Check in-memory cache first
        with self._cache_lock:
            if cache_key in self.query_cache:
                print(f"🎯 Cache hit for query: {variables}")
                return self.query_cache[cache_key]

        # Check default scenario cache for single variable queries
        if (
            isinstance(variables, str)
            and self._is_default_scenario(filters)
            and variables in self.default_scenario_cache
        ):
            print(f"⚡ Default cache hit for: {variables}")
            result = self.default_scenario_cache[variables].clone()

            # Apply time range filter if specified
            if time_range:
                start, end = time_range
                result = result.filter(
                    (pl.col("time") >= start) & (pl.col("time") <= end)
                )

            # Cache the result
            self._cache_result(cache_key, result)
            return result

        # Compute result using internal method
        print(f"🔄 Computing series for: {variables}")
        result = self._compute_series(variables, filters, time_range, include_params)

        # Cache the result
        self._cache_result(cache_key, result)

        return result

    def _cache_result(self, cache_key: str, result: pl.DataFrame):
        """Cache a query result with thread safety.

        Args:
            cache_key: Unique key for the query
            result: DataFrame result to cache
        """
        with self._cache_lock:
            # Manage cache size
            if len(self.query_cache) >= self.cache_max_size:
                # Remove oldest entry (simple FIFO)
                oldest_key = next(iter(self.query_cache))
                del self.query_cache[oldest_key]

            # Cache the result
            self.query_cache[cache_key] = result.clone()

        # Skip disk cache in Docker environment (read-only filesystem)
        # cache_file = self.cache_dir / f"{cache_key}.pkl"
        # try:
        #     with open(cache_file, "wb") as f:
        #         pickle.dump(result, f)
        # except Exception as e:
        #     print(f"⚠️  Failed to save cache to disk: {e}")

    def clear_cache(self):
        """Clear all cached results with thread safety."""
        with self._cache_lock:
            self.query_cache.clear()
            self.default_scenario_cache.clear()

        # Skip disk cache clearing in Docker environment (read-only filesystem)
        # for cache_file in self.cache_dir.glob("*.pkl"):
        #     try:
        #         cache_file.unlink()
        #     except Exception as e:
        #         print(f"⚠️  Failed to remove cache file {cache_file}: {e}")

        print("🧹 Cache cleared")

    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache statistics.

        Returns:
            Dictionary with cache statistics
        """
        # Skip disk cache stats in Docker environment (read-only filesystem)
        # disk_cache_files = len(list(self.cache_dir.glob("*.pkl")))
        disk_cache_files = 0
        return {
            "memory_cache_size": len(self.query_cache),
            "default_cache_size": len(self.default_scenario_cache),
            "disk_cache_files": disk_cache_files,
            "max_memory_cache_size": self.cache_max_size,
        }

    def get_series_wide(
        self,
        variable: str,
        filters: Optional[Dict[str, Union[float, int, str, List]]] = None,
        time_range: Optional[Tuple[float, float]] = None,
        index_col: str = "time",
        columns_col: Optional[str] = None,
        values_col: str = "value",
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
            include_params=(columns_col is not None),
        )

        # Drop 'variable' column if present (single variable query)
        if "variable" in long.columns:
            long = long.drop("variable")

        # Use scenario_name if no columns_col specified
        pivot_col = columns_col if columns_col else "scenario_name"

        # Pivot
        wide = long.pivot(values=values_col, index=index_col, columns=pivot_col)

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
            summaries.append(
                {
                    "parameter": param,
                    "n_unique": len(unique_vals),
                    "values": str(unique_vals),
                    "n_scenarios": scenarios.height,
                }
            )

        return pl.DataFrame(summaries)

    def list_variables(self) -> List[str]:
        """List all available variables in the data directory.

        Returns:
            List of variable names (filenames without .parquet extension).
        """
        parquet_files = list(self.data_dir.glob("*.parquet"))
        variables = [
            f.stem for f in parquet_files if f.stem not in ["time", "scenarios"]
        ]
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
    time_range: Optional[Tuple[float, float]] = None,
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
    fixed_params: Dict[str, Union[float, int, str, List]],
    vary_param: str,
    data_dir: Union[str, Path] = "data_parquet",
    time_range: Optional[Tuple[float, float]] = None,
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
        ...     vary_param="water saving irrigation efficiency ratio",
        ...     time_range=(2020, 2100)
        ... )
        >>> # Result: rows=years, columns=[0.8, 0.9, 1.0] (different irrigation efficiencies)
    """
    query = ScenarioQuery(data_dir)
    return query.get_series_wide(
        variable=variable,
        filters=fixed_params,
        time_range=time_range,
        columns_col=vary_param,
    )


# ---------------------- CLI Interface (Optional) ----------------------

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Query scenario data from Parquet")
    parser.add_argument(
        "--data-dir", type=Path, default="data_parquet", help="Parquet data directory"
    )
    parser.add_argument(
        "--list-vars", action="store_true", help="List available variables"
    )
    parser.add_argument(
        "--list-params", action="store_true", help="List available parameters"
    )
    parser.add_argument("--variable", type=str, help="Variable to query")
    parser.add_argument(
        "--filters",
        type=str,
        help="Filters as JSON string, e.g. '{\"Fertility Variation\": 1.6}'",
    )
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
        filters = json.loads(args.filters) if args.filters else None

        data = query.get_series(args.variable, filters=filters)
        print(f"Retrieved {data.height} rows × {len(data.columns)} columns")
        print(data.head())

        if args.output:
            data.write_csv(args.output)
            print(f"Saved to {args.output}")

    else:
        parser.print_help()
