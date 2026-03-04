"""
AWS Lambda function for Commodity Market Analyzer
"""

import json
import os
import requests
import boto3
from datetime import datetime
from typing import Dict, Optional

# Initialize Bedrock client
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

API_KEY = os.environ.get('API_KEY', '')
API_BASE_URL = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24"
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-micro-v1:0')

def fetch_commodity_data(state: Optional[str] = None, 
                        district: Optional[str] = None,
                        commodity: Optional[str] = None,
                        limit: int = 100) -> Dict:
    """Fetch commodity data from the API"""
    params = {
        'api-key': API_KEY,
        'format': 'json',
        'limit': limit
    }
    
    if state:
        params['filters[State]'] = state
    if district:
        params['filters[District]'] = district
    if commodity:
        params['filters[Commodity]'] = commodity
        
    response = requests.get(API_BASE_URL, params=params, timeout=30)
    response.raise_for_status()
    return response.json()

def prepare_analysis_prompt(data: Dict) -> str:
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

def analyze_with_bedrock(prompt: str) -> str:
    """Send data to Bedrock for analysis"""
    
    # Check model type and use appropriate format
    if 'nova' in BEDROCK_MODEL_ID.lower():
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
        
        response = bedrock.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        return response_body['output']['message']['content'][0]['text']
    
    elif 'jamba' in BEDROCK_MODEL_ID.lower() or 'ai21' in BEDROCK_MODEL_ID.lower():
        # AI21 Jamba format
        request_body = {
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 2000,
            "temperature": 0.7
        }
        
        response = bedrock.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        return response_body['choices'][0]['message']['content']
    
    elif 'titan' in BEDROCK_MODEL_ID.lower():
        # Amazon Titan format
        request_body = {
            "inputText": prompt,
            "textGenerationConfig": {
                "maxTokenCount": 2000,
                "temperature": 0.7,
                "topP": 0.9
            }
        }
        
        response = bedrock.invoke_model(
            modelId=BEDROCK_MODEL_ID,
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
        
        response = bedrock.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        return response_body['content'][0]['text']

def lambda_handler(event, context):
    """Main Lambda handler"""
    
    # Enable CORS
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    }
    
    try:
        # Handle OPTIONS request for CORS
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # Parse request
        if event.get('body'):
            body = json.loads(event['body'])
        else:
            body = event.get('queryStringParameters', {}) or {}
        
        action = body.get('action', 'analyze')
        state = body.get('state')
        district = body.get('district')
        commodity = body.get('commodity')
        limit = int(body.get('limit', 100))
        
        # Fetch data
        print(f"Fetching data: state={state}, district={district}, commodity={commodity}")
        data = fetch_commodity_data(state, district, commodity, limit)
        
        if action == 'fetch':
            # Return raw data only
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'data': data
                })
            }
        
        # Analyze with Bedrock
        print("Analyzing with AWS Bedrock...")
        prompt = prepare_analysis_prompt(data)
        analysis = analyze_with_bedrock(prompt)
        
        result = {
            'success': True,
            'data': {
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
        }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
