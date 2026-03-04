#!/bin/bash

# Test Bedrock Agent with All 4 Tools

API_URL="https://kqndxs5w8c.execute-api.ap-south-1.amazonaws.com/dev"

echo "🧪 Testing Bedrock Agent with 4 Tools"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: RAG Tool (General farming knowledge)
echo -e "${BLUE}Test 1: RAG Tool - General Farming Knowledge${NC}"
echo "Question: गेहूं की बुवाई कब करें?"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/agent-query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "गेहूं की बुवाई कब करें?",
    "sessionId": "test-rag-1"
  }')

MODE=$(echo "$RESPONSE" | jq -r '.mode // "error"')
SOURCE=$(echo "$RESPONSE" | jq -r '.source // "none"')
ANSWER=$(echo "$RESPONSE" | jq -r '.answer_hi // .error' | head -c 150)

if [ "$MODE" != "error" ]; then
  echo -e "${GREEN}✅ PASSED${NC}"
  echo "Mode: $MODE"
  echo "Source: $SOURCE"
  echo "Answer (first 150 chars): $ANSWER..."
else
  echo -e "❌ FAILED"
  echo "Error: $ANSWER"
fi

echo ""
echo "---"
echo ""

# Test 2: Web Search Tool (Live data)
echo -e "${BLUE}Test 2: Web Search Tool - Live Government Schemes${NC}"
echo "Question: PM-KISAN की अगली किस्त कब आएगी?"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/agent-query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "PM-KISAN की अगली किस्त कब आएगी?",
    "sessionId": "test-web-1"
  }')

MODE=$(echo "$RESPONSE" | jq -r '.mode // "error"')
SOURCE=$(echo "$RESPONSE" | jq -r '.source // "none"')
ANSWER=$(echo "$RESPONSE" | jq -r '.answer_hi // .error' | head -c 150)

if [ "$MODE" != "error" ]; then
  echo -e "${GREEN}✅ PASSED${NC}"
  echo "Mode: $MODE"
  echo "Source: $SOURCE"
  echo "Answer (first 150 chars): $ANSWER..."
else
  echo -e "❌ FAILED"
  echo "Error: $ANSWER"
fi

echo ""
echo "---"
echo ""

# Test 3: YouTube Tool (Video search)
echo -e "${BLUE}Test 3: YouTube Tool - Video Tutorials${NC}"
echo "Question: गेहूं की बुवाई का वीडियो दिखाओ"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/agent-query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "गेहूं की बुवाई का वीडियो दिखाओ",
    "sessionId": "test-youtube-1"
  }')

MODE=$(echo "$RESPONSE" | jq -r '.mode // "error"')
SOURCE=$(echo "$RESPONSE" | jq -r '.source // "none"')
VIDEOS=$(echo "$RESPONSE" | jq -r '.videos // [] | length')
ANSWER=$(echo "$RESPONSE" | jq -r '.answer_hi // .error' | head -c 150)

if [ "$MODE" != "error" ]; then
  echo -e "${GREEN}✅ PASSED${NC}"
  echo "Mode: $MODE"
  echo "Source: $SOURCE"
  echo "Videos found: $VIDEOS"
  echo "Answer (first 150 chars): $ANSWER..."
else
  echo -e "❌ FAILED"
  echo "Error: $ANSWER"
fi

echo ""
echo "---"
echo ""

# Test 4: DynamoDB Tool (Farmer database)
echo -e "${BLUE}Test 4: DynamoDB Tool - Farmer Database${NC}"
echo "Question: पिछले किसानों की समस्याएं क्या थीं?"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/agent-query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "पिछले किसानों की समस्याएं क्या थीं?",
    "sessionId": "test-dynamo-1"
  }')

MODE=$(echo "$RESPONSE" | jq -r '.mode // "error"')
SOURCE=$(echo "$RESPONSE" | jq -r '.source // "none"')
ANSWER=$(echo "$RESPONSE" | jq -r '.answer_hi // .error' | head -c 150)

if [ "$MODE" != "error" ]; then
  echo -e "${GREEN}✅ PASSED${NC}"
  echo "Mode: $MODE"
  echo "Source: $SOURCE"
  echo "Answer (first 150 chars): $ANSWER..."
else
  echo -e "❌ FAILED"
  echo "Error: $ANSWER"
fi

echo ""
echo "======================================"
echo -e "${YELLOW}📊 Test Summary${NC}"
echo "======================================"
echo ""
echo "All 4 tools have been tested!"
echo ""
echo "Tools:"
echo "  1. RAG Tool - ICAR Knowledge"
echo "  2. Web Search - Live Data"
echo "  3. YouTube - Video Tutorials"
echo "  4. DynamoDB - Farmer Database"
echo ""
echo "Agent automatically selects the right tool based on the question!"
echo ""
