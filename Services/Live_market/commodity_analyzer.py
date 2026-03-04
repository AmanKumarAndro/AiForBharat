#!/usr/bin/env python3
"""
Commodity Price Analyzer using AWS Bedrock
Analyzes Indian agricultural market data and provides recommendations
"""

import requests
import json
import boto3
from datetime import datetime
from typing import Dict, List, Optional

class CommodityAnalyzer:
    def __init__(self, api_key: str, aws_region: str = "us-east-1"):
        self.api_key = api_key
        self.base_url = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24"
        self.bedrock = boto3.client('bedrock-runtime', region_name=aws_region)
        
    def fetch_commodity_data(self, state: Optional[str] = None, 
                            district: Optional[str] = None,
                            commodity: Optional[str] = None,
                            limit: int = 100) -> Dict:
        """Fetch commodity data from the API"""
        params = {
            'api-key': self.api_key,
            'format': 'json',
            'limit': limit
        }
        
        if state:
            params['filters[State]'] = state
        if district:
            params['filters[District]'] = district
        if commodity:
            params['filters[Commodity]'] = commodity
            
        response = requests.get(self.base_url, params=params)
        response.raise_for_status()
        return response.json()
    
    def prepare_analysis_prompt(self, data: Dict) -> str:
        """Prepare prompt for Bedrock analysis"""
        records = data.get('records', [])
        
        prompt = f"""Analyze the following agricultural commodity market data and provide insights:

Total Records: {data.get('total', 0)}
Records Analyzed: {len(records)}

Data Sample:
{json.dumps(records[:20], indent=2)}

Please provide:
1. Price Trend Analysis: Identify commodities with rising or falling prices
2. Market Recommendations: Which commodities are good for buying/selling
3. Regional Insights: Price variations across different markets
4. Best Opportunities: Top 3 commodities with best price potential
5. Risk Assessment: Commodities with high price volatility

Format your response in clear sections with actionable recommendations."""
        
        return prompt
    
    def analyze_with_bedrock(self, prompt: str, model_id: str = "amazon.nova-micro-v1:0") -> str:
        """Send data to Bedrock for analysis"""
        
        # Check model type and use appropriate format
        if 'nova' in model_id.lower():
            # Amazon Nova format (Converse API)
            request_body = {
                "messages": [
                    {
                        "role": "user",
                        "content": [{"text": prompt}]
                    }
                ],
                "inferenceConfig": {
                    "maxTokens": 2000,
                    "temperature": 0.7
                }
            }
            
            response = self.bedrock.invoke_model(
                modelId=model_id,
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            return response_body['output']['message']['content'][0]['text']
        
        elif 'jamba' in model_id.lower() or 'ai21' in model_id.lower():
            # AI21 Jamba format
            request_body = {
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 2000,
                "temperature": 0.7
            }
            
            response = self.bedrock.invoke_model(
                modelId=model_id,
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            return response_body['choices'][0]['message']['content']
        
        elif 'titan' in model_id.lower():
            # Amazon Titan format
            request_body = {
                "inputText": prompt,
                "textGenerationConfig": {
                    "maxTokenCount": 2000,
                    "temperature": 0.7,
                    "topP": 0.9
                }
            }
            
            response = self.bedrock.invoke_model(
                modelId=model_id,
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            return response_body['results'][0]['outputText']
        
        else:
            # Anthropic Claude format
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2000,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            response = self.bedrock.invoke_model(
                modelId=model_id,
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            return response_body['content'][0]['text']
    
    def get_recommendations(self, state: Optional[str] = None,
                          district: Optional[str] = None,
                          commodity: Optional[str] = None) -> Dict:
        """Get commodity recommendations"""
        print(f"Fetching data for State: {state}, District: {district}, Commodity: {commodity}")
        
        # Fetch data
        data = self.fetch_commodity_data(state, district, commodity)
        
        # Prepare prompt
        prompt = self.prepare_analysis_prompt(data)
        
        # Analyze with Bedrock
        print("Analyzing with AWS Bedrock...")
        analysis = self.analyze_with_bedrock(prompt)
        
        return {
            'metadata': {
                'state': state,
                'district': district,
                'commodity': commodity,
                'total_records': data.get('total', 0),
                'analyzed_records': len(data.get('records', [])),
                'timestamp': datetime.now().isoformat()
            },
            'analysis': analysis
        }

def main():
    from config import API_KEY
    
    analyzer = CommodityAnalyzer(API_KEY)
    
    # Example: Analyze West Bengal market
    result = analyzer.get_recommendations(
        state="West Bengal",
        district="Coochbehar"
    )
    
    print("\n" + "="*80)
    print("COMMODITY MARKET ANALYSIS")
    print("="*80)
    print(f"\nMetadata:")
    print(json.dumps(result['metadata'], indent=2))
    print(f"\nAnalysis:\n{result['analysis']}")

if __name__ == "__main__":
    main()
