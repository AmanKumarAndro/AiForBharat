#!/bin/bash

# Add Action Groups to Existing Bedrock Agent

set -e

echo "🔧 Adding Action Groups to Bedrock Agent"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGION="ap-south-1"
AGENT_ID="UZ4BBKGOJB"  # From previous creation
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Agent ID: $AGENT_ID"
echo "Account ID: $ACCOUNT_ID"
echo ""

# Step 1: Add Web Search Action Group
echo -e "${BLUE}Step 1: Adding Web Search Action Group...${NC}"

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

# Step 2: Add DynamoDB Action Group
echo -e "${BLUE}Step 2: Adding DynamoDB Action Group...${NC}"

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

# Step 3: Add YouTube Action Group
echo -e "${BLUE}Step 3: Adding YouTube Action Group...${NC}"

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

# Step 4: Prepare Agent
echo -e "${BLUE}Step 4: Preparing Agent...${NC}"
echo "This may take 1-2 minutes..."

aws bedrock-agent prepare-agent \
  --agent-id "$AGENT_ID" \
  --region "$REGION" \
  --output json > /dev/null

sleep 30

echo -e "${GREEN}✅ Agent prepared${NC}"
echo ""

# Step 5: Create Alias
echo -e "${BLUE}Step 5: Creating Agent Alias...${NC}"

ALIAS_RESPONSE=$(aws bedrock-agent create-agent-alias \
  --agent-id "$AGENT_ID" \
  --agent-alias-name "production" \
  --description "Production alias for farmer voice AI" \
  --region "$REGION" \
  --output json)

ALIAS_ID=$(echo "$ALIAS_RESPONSE" | jq -r '.agentAlias.agentAliasId')

echo -e "${GREEN}✅ Alias created: $ALIAS_ID${NC}"
echo ""

# Step 6: Update .env file
echo -e "${BLUE}Step 6: Updating .env file...${NC}"

# Backup existing .env
cp .env .env.backup

# Update .env with Agent IDs
sed -i.tmp "s/^AGENT_ID=.*/AGENT_ID=$AGENT_ID/" .env
sed -i.tmp "s/^AGENT_ALIAS_ID=.*/AGENT_ALIAS_ID=$ALIAS_ID/" .env
rm -f .env.tmp

echo -e "${GREEN}✅ .env file updated${NC}"
echo ""

# Step 7: Grant Lambda permissions
echo -e "${BLUE}Step 7: Granting Lambda permissions...${NC}"

AGENT_ARN="arn:aws:bedrock:$REGION:$ACCOUNT_ID:agent/$AGENT_ID"

# Web Search Lambda
aws lambda add-permission \
  --function-name "farmer-voice-ai-web-search" \
  --statement-id "AllowBedrockAgent-$AGENT_ID" \
  --action "lambda:InvokeFunction" \
  --principal "bedrock.amazonaws.com" \
  --source-arn "$AGENT_ARN" \
  --region "$REGION" 2>/dev/null || echo "Permission already exists for web-search"

# DynamoDB Lambda
aws lambda add-permission \
  --function-name "farmer-voice-ai-dev-dynamoToolLambda" \
  --statement-id "AllowBedrockAgent-$AGENT_ID" \
  --action "lambda:InvokeFunction" \
  --principal "bedrock.amazonaws.com" \
  --source-arn "$AGENT_ARN" \
  --region "$REGION" 2>/dev/null || echo "Permission already exists for dynamo"

# YouTube Lambda
aws lambda add-permission \
  --function-name "farmer-voice-ai-dev-youtubeToolLambda" \
  --statement-id "AllowBedrockAgent-$AGENT_ID" \
  --action "lambda:InvokeFunction" \
  --principal "bedrock.amazonaws.com" \
  --source-arn "$AGENT_ARN" \
  --region "$REGION" 2>/dev/null || echo "Permission already exists for youtube"

echo -e "${GREEN}✅ Lambda permissions granted${NC}"
echo ""

# Summary
echo "==========================================="
echo -e "${GREEN}🎉 Action Groups Added Successfully!${NC}"
echo "==========================================="
echo ""
echo "Agent Details:"
echo "  Agent ID: $AGENT_ID"
echo "  Alias ID: $ALIAS_ID"
echo ""
echo "Action Groups:"
echo "  ✅ web_tools"
echo "  ✅ farmer_database_tools"
echo "  ✅ youtube_tools"
echo ""
echo "Next: npm run deploy"
echo ""
