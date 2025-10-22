"""Prepare historical sediment and forest data for web visualization.

This script processes the historical data and creates a JSON file with
interpolated values for smooth visualization in the web interface.
"""

import json
from pathlib import Path

import numpy as np
import polars as pl


def linear_interpolate(years, values, target_years):
    """Linear interpolation for missing years.

    Args:
        years: List of known years
        values: List of known values
        target_years: List of years to interpolate

    Returns:
        List of interpolated values for target_years
    """
    return np.interp(target_years, years, values).tolist()


def prepare_historical_data():
    """Prepare historical sediment and forest data for web visualization."""
    # Read data
    df_sediment = pl.read_parquet("data_parquet/sediment_load_historical.parquet")
    df_forest = pl.read_parquet("data_parquet/forest_coverage_historical.parquet")

    # Get sediment data sorted by year
    sediment_years = df_sediment["Year"].to_list()
    sediment_values = df_sediment["Sediment (10^8t)"].to_list()
    sediment_categories = df_sediment["Cate"].to_list()

    # Get forest data sorted by year
    forest_years = df_forest["year"].to_list()
    forest_values = df_forest["forest"].to_list()

    # Determine the overlapping range for slider (800-1990)
    # But we'll provide full range data
    min_year = min(sediment_years)
    max_year = max(sediment_years)

    # For forest: 800-1990
    forest_min_year = min(forest_years)
    forest_max_year = max(forest_years)

    print(f"Sediment year range: {min_year} to {max_year}")
    print(f"Forest year range: {forest_min_year} to {forest_max_year}")
    print(f"Common range: {forest_min_year} to {forest_max_year}")

    # Create interpolated data for the common range (800-1990) at 10-year intervals
    # This gives smooth slider experience
    common_years = list(range(forest_min_year, forest_max_year + 1, 10))

    # Interpolate sediment values for common years
    sediment_interpolated = linear_interpolate(
        sediment_years, sediment_values, common_years
    )

    # Interpolate forest values for common years (even though it's already dense)
    forest_interpolated = linear_interpolate(forest_years, forest_values, common_years)

    # Prepare output data structure
    output_data = {
        "metadata": {
            "sediment_range": [min_year, max_year],
            "forest_range": [forest_min_year, forest_max_year],
            "common_range": [forest_min_year, forest_max_year],
            "interpolated_years": common_years,
            "description": "Historical sediment load and forest coverage data for Yellow River Basin",
            "units": {"sediment": "10^8 t/year", "forest": "coverage ratio (0-1)"},
        },
        "raw_data": {
            "sediment": [
                {"year": y, "value": v, "category": c}
                for y, v, c in zip(sediment_years, sediment_values, sediment_categories)
            ],
            "forest": [
                {"year": y, "value": v} for y, v in zip(forest_years, forest_values)
            ],
        },
        "interpolated_data": {
            "years": common_years,
            "sediment": sediment_interpolated,
            "forest": forest_interpolated,
        },
    }

    # Save to JSON file for web use
    output_dir = Path("viz/public")
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / "historical_data.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print("\n✓ Data prepared successfully!")
    print(f"  Output file: {output_file}")
    print(f"  Interpolated data points: {len(common_years)}")
    print("  Year interval: 10 years")
    print("\nSample interpolated values:")
    for i in range(0, min(5, len(common_years))):
        year = common_years[i]
        sed = sediment_interpolated[i]
        forest = forest_interpolated[i]
        print(f"  Year {year}: Sediment={sed:.2f}×10⁸t, Forest={forest:.4f}")


if __name__ == "__main__":
    prepare_historical_data()
