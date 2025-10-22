#!/usr/bin/env python3
"""Test script for the new caching functionality."""

import time

from scripts.query_scenarios import ScenarioQuery


def test_cache_performance():
    """Test cache performance improvements."""
    print("🧪 Testing cache performance...")

    # Initialize query with caching
    query = ScenarioQuery("data_parquet")

    # Test variables
    test_vars = ["YRB WSI", "Total population", "YRB available surface water"]

    # Test filters
    test_filters = [
        None,  # Default scenario
        {"Climate change scenario switch for water yield": [1, 2]},  # RCP2.6 & RCP4.5
        {"Fertility Variation": 1.7},  # Default fertility
    ]

    print("\n📊 Cache stats before testing:")
    stats = query.get_cache_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")

    # Test repeated queries (should hit cache)
    print("\n🔄 Testing repeated queries...")
    for i in range(3):
        print(f"\n  Round {i+1}:")
        for var in test_vars[:2]:  # Limit to 2 variables for speed
            for filters in test_filters[:2]:  # Limit to 2 filter sets
                start_time = time.time()
                try:
                    result = query.get_series(var, filters=filters)
                    end_time = time.time()
                    duration = end_time - start_time
                    print(
                        f"    {var} (filters: {filters}): {duration:.3f}s, {result.height} rows"
                    )
                except Exception as e:
                    print(f"    {var} (filters: {filters}): ERROR - {e}")

    print("\n📊 Cache stats after testing:")
    stats = query.get_cache_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")

    # Test default scenario cache
    print("\n⚡ Testing default scenario cache:")
    for var in test_vars[:2]:
        start_time = time.time()
        try:
            result = query.get_series(var, filters=None)  # Should hit default cache
            end_time = time.time()
            duration = end_time - start_time
            print(f"  {var} (default): {duration:.3f}s, {result.height} rows")
        except Exception as e:
            print(f"  {var} (default): ERROR - {e}")


if __name__ == "__main__":
    test_cache_performance()
