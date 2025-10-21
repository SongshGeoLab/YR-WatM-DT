# RCP-SSP Climate Data (Parquet Format)

## Overview

This directory contains pre-processed climate scenario data in Parquet format, converted from the original Excel files in `data/RCP_SSP/`.

## Data Files

| File | Description | Size |
|------|-------------|------|
| `all_climate_data.parquet` | Combined data for all variables and scenarios | ~27KB |
| `pe_data.parquet` | Effective precipitation (Pe) data | ~3.3KB |
| `et0_data.parquet` | Reference crop evapotranspiration (ET0) | ~3.3KB |
| `etc_data.parquet` | Crop water demand (ETc) | ~14KB |
| `iwr_data.parquet` | Irrigation water requirement (IWR) | ~14KB |

## Data Schema

All files share the same schema:

```
Year (Int64): Year of observation (2001-2100)
Scenario (String): Climate scenario identifier
Value (Float64): Climate factor value in mm
Variable (String): Climate variable name (Pe, ET0, ETc, IWR)
CropType (String): Crop type or aggregation level
```

## Available Scenarios

### Corrected Scenarios (Recommended)
- `ssp126_corrected` → RCP2.6-SSP1 (Low emissions)
- `ssp245_corrected` → RCP4.5-SSP2 (Medium emissions)
- `ssp585_corrected` → RCP8.5-SSP5 (High emissions)

### Original Scenarios
- `ssp126`, `ssp245`, `ssp585`
- `his` (Historical)
- `his_corrected` (Historical corrected)
- `Average Total` (Aggregated average)

## Crop Types

- `Rice`: Rice crops
- `Spring_Maize`: Spring maize
- `Summer_Maize`: Summer maize
- `Spring_Wheat`: Spring wheat
- `Winter_wheat`: Winter wheat
- `Five_crops`: **Aggregated total for all five crops (recommended for overall analysis)**
- `Sheet1`: Pe and ET0 data (no crop differentiation)

## Data Processing

### Preprocessing Script

Location: `scripts/preprocess_rcp_ssp_data.py`

The preprocessing script:
1. Loads Excel files from `data/RCP_SSP/`
2. Converts all numeric values to Float64 for type consistency
3. Melts data to long format (tidy data)
4. Filters out year 2000 (incomplete growth cycles)
5. Exports to Parquet format for fast loading

### Running Preprocessing

```bash
cd /Users/songshgeo/Documents/VSCode/WatM-DT
source .venv/bin/activate
python scripts/preprocess_rcp_ssp_data.py
```

## Usage in Analysis

### Loading Data with Polars

```python
import polars as pl

# Load all climate data
df = pl.read_parquet('data_parquet/rcp_ssp/all_climate_data.parquet')

# Filter for specific scenarios (corrected versions)
df_filtered = df.filter(
    pl.col('Scenario').is_in(['ssp126_corrected', 'ssp245_corrected', 'ssp585_corrected'])
)

# Get Five_crops aggregated data
df_total = df_filtered.filter(pl.col('CropType') == 'Five_crops')
```

### Example Queries

```python
# Get Pe values for RCP2.6 scenario
pe_ssp126 = df.filter(
    (pl.col('Variable') == 'Pe') &
    (pl.col('Scenario') == 'ssp126_corrected')
)

# Calculate mean values by scenario
means = df.group_by(['Scenario', 'Variable']).agg(
    pl.col('Value').mean().alias('mean_value')
)
```

## Data Quality Notes

1. **Use corrected scenarios** (`*_corrected`) for better data quality
2. **Year 2000 filtered out**: Initial year has incomplete crop growth cycles
3. **Consistent types**: All numeric values standardized to Float64
4. **Fast loading**: Parquet format is 10-100x faster than Excel for large datasets

## Related Files

- Source data: `data/RCP_SSP/`
- Analysis notebook: `reports/page2.ipynb`
- Data description: `data/RCP_SSP/说明.txt`

## Last Updated

2025-10-10
