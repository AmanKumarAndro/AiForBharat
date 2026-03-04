#!/usr/bin/env python3
"""Example usage scenarios for the Commodity Analyzer"""

from commodity_analyzer import CommodityAnalyzer
import config

def example_1_regional_analysis():
    """Analyze a specific region"""
    print("\n=== Example 1: Regional Analysis ===")
    
    analyzer = CommodityAnalyzer(config.API_KEY, config.AWS_REGION)
    result = analyzer.get_recommendations(
        state="West Bengal",
        district="Coochbehar"
    )
    
    print(f"Analyzed {result['metadata']['analyzed_records']} records")
    print(f"\n{result['analysis']}")

def example_2_commodity_specific():
    """Analyze a specific commodity across regions"""
    print("\n=== Example 2: Commodity-Specific Analysis ===")
    
    analyzer = CommodityAnalyzer(config.API_KEY, config.AWS_REGION)
    result = analyzer.get_recommendations(
        commodity="Pointed gourd (Parval)"
    )
    
    print(f"Total records available: {result['metadata']['total_records']}")
    print(f"\n{result['analysis']}")

def example_3_state_overview():
    """Get state-level overview"""
    print("\n=== Example 3: State Overview ===")
    
    analyzer = CommodityAnalyzer(config.API_KEY, config.AWS_REGION)
    result = analyzer.get_recommendations(
        state="Maharashtra"
    )
    
    print(f"\n{result['analysis']}")

if __name__ == "__main__":
    # Run examples (uncomment the ones you want to try)
    
    example_1_regional_analysis()
    # example_2_commodity_specific()
    # example_3_state_overview()
