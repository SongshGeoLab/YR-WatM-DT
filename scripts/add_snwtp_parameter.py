#!/usr/bin/env python3
"""
Add SNWTP (South-North Water Transfer Project) parameter to existing scenarios.

This script:
1. Reads the existing scenarios.parquet
2. Creates a new version with SNWTP parameter (0/1)
3. Doubles the number of scenarios (each original scenario gets both SNWTP=0 and SNWTP=1)

Run:
    poetry run python scripts/add_snwtp_parameter.py
"""

import polars as pl
from pathlib import Path

def add_snwtp_parameter():
    """Add SNWTP parameter to existing scenarios."""
    
    # Read existing scenarios
    scenarios_path = Path("data_parquet/scenarios.parquet")
    if not scenarios_path.exists():
        raise FileNotFoundError(f"Scenarios file not found: {scenarios_path}")
    
    print("Reading existing scenarios...")
    scenarios = pl.read_parquet(scenarios_path)
    print(f"Original scenarios: {scenarios.height}")
    
    # Create SNWTP=0 scenarios
    scenarios_no_snwtp = scenarios.with_columns(pl.lit(0).alias("SNWTP"))
    
    # Create SNWTP=1 scenarios
    scenarios_with_snwtp = scenarios.with_columns(pl.lit(1).alias("SNWTP"))
    
    # Combine both sets
    new_scenarios = pl.concat([scenarios_no_snwtp, scenarios_with_snwtp])
    
    print(f"New scenarios with SNWTP: {new_scenarios.height}")
    print("SNWTP parameter values:", new_scenarios["SNWTP"].unique().to_list())
    
    # Update scenario names to be unique
    new_scenarios = new_scenarios.with_row_count("row_id").with_columns(
        pl.format("sc_{}", pl.col("row_id")).alias("scenario_name")
    ).drop("row_id")
    
    # Ensure scenario_name is categorical
    new_scenarios = new_scenarios.with_columns(
        pl.col("scenario_name").cast(pl.Categorical)
    )
    
    # Backup original file
    backup_path = scenarios_path.with_suffix(".parquet.backup")
    print(f"Creating backup: {backup_path}")
    scenarios.write_parquet(backup_path)
    
    # Write new scenarios
    print(f"Writing new scenarios to: {scenarios_path}")
    new_scenarios.write_parquet(scenarios_path)
    
    print("✅ Successfully added SNWTP parameter!")
    print(f"Original scenarios: {scenarios.height}")
    print(f"New scenarios: {new_scenarios.height}")
    print("SNWTP parameter added with values [0, 1]")

if __name__ == "__main__":
    add_snwtp_parameter()
