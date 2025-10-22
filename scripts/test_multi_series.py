"""Test script for /series/multi endpoint.

This script demonstrates how to use the new multi-scenario query endpoint
with various parameter combinations and the "Any" logic.

Run this after starting the API server:
    poetry run uvicorn scripts.api_server:app --host 0.0.0.0 --port 8000

Then run this test:
    poetry run python scripts/test_multi_series.py
"""

import json
from typing import Dict, List, Optional, Union

import requests  # type: ignore

API_BASE_URL = "http://localhost:8000"


def test_multi_series(
    variable: str,
    filters: Dict[str, Union[int, float, List]],
    aggregate: bool = True,
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
) -> Optional[Dict]:
    """Query multi-scenario data.

    Args:
        variable: Variable name to query.
        filters: Parameter filters (supports lists for "Any" logic).
        aggregate: Whether to return aggregated statistics.
        start_year: Optional start year.
        end_year: Optional end year.

    Returns:
        API response as dictionary.
    """
    params = {
        "variable": variable,
        "filters": json.dumps(filters),
        "aggregate": str(aggregate).lower(),
    }

    if start_year:
        params["start_year"] = str(start_year)
    if end_year:
        params["end_year"] = str(end_year)

    response = requests.get(f"{API_BASE_URL}/series/multi", params=params)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Error {response.status_code}: {response.text}")
        return None


def print_result_summary(result: Dict, test_name: str):
    """Print a summary of the API response."""
    print(f"\n{'=' * 60}")
    print(f"📊 Test: {test_name}")
    print(f"{'=' * 60}")

    if not result:
        print("❌ No result returned")
        return

    print(f"Variable: {result.get('variable')}")
    print(f"Matching scenarios: {result.get('n_scenarios')}")

    if "filter_summary" in result:
        print("\n🔍 Filter Summary:")
        for param, info in result["filter_summary"].items():
            requested = info["requested"]
            matched = info["matched"]
            if requested == "any":
                print(f"  • {param}: ANY → matched {matched}")
            else:
                print(f"  • {param}: {requested} → matched {matched}")

    if "series" in result:
        series = result["series"]
        print("\n📈 Series Data:")
        print(f"  Time points: {len(series['time'])}")
        print(f"  Time range: {series['time'][0]} - {series['time'][-1]}")

        if "mean" in series:
            print(
                "  Mean range: {:.2f} - {:.2f}".format(
                    min(series["mean"]), max(series["mean"])
                )
            )
            ci_widths = [
                upper - lower
                for upper, lower in zip(series["ci_upper"], series["ci_lower"])
            ]
            avg_ci_width = sum(ci_widths) / len(series["mean"])
            print(f"  CI width (avg): {avg_ci_width:.2f}")

    if "scenarios" in result:
        scenarios = result["scenarios"]
        print("\n📋 Individual Scenarios:")
        for i, scenario in enumerate(scenarios[:3]):  # Show first 3
            print(f"  {i+1}. {scenario['scenario_name']}")
            print(f"     Parameters: {scenario['parameters']}")
            print(f"     Data points: {len(scenario['series']['time'])}")
        if len(scenarios) > 3:
            print(f"  ... and {len(scenarios) - 3} more scenarios")


def main():
    """Run test cases for the multi-scenario endpoint."""
    print("🚀 Testing /series/multi endpoint")
    print(f"API: {API_BASE_URL}")

    # Test 1: Single parameter fixed, others "Any"
    print("\n" + "=" * 60)
    print("TEST 1: Climate fixed, others Any (aggregate)")
    result = test_multi_series(
        variable="Total population",
        filters={"Climate change scenario switch for water yield": 2},
        aggregate=True,
        start_year=2020,
        end_year=2050,
    )
    print_result_summary(result, "Climate RCP4.5, all other parameters Any")

    # Test 2: Multiple parameters with list values (Any logic)
    print("\n" + "=" * 60)
    print("TEST 2: Multiple parameters with list (Any logic)")
    result = test_multi_series(
        variable="YRB WSI",
        filters={
            "Climate change scenario switch for water yield": [
                1,
                2,
            ],  # RCP2.6 or RCP4.5
            "Fertility Variation": [1.6, 1.7, 1.8],  # Low, medium, high
        },
        aggregate=True,
    )
    print_result_summary(result, "Multiple climate & fertility scenarios")

    # Test 3: Highly constrained query
    print("\n" + "=" * 60)
    print("TEST 3: Highly constrained (few scenarios)")
    result = test_multi_series(
        variable="GDP per capita",
        filters={
            "Climate change scenario switch for water yield": 1,
            "Fertility Variation": 1.7,
            "Diet change scenario switch": 2,
            "Ecological water flow variable": 0.25,
        },
        aggregate=True,
    )
    print_result_summary(result, "Fixed 4 parameters, 2 vary")

    # Test 4: No aggregation - return all scenarios
    print("\n" + "=" * 60)
    print("TEST 4: No aggregation (raw scenario data)")
    result = test_multi_series(
        variable="YRB available surface water",
        filters={
            "Climate change scenario switch for water yield": 3,
            "Fertility Variation": 1.6,
            "Diet change scenario switch": 1,
        },
        aggregate=False,
    )
    print_result_summary(
        result, "Raw data for RCP8.5 + low fertility + traditional diet"
    )

    # Test 5: Minimal filters (many scenarios)
    print("\n" + "=" * 60)
    print("TEST 5: Minimal filters (many scenarios)")
    result = test_multi_series(
        variable="water consumption of province in YRB sum",
        filters={"Diet change scenario switch": 2},
        aggregate=True,
        start_year=2080,
        end_year=2100,
    )
    print_result_summary(result, "Only diet fixed, all others vary")

    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API server")
        print("Please start the server first:")
        print("  poetry run uvicorn scripts.api_server:app --host 0.0.0.0 --port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()
