#!/bin/bash

# Create Bedrock Agent Programmatically
# This script creates a Bedrock Agent with 4 tools automatically

set -e  # Exit on error

echo "🚀 Creating Bedrock Agent Programmatically"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
REGION="ap-south-1"
AGENT_NAME="farmer-voice-ai-agent"
AGENT_DESCRIPTION="Agricultural advisor for Indian farmers with 4 intelligent tools"
FOUNDATION_MODEL="amazon.nova-lite-v1:0"  # Free model

# Get AWS Account ID
echo -e "${BLUE}Getting AWS Account ID...${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ Account ID: $ACCOUNT_ID${NC}"
echo ""

# Step 1: Create IAM Role for Agent
echo -e "${BLUE}Step 1: Creating IAM Role for Agent...${NC}"

ROLE_NAME="AmazonBedrockExecutionRoleForAgents_farmer_ai"
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "'$ACCOUNT_ID'"
        },
        "ArnLike": {
          "aws:SourceArn": "arn:aws:bedrock:'$REGION':'$ACCOUNT_ID':agent/*"
        }
      }
    }
  ]
}'

# Check if role exists
if aws iam get-role --role-name "$ROLE_NAME" 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Role already exists, using existing role${NC}"
  ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
else
  # Create role
  ROLE_ARN=$(aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --description "Execution role for Bedrock Agent - Farmer Voice AI" \
    --query 'Role.Arn' \
    --output text)
  
  echo -e "${GREEN}✅ Role created: $ROLE_ARN${NC}"
  
  # Attach policy for Lambda invocation
  POLICY_DOCUMENT='{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "lambda:InvokeFunction"
        ],
        "Resource": [
          "arn:aws:lambda:'$REGION':'$ACCOUNT_ID':function:farmer-voice-ai-web-search",
          "arn:aws:lambda:'$REGION':'$ACCOUNT_ID':function:farmer-voice-ai-dev-dynamoToolLambda",
          "arn:aws:lambda:'$REGION':'$ACCOUNT_ID':function:farmer-voice-ai-dev-youtubeToolLambda"
        ]
      },
      {
        "Effect": "Allow",
        "Action": [
          "bedrock:InvokeModel"
        ],
        "Resource": "arn:aws:bedrock:'$REGION'::foundation-model/*"
      }
    ]
  }'
  
  aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "BedrockAgentPermissions" \
    --policy-document "$POLICY_DOCUMENT"
  
  echo -e "${GREEN}✅ Policy attached${NC}"
  
  # Wait for role to be available
  echo "Waiting for role to propagate..."
  sleep 10
fi
echo ""

# Step 2: Create Agent
echo -e "${BLUE}Step 2: Creating Bedrock Agent...${NC}"

AGENT_INSTRUCTION='You are an agricultural advisor for Indian farmers speaking in Hindi.

You have four tools available:

1. search_icar_knowledge_base
   - Use for: General farming knowledge, crop cultivation, pest management, fertilizers, irrigation
   - Source: ICAR/FSSAI/CIBRC verified documents
   - When: Farmer asks about farming techniques, best practices, crop care

2. query_farmer_database
   - Use for: Historical farmer data, regional crop information, past solutions
   - Source: Local farmer database with regional data
   - When: Farmer asks about past experiences, regional patterns, local data

3. web_search
   - Use for: Current information, government schemes, mandi prices, weather
   - Source: Live web search (Tavily API)
   - When: Farmer asks about PM-KISAN dates, current prices, latest schemes, weather

4. search_youtube_videos
   - Use for: Video tutorials, visual demonstrations, step-by-step guides
   - Source: YouTube videos in Hindi
   - When: Farmer asks for videos, wants to see demonstrations, says "वीडियो दिखाओ"

IMPORTANT RULES:
- Always respond in Hindi with numbered steps
- Choose the most appropriate tool based on the question
- For video requests, use search_youtube_videos
- For current/live data, use web_search
- For general farming knowledge, use search_icar_knowledge_base
- For historical/regional data, use query_farmer_database
- Provide clear, actionable advice
- Include source information when available'

AGENT_RESPONSE=$(aws bedrock-agent create-agent \
  --agent-name "$AGENT_NAME" \
  --agent-resource-role-arn "$ROLE_ARN" \
  --description "$AGENT_DESCRIPTION" \
  --foundation-model "$FOUNDATION_MODEL" \
  --instruction "$AGENT_INSTRUCTION" \
  --region "$REGION" \
  --output json)

AGENT_ID=$(echo "$AGENT_RESPONSE" | jq -r '.agent.agentId')
AGENT_ARN=$(echo "$AGENT_RESPONSE" | jq -r '.agent.agentArn')

echo -e "${GREEN}✅ Agent created!${NC}"
echo -e "${GREEN}   Agent ID: $AGENT_ID${NC}"
echo -e "${GREEN}   Agent ARN: $AGENT_ARN${NC}"
echo ""

# Step 3: Add Action Group 1 - Web Search
echo -e "${BLUE}Step 3: Adding Web Search Action Group...${NC}"

aws bedrock-agent create-agent-action-group \
  --agent-id "$AGENT_ID" \
  --agent-version "DRAFT" \
  --action-group-name "web_tools" \
  --description "Search web for live government schemes and prices" \
  --action-group-executor lambda="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:farmer-voice-ai-web-search" \
  --api-schema "payload=file://scripts/schemas/web-search-schema.json" \
  --region "$REGION" \
  --output json > /dev/null

