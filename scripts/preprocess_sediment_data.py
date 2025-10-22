"""Convert sediment and forest data from Excel to Parquet format.

This script processes the sediment.xlsx file containing:
- sediment sheet: sediment load changes over 2000+ years
- forest sheet: vegetation coverage changes over 1000+ years
"""

from pathlib import Path

import polars as pl


def convert_sediment_to_parquet() -> None:
    """Convert sediment and forest data from Excel to Parquet format."""
    # Define paths
    input_file = Path("sediment.xlsx")
    output_dir = Path("data_parquet")
    output_dir.mkdir(exist_ok=True)

    # Read sediment data
    print("Reading sediment sheet...")
    df_sediment = pl.read_excel(input_file, sheet_name="sediment")
    print(f"Sediment data shape: {df_sediment.shape}")
    print(f"Columns: {df_sediment.columns}")
    print(f"Year range: {df_sediment['Year'].min()} to {df_sediment['Year'].max()}")

    # Read forest coverage data
    print("\nReading forest sheet...")
    df_forest = pl.read_excel(input_file, sheet_name="forest")
    print(f"Forest data shape: {df_forest.shape}")
    print(f"Columns: {df_forest.columns}")
    print(f"Year range: {df_forest['year'].min()} to {df_forest['year'].max()}")

    # Save to parquet
    sediment_output = output_dir / "sediment_load_historical.parquet"
    forest_output = output_dir / "forest_coverage_historical.parquet"

    print(f"\nSaving sediment data to {sediment_output}...")
    df_sediment.write_parquet(sediment_output)

    print(f"Saving forest data to {forest_output}...")
    df_forest.write_parquet(forest_output)

    print("\n✓ Conversion completed successfully!")
    print(f"  - {sediment_output}")
    print(f"  - {forest_output}")


if __name__ == "__main__":
    convert_sediment_to_parquet()
