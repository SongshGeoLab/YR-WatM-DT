"""
Preprocess RCP-SSP climate data from Excel to Parquet format.

This script loads all climate factor data from Excel files, standardizes data types,
and exports to Parquet format for efficient loading and type consistency.
"""
import pandas as pd
import polars as pl
from pathlib import Path


def process_excel_to_parquet(excel_file, output_dir, variable_name):
    """
    Convert Excel file with multiple sheets to unified Parquet format.
    
    Parameters
    ----------
    excel_file : Path
        Path to the Excel file.
    output_dir : Path
        Directory to save output parquet files.
    variable_name : str
        Name of the climate variable (Pe, ET0, ETc, IWR).
    """
    print(f"Processing {variable_name}...")
    
    # Read all sheets
    xls = pd.ExcelFile(excel_file)
    all_data = []
    
    for sheet_name in xls.sheet_names:
        print(f"  - Sheet: {sheet_name}")
        
        # Read sheet
        df = pd.read_excel(excel_file, sheet_name=sheet_name)
        
        # Convert to polars
        df_pl = pl.from_pandas(df)
        
        # Get column names
        cols = df_pl.columns
        year_col = cols[0]
        
        # Melt to long format
        df_long = df_pl.melt(
            id_vars=year_col,
            value_vars=cols[1:],
            variable_name='Scenario',
            value_name='Value'
        )
        
        # Rename year column if needed
        if year_col != 'Year':
            df_long = df_long.rename({year_col: 'Year'})
        
        # Cast all numeric columns to Float64 for consistency
        df_long = df_long.with_columns([
            pl.col('Year').cast(pl.Int64),
            pl.col('Value').cast(pl.Float64),
            pl.lit(variable_name).alias('Variable'),
            pl.lit(sheet_name).alias('CropType')
        ])
        
        all_data.append(df_long)
    
    # Concatenate all sheets
    combined = pl.concat(all_data)
    
    # Filter out year 2000 as mentioned in documentation
    combined = combined.filter(pl.col('Year') > 2000)
    
    # Save to parquet
    output_file = output_dir / f"{variable_name.lower()}_data.parquet"
    combined.write_parquet(output_file)
    
    print(f"  ✓ Saved to {output_file}")
    print(f"  ✓ Shape: {combined.shape}")
    
    return combined


def main():
    """Main preprocessing function."""
    # Define paths (use absolute paths)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_dir = project_root / "data" / "RCP_SSP"
    output_dir = project_root / "data_parquet" / "rcp_ssp"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Process all variables
    variables = {
        'Pe': data_dir / "Pe_all.xlsx",
        'ET0': data_dir / "ET0_all.xlsx",
        'ETc': data_dir / "ETc_all.xlsx",
        'IWR': data_dir / "IWR" / "IWR_all.xlsx"
    }
    
    all_dataframes = []
    
    for var_name, excel_file in variables.items():
        df = process_excel_to_parquet(excel_file, output_dir, var_name)
        all_dataframes.append(df)
    
    # Combine all variables into one file
    print("\nCombining all variables...")
    combined_all = pl.concat(all_dataframes)
    
    output_combined = output_dir / "all_climate_data.parquet"
    combined_all.write_parquet(output_combined)
    
    print(f"\n✓ Combined data saved to: {output_combined}")
    print(f"✓ Total shape: {combined_all.shape}")
    print(f"✓ Variables: {combined_all['Variable'].unique().to_list()}")
    print(f"✓ Scenarios: {combined_all['Scenario'].unique().to_list()}")
    print(f"✓ Crop types: {combined_all['CropType'].unique().to_list()}")
    print(f"✓ Year range: {combined_all['Year'].min()} - {combined_all['Year'].max()}")
    
    print("\n✅ Preprocessing complete!")


if __name__ == "__main__":
    main()

