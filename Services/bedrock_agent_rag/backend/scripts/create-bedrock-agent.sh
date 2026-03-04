#!/bin/bash

# Script to create Bedrock Agent with two tools:
# 1. search_icar_knowledge_base - for farming questions
# 2. web_search - for live queries (PM-KISAN, mandi prices)

set -e

REGION="ap-south-1"
STAGE="${1:-dev}"
SERVICE_NAME="farmer-voice-ai"
AGENT_NAME="${SERVICE_NAME}-agent"

echo "🤖 Creating Bedrock Agent with Tools"
echo "====================================="
echo "Region: $REGION"
echo "Stage: $STAGE"
echo ""

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $ACCOUNT_ID"
echo ""

# Step 1: Create IAM role for the agent
echo "📋 Step 1: Creating IAM role for Bedrock Agent..."

ROLE_NAME="${AGENT_NAME}-role"
TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Service": "bedrock.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
  }]
}
EOF
)

# Create role
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document "$TRUST_POLICY" \
  --description "Role for Farmer Voice AI Bedrock Agent" \
  2>/dev/null || echo "Role already exists"

# Attach policies
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
echo "✅ Role created: $ROLE_ARN"
echo ""

# Wait for role to propagate
echo "⏳ Waiting for IAM role to propagate..."
sleep 10

# Step 2: Create Lambda for web search tool
echo "📋 Step 2: Creating Lambda function for web search..."

# Create Lambda function code
cat > /tmp/web_search_lambda.py << 'PYTHON_CODE'
import json
import os
import urllib.request
import urllib.parse

TAVILY_API_KEY = os.environ.get('TAVILY_API_KEY', '')

def lambda_handler(event, context):
    """
    Web search tool for Bedrock Agent using Tavily API
    """
    print(f"Received event: {json.dumps(event)}")
    
    # Extract parameters from agent event
    parameters = event.get('parameters', [])
    query = None
    
    for param in parameters:
        if param.get('name') == 'query':
            query = param.get('value')
            break
    
    if not query:
        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event.get('actionGroup'),
                'function': event.get('function'),
                'functionResponse': {
                    'responseBody': {
                        'TEXT': {
                            'body': json.dumps({'error': 'Query parameter is required'})
                        }
                    }
                }
            }
        }
    
    # Call Tavily API
    try:
        if not TAVILY_API_KEY:
            # Fallback: return mock data for demo
            result = {
                'results': [{
                    'title': 'PM-KISAN Information',
                    'content': f'Search results for: {query}. Please configure TAVILY_API_KEY for live results.',
                    'url': 'https://pmkisan.gov.in'
                }]
            }
        else:
            # Real Tavily API call
            tavily_url = 'https://api.tavily.com/search'
            data = json.dumps({
                'api_key': TAVILY_API_KEY,
                'query': query,
                'search_depth': 'basic',
                'max_results': 3
            }).encode('utf-8')
            
            req = urllib.request.Request(
                tavily_url,
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
        
        # Format results
        formatted_results = []
        for item in result.get('results', [])[:3]:
            formatted_results.append({
                'title': item.get('title', ''),
                'content': item.get('content', ''),
                'url': item.get('url', '')
            })
        
        response_body = {
            'query': query,
            'results': formatted_results,
            'count': len(formatted_results)
        }
        
        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event.get('actionGroup'),
                'function': event.get('function'),
                'functionResponse': {
                    'responseBody': {
                        'TEXT': {
                            'body': json.dumps(response_body)
                        }
                    }
                }
            }
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event.get('actionGroup'),
                'function': event.get('function'),
                'functionResponse': {
                    'responseBody': {
                        'TEXT': {
                            'body': json.dumps({'error': str(e)})
                        }
                    }
                }
            }
        }
PYTHON_CODE

# Zip the Lambda code
cd /tmp
zip web_search_lambda.zip web_search_lambda.py

# Create Lambda execution role
LAMBDA_ROLE_NAME="${SERVICE_NAME}-web-search-lambda-role"
LAMBDA_TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Service": "lambda.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
  }]
}
EOF
)

aws iam create-role \
  --role-name $LAMBDA_ROLE_NAME \
  --assume-role-policy-document "$LAMBDA_TRUST_POLICY" \
  2>/dev/null || echo "Lambda role already exists"

