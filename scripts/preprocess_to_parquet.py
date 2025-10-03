"""Preprocess VISUM Decision Theater outputs into a columnar Parquet dataset.

This script performs the following steps:

1) Read metadata.json to discover variables and their CSV filenames
2) Convert TIME.csv into a canonical time vector Parquet (step, time)
3) Read scenario_combinations3.xlsx and write scenarios.parquet
4) For each variable CSV (except TIME), convert wide 4725x1905 to long Parquet
   columns: scenario_name, step, value, variable

Notes
- Assumes each CSV has 4725 rows (scenarios) and 1905 columns (time steps)
- Derives scenario_name as "sc_{row_index}"
- Uses Polars lazy APIs to reduce memory pressure when possible

Run
    poetry run python scripts/preprocess_to_parquet.py \
        --data-dir /Users/songshgeo/Documents/VSCode/WatM-DT/data \
        --out-dir  /Users/songshgeo/Documents/VSCode/WatM-DT/data_parquet

Google-style docstrings are used throughout for clarity.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable, List, Tuple

import polars as pl


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments.

    Returns:
        argparse.Namespace: Parsed arguments containing data and output dirs.
    """

    parser = argparse.ArgumentParser(description="Convert CSV dataset to Parquet")
    parser.add_argument(
        "--data-dir",
        type=Path,
        required=True,
        help="Directory containing raw CSV files and metadata.json",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        required=True,
        help="Output directory to place Parquet files",
    )
    parser.add_argument(
        "--excel",
        type=Path,
        default=Path("scenario_combinations3.xlsx"),
        help="Path to scenario combinations Excel file",
    )
    parser.add_argument(
        "--compression",
        type=str,
        default="zstd",
        choices=["zstd", "snappy", "lz4", "uncompressed"],
        help="Parquet compression codec",
    )
    return parser.parse_args()


def read_metadata(metadata_path: Path) -> Tuple[List[Tuple[str, str]], dict]:
    """Read metadata.json to extract outcomes list.

    Args:
        metadata_path: Path to metadata.json

    Returns:
        Tuple[List[Tuple[str, str]], dict]:
            - List of (variable_name, filename) pairs from outcomes
            - Full metadata dict for potential future use
    """
    with metadata_path.open("r", encoding="utf-8") as f:
        meta = json.load(f)

    outcomes = meta.get("outcomes", [])
    pairs: List[Tuple[str, str]] = []
    for outcome in outcomes:
        # Expect format ["TimeSeriesOutcome", "YRB WSI", "YRB WSI.csv"]
        if not isinstance(outcome, list) or len(outcome) < 3:
            continue
        _, variable_name, filename = outcome[:3]
        pairs.append((variable_name, filename))
    return pairs, meta


def ensure_out_dir(out_dir: Path) -> None:
    """Create output directory if missing.

    Args:
        out_dir: Parquet output directory.
    """
    out_dir.mkdir(parents=True, exist_ok=True)


def build_time_parquet(data_dir: Path, out_dir: Path, compression: str) -> None:
    """Convert TIME.csv to time.parquet with columns [step, time].

    Notes:
        - TIME.csv shape is 4725 x 1905 (scenarios x timesteps),
          but time values are identical across rows. We take the first row.

    Args:
        data_dir: Directory containing TIME.csv
        out_dir: Output directory for time.parquet
        compression: Parquet compression codec
    """
    time_csv = data_dir / "TIME.csv"
    if not time_csv.exists():
        raise FileNotFoundError(f"TIME.csv not found: {time_csv}")

    # Read first row only to build the time vector
    time_row = pl.read_csv(time_csv, n_rows=1)
    time_vec = time_row.transpose(
        include_header=False, column_names=["time"]
    ).with_row_index("step")
    (out_dir / "time.parquet").parent.mkdir(parents=True, exist_ok=True)
    time_vec.write_parquet(out_dir / "time.parquet", compression=compression)


