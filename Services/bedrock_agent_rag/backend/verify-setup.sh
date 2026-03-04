#!/bin/bash

# Verification Script - Check if everything is ready for Bedrock Agent setup

echo "🔍 Verifying Setup for Bedrock Agent"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Check 1: Lambda Functions
echo "1. Checking Lambda Functions..."
REQUIRED_LAMBDAS=(
  "farmer-voice-ai-web-search"
  "farmer-voice-ai-dev-dynamoToolLambda"
  "farmer-voice-ai-dev-youtubeToolLambda"
  "farmer-voice-ai-dev-agentQuery"
)

for lambda in "${REQUIRED_LAMBDAS[@]}"; do
  if aws lambda get-function --function-name "$lambda" --region ap-south-1 &>/dev/null; then
    echo -e "   ${GREEN}✅${NC} $lambda"
  else
    echo -e "   ${RED}❌${NC} $lambda - NOT FOUND"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Check 2: OpenAPI Schema
echo "2. Checking OpenAPI Schema..."
if [ -f "agent-schema-4-tools.json" ]; then
  echo -e "   ${GREEN}✅${NC} agent-schema-4-tools.json exists"
else
  echo -e "   ${RED}❌${NC} agent-schema-4-tools.json NOT FOUND"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 3: Environment File
echo "3. Checking .env file..."
if [ -f ".env" ]; then
  echo -e "   ${GREEN}✅${NC} .env file exists"
  
  # Check if AGENT_ID is set
  if grep -q "^AGENT_ID=.\+" .env; then
    AGENT_ID=$(grep "^AGENT_ID=" .env | cut -d'=' -f2)
    echo -e "   ${GREEN}✅${NC} AGENT_ID is set: $AGENT_ID"
  else
    echo -e "   ${YELLOW}⚠️${NC}  AGENT_ID is empty (will be set after agent creation)"
  fi
  
  # Check if AGENT_ALIAS_ID is set
  if grep -q "^AGENT_ALIAS_ID=.\+" .env; then
    ALIAS_ID=$(grep "^AGENT_ALIAS_ID=" .env | cut -d'=' -f2)
    echo -e "   ${GREEN}✅${NC} AGENT_ALIAS_ID is set: $ALIAS_ID"
  else
    echo -e "   ${YELLOW}⚠️${NC}  AGENT_ALIAS_ID is empty (will be set after agent creation)"
  fi
else
  echo -e "   ${RED}❌${NC} .env file NOT FOUND"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 4: AWS Region
echo "4. Checking AWS Region..."
CURRENT_REGION=$(aws configure get region 2>/dev/null || echo "not-set")
if [ "$CURRENT_REGION" = "ap-south-1" ]; then
  echo -e "   ${GREEN}✅${NC} AWS region is ap-south-1"
else
  echo -e "   ${YELLOW}⚠️${NC}  AWS region is $CURRENT_REGION (should be ap-south-1)"
fi
echo ""

# Check 5: DynamoDB Table
echo "5. Checking DynamoDB Table..."
TABLE_NAME="farmer-voice-ai-dev-sessions"
if aws dynamodb describe-table --table-name "$TABLE_NAME" --region ap-south-1 &>/dev/null; then
  echo -e "   ${GREEN}✅${NC} $TABLE_NAME exists"
else
  echo -e "   ${RED}❌${NC} $TABLE_NAME NOT FOUND"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 6: API Gateway
echo "6. Checking API Gateway..."
API_URL="https://kqndxs5w8c.execute-api.ap-south-1.amazonaws.com/dev"
if curl -s -o /dev/null -w "%{http_code}" "$API_URL/query" -X POST -H "Content-Type: application/json" -d '{}' | grep -q "400\|200"; then
  echo -e "   ${GREEN}✅${NC} API Gateway is accessible"
  echo -e "   ${GREEN}✅${NC} URL: $API_URL"
else
  echo -e "   ${RED}❌${NC} API Gateway not accessible"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo "======================================"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo ""
  echo "You're ready to create the Bedrock Agent!"
  echo ""
  echo "Next steps:"
  echo "1. Open: https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/agents"
  echo "2. Follow: SETUP_BEDROCK_AGENT_NOW.md"
  echo "3. Create agent with 3 action groups"
  echo "4. Copy Agent ID and Alias ID"
  echo "5. Update .env file"
  echo "6. Run: npm run deploy"
else
  echo -e "${RED}❌ Found $ERRORS error(s)${NC}"
  echo ""
  echo "Please fix the errors above before proceeding."
fi
echo ""