aws iam attach-role-policy \
  --role-name $LAMBDA_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

LAMBDA_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${LAMBDA_ROLE_NAME}"

sleep 5

# Create Lambda function
LAMBDA_NAME="${SERVICE_NAME}-web-search"
aws lambda create-function \
  --function-name $LAMBDA_NAME \
  --runtime python3.11 \
  --role $LAMBDA_ROLE_ARN \
  --handler web_search_lambda.lambda_handler \
  --zip-file fileb://web_search_lambda.zip \
  --timeout 30 \
  --environment "Variables={TAVILY_API_KEY=}" \
  --region $REGION \
  2>/dev/null || aws lambda update-function-code \
    --function-name $LAMBDA_NAME \
    --zip-file fileb://web_search_lambda.zip \
    --region $REGION

LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function/${LAMBDA_NAME}"
echo "✅ Lambda created: $LAMBDA_ARN"
echo ""

# Step 3: Create Agent OpenAPI schema
echo "📋 Step 3: Creating OpenAPI schema for agent tools..."

cat > /tmp/agent_schema.json << 'EOF'
{
  "openapi": "3.0.0",
  "info": {
    "title": "Farmer Voice AI Tools",
    "version": "1.0.0",
    "description": "Tools for agricultural advisory: Knowledge Base search and web search"
  },
  "paths": {
    "/search_icar_knowledge_base": {
      "post": {
        "summary": "Search ICAR agricultural knowledge base",
        "description": "Search for information about crops, pests, diseases, fertilizers, irrigation, and farming practices from verified ICAR/FSSAI/CIBRC sources",
        "operationId": "search_icar_knowledge_base",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "query": {
                    "type": "string",
                    "description": "The farming question to search for (in Hindi or English)"
                  }
                },
                "required": ["query"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Search results from knowledge base",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "results": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "content": {"type": "string"},
                          "source": {"type": "string"}
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/web_search": {
      "post": {
        "summary": "Search the web for live information",
        "description": "Search for current information about government schemes (PM-KISAN), mandi prices, weather, scheme disbursement dates, and other time-sensitive data",
        "operationId": "web_search",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "query": {
                    "type": "string",
                    "description": "The query to search on the web"
                  }
                },
                "required": ["query"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Web search results",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "results": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "title": {"type": "string"},
                          "content": {"type": "string"},
                          "url": {"type": "string"}
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
EOF

echo "✅ OpenAPI schema created"
echo ""

echo "🎉 Setup Complete!"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Next Steps - Create Agent in AWS Console:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. Go to: https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/agents"
echo ""
echo "2. Click 'Create Agent'"
echo ""
echo "3. Agent Details:"
echo "   - Name: $AGENT_NAME"
echo "   - Model: Amazon Nova 2 Lite"
echo "   - Instructions:"
echo "     'You are an agricultural advisor for Indian farmers."
echo "      Use search_icar_knowledge_base for farming questions."
echo "      Use web_search for live data like PM-KISAN, mandi prices."
echo "      Always respond in Hindi with numbered steps.'"
echo ""
echo "4. Add Action Group:"
echo "   - Name: farming_tools"
echo "   - Action group type: Define with API schemas"
echo "   - Action group invocation: Lambda function"
echo "   - Lambda: $LAMBDA_ARN"
echo "   - API Schema: Upload /tmp/agent_schema.json"
echo ""
echo "5. Add Knowledge Base (for search_icar_knowledge_base tool):"
echo "   - Associate your existing Knowledge Base"
echo "   - Or create one following SETUP_GUIDE.md"
echo ""
echo "6. Click 'Prepare' to build the agent"
echo ""
echo "7. Copy Agent ID and Alias ID to backend/.env:"
echo "   AGENT_ID=<your-agent-id>"
echo "   AGENT_ALIAS_ID=<your-agent-alias-id>"
echo ""
echo "8. Optional: Add Tavily API key for real web search:"
echo "   aws lambda update-function-configuration \\"
echo "     --function-name $LAMBDA_NAME \\"
echo "     --environment \"Variables={TAVILY_API_KEY=your-key}\" \\"
echo "     --region $REGION"
echo ""
echo "9. Redeploy backend:"
echo "   cd backend && npm run deploy"
echo ""
echo "═══════════════════════════════════════════════════════════"