def build_scenarios_parquet(excel_path: Path, out_dir: Path, compression: str) -> None:
    """Write scenarios.parquet from the Excel of scenario combinations.

    Ensures `scenario_name` exists and is categorical.

    Args:
        excel_path: Path to scenario_combinations3.xlsx
        out_dir: Output directory
        compression: Parquet compression codec
    """
    if not excel_path.exists():
        raise FileNotFoundError(f"Excel not found: {excel_path}")

    scenarios = pl.read_excel(excel_path)
    if "scenario_name" not in scenarios.columns:
        # Derive if missing
        scenarios = (
            scenarios.with_row_count("row_id")
            .with_columns(pl.format("sc_{}", pl.col("row_id")).alias("scenario_name"))
            .drop("row_id")
        )

    scenarios = scenarios.with_columns(pl.col("scenario_name").cast(pl.Categorical))
    scenarios.write_parquet(out_dir / "scenarios.parquet", compression=compression)


def wide_csv_to_long_df(csv_path: Path, variable: str) -> pl.DataFrame:
    """Convert a wide CSV (rows=scenarios, cols=time steps) to a long DataFrame.

    The resulting schema is: scenario_name: cat, step: u32, value: f64, variable: cat

    Args:
        csv_path: Path to the wide CSV file
        variable: Variable name for the `variable` column

    Returns:
        pl.DataFrame: Long-form frame suitable for writing to Parquet
    """
    # Use file handle to avoid any glob interpretation on paths with [] characters
    with csv_path.open("rb") as fh:
        df = pl.read_csv(fh)
    df = (
        df.with_row_index("row_id")
        .with_columns(pl.format("sc_{}", pl.col("row_id")).alias("scenario_name"))
        .drop("row_id")
    )
    long_df = df.melt(
        id_vars=["scenario_name"], variable_name="step", value_name="value"
    )
    long_df = long_df.with_columns(
        pl.col("scenario_name").cast(pl.Categorical),
        pl.col("step").cast(pl.UInt32),
        pl.col("value").cast(pl.Float64),
        pl.lit(variable).alias("variable").cast(pl.Categorical),
    )
    return long_df


def process_variables_to_parquet(
    data_dir: Path,
    out_dir: Path,
    variables: Iterable[Tuple[str, str]],
    compression: str,
) -> None:
    """Process each variable CSV to Parquet long tables.

    Args:
        data_dir: Input data directory containing CSV files
        out_dir: Output directory for Parquet files
        variables: Iterable of (variable_name, filename) pairs
        compression: Parquet compression codec
    """
    for variable_name, filename in variables:
        if variable_name == "TIME":
            # TIME handled separately
            continue
        csv_path = data_dir / filename
        if not csv_path.exists():
            print(f"[WARN] Missing CSV for variable '{variable_name}': {csv_path}")
            continue
        print(f"[INFO] Converting {variable_name} <- {csv_path.name}")
        long_df = wide_csv_to_long_df(csv_path, variable_name)
        # Write Parquet
        out_file = out_dir / f"{variable_name}.parquet"
        out_file.parent.mkdir(parents=True, exist_ok=True)
        long_df.write_parquet(out_file, compression=compression)


def main() -> None:
    """Entrypoint to build the Parquet dataset from raw CSV inputs."""
    args = parse_args()
    data_dir: Path = args.data_dir
    out_dir: Path = args.out_dir
    compression: str = args.compression

    ensure_out_dir(out_dir)

    # Read metadata for variable discovery
    variables, _meta = read_metadata(data_dir / "metadata.json")

    # TIME vector
    build_time_parquet(data_dir, out_dir, compression)

    # Scenarios
    build_scenarios_parquet(args.excel, out_dir, compression)

    # Variables (excluding TIME)
    process_variables_to_parquet(data_dir, out_dir, variables, compression)

    print(f"[DONE] Parquet dataset written to: {out_dir}")


if __name__ == "__main__":
    main()