echo -e "${GREEN}✅ Web Search action group added${NC}"
echo ""

# Step 4: Add Action Group 2 - DynamoDB
echo -e "${BLUE}Step 4: Adding DynamoDB Action Group...${NC}"

aws bedrock-agent create-agent-action-group \
  --agent-id "$AGENT_ID" \
  --agent-version "DRAFT" \
  --action-group-name "farmer_database_tools" \
  --description "Query farmer database for regional data" \
  --action-group-executor lambda="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:farmer-voice-ai-dev-dynamoToolLambda" \
  --api-schema "payload=file://scripts/schemas/dynamo-schema.json" \
  --region "$REGION" \
  --output json > /dev/null

echo -e "${GREEN}✅ DynamoDB action group added${NC}"
echo ""

# Step 5: Add Action Group 3 - YouTube
echo -e "${BLUE}Step 5: Adding YouTube Action Group...${NC}"

aws bedrock-agent create-agent-action-group \
  --agent-id "$AGENT_ID" \
  --agent-version "DRAFT" \
  --action-group-name "youtube_tools" \
  --description "Search YouTube for farming tutorial videos" \
  --action-group-executor lambda="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:farmer-voice-ai-dev-youtubeToolLambda" \
  --api-schema "payload=file://scripts/schemas/youtube-schema.json" \
  --region "$REGION" \
  --output json > /dev/null

echo -e "${GREEN}✅ YouTube action group added${NC}"
echo ""

# Step 6: Prepare Agent
echo -e "${BLUE}Step 6: Preparing Agent...${NC}"
echo "This may take 1-2 minutes..."

aws bedrock-agent prepare-agent \
  --agent-id "$AGENT_ID" \
  --region "$REGION" \
  --output json > /dev/null

# Wait for preparation
sleep 30

echo -e "${GREEN}✅ Agent prepared${NC}"
echo ""

# Step 7: Create Alias
echo -e "${BLUE}Step 7: Creating Agent Alias...${NC}"

ALIAS_RESPONSE=$(aws bedrock-agent create-agent-alias \
  --agent-id "$AGENT_ID" \
  --agent-alias-name "production" \
  --description "Production alias for farmer voice AI" \
  --region "$REGION" \
  --output json)

ALIAS_ID=$(echo "$ALIAS_RESPONSE" | jq -r '.agentAlias.agentAliasId')

echo -e "${GREEN}✅ Alias created: $ALIAS_ID${NC}"
echo ""

# Step 8: Update .env file
echo -e "${BLUE}Step 8: Updating .env file...${NC}"

# Backup existing .env
cp .env .env.backup

# Update .env with Agent IDs
sed -i.tmp "s/^AGENT_ID=.*/AGENT_ID=$AGENT_ID/" .env
sed -i.tmp "s/^AGENT_ALIAS_ID=.*/AGENT_ALIAS_ID=$ALIAS_ID/" .env
rm -f .env.tmp

echo -e "${GREEN}✅ .env file updated${NC}"
echo ""

# Step 9: Grant Lambda permissions for Bedrock to invoke
echo -e "${BLUE}Step 9: Granting Lambda permissions...${NC}"

# Web Search Lambda
aws lambda add-permission \
  --function-name "farmer-voice-ai-web-search" \
  --statement-id "AllowBedrockAgent-$AGENT_ID" \
  --action "lambda:InvokeFunction" \
  --principal "bedrock.amazonaws.com" \
  --source-arn "$AGENT_ARN" \
  --region "$REGION" 2>/dev/null || echo "Permission already exists"

# DynamoDB Lambda
aws lambda add-permission \
  --function-name "farmer-voice-ai-dev-dynamoToolLambda" \
  --statement-id "AllowBedrockAgent-$AGENT_ID" \
  --action "lambda:InvokeFunction" \
  --principal "bedrock.amazonaws.com" \
  --source-arn "$AGENT_ARN" \
  --region "$REGION" 2>/dev/null || echo "Permission already exists"

# YouTube Lambda
aws lambda add-permission \
  --function-name "farmer-voice-ai-dev-youtubeToolLambda" \
  --statement-id "AllowBedrockAgent-$AGENT_ID" \
  --action "lambda:InvokeFunction" \
  --principal "bedrock.amazonaws.com" \
  --source-arn "$AGENT_ARN" \
  --region "$REGION" 2>/dev/null || echo "Permission already exists"

echo -e "${GREEN}✅ Lambda permissions granted${NC}"
echo ""

# Summary
echo "==========================================="
echo -e "${GREEN}🎉 Bedrock Agent Created Successfully!${NC}"
echo "==========================================="
echo ""
echo "Agent Details:"
echo "  Name: $AGENT_NAME"
echo "  Agent ID: $AGENT_ID"
echo "  Alias ID: $ALIAS_ID"
echo "  Region: $REGION"
echo "  Model: $FOUNDATION_MODEL"
echo ""
echo "Action Groups:"
echo "  ✅ web_tools (Web Search)"
echo "  ✅ farmer_database_tools (DynamoDB)"
echo "  ✅ youtube_tools (YouTube)"
echo ""
echo "Next Steps:"
echo "  1. Redeploy backend: npm run deploy"
echo "  2. Test agent: ./scripts/test-agent-all-tools.sh"
echo ""
echo "Agent Console:"
echo "  https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/agents/$AGENT_ID"
echo ""
