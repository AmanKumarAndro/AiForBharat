#!/bin/bash
# Test All API Endpoints
# Diagnose any 500 errors

API_URL="https://kqndxs5w8c.execute-api.ap-south-1.amazonaws.com/dev"
SESSION_ID="test-$(date +%s)"

echo "🧪 Testing All API Endpoints"
echo "=============================="
echo "API URL: $API_URL"
echo "Session ID: $SESSION_ID"
echo ""

# Test 1: Query endpoint
echo "Test 1: POST /query"
echo "-------------------"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST ${API_URL}/query \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"गेहूं की बुवाई कब करें?\", \"sessionId\": \"${SESSION_ID}\"}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Status: $HTTP_STATUS"
    echo "Response preview:"
    echo "$BODY" | jq -r '.answer' | head -3
    echo "Latency: $(echo "$BODY" | jq -r '.latency')ms"
else
    echo "❌ Status: $HTTP_STATUS"
    echo "Error:"
    echo "$BODY" | jq '.'
fi
echo ""

# Test 2: Synthesize endpoint
echo "Test 2: POST /synthesize"
echo "------------------------"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST ${API_URL}/synthesize \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"नमस्ते किसान भाई\", \"sessionId\": \"${SESSION_ID}\"}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Status: $HTTP_STATUS"
    AUDIO_LENGTH=$(echo "$BODY" | jq -r '.audioBase64' | wc -c)
    echo "Audio generated: ${AUDIO_LENGTH} characters"
else
    echo "❌ Status: $HTTP_STATUS"
    echo "Error:"
    echo "$BODY" | jq '.'
fi
echo ""

# Test 3: History endpoint
echo "Test 3: POST /history"
echo "---------------------"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST ${API_URL}/history \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"${SESSION_ID}\", \"limit\": 5}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Status: $HTTP_STATUS"
    COUNT=$(echo "$BODY" | jq -r '.count')
    echo "History entries: $COUNT"
else
    echo "❌ Status: $HTTP_STATUS"
    echo "Error:"
    echo "$BODY" | jq '.'
fi
echo ""

# Test 4: Agent Query endpoint (may fail if agent not configured)
echo "Test 4: POST /agent-query"
echo "-------------------------"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST ${API_URL}/agent-query \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"PM-KISAN योजना क्या है?\", \"sessionId\": \"${SESSION_ID}\"}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Status: $HTTP_STATUS"
    echo "Response preview:"
    echo "$BODY" | jq -r '.answer_hi' | head -3 2>/dev/null || echo "$BODY" | jq -r '.answer' | head -3
else
    echo "⚠️  Status: $HTTP_STATUS"
    echo "Note: Agent endpoint may not be configured yet"
    echo "Error:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi
echo ""

# Summary
echo "=============================="
echo "📊 Test Summary"
echo "=============================="
echo ""
echo "If you see 500 errors, check:"
echo "1. Lambda function logs:"
echo "   aws logs tail /aws/lambda/farmer-voice-ai-dev-query --since 10m --region ap-south-1"
echo ""
echo "2. Lambda function permissions:"
echo "   - Bedrock access"
echo "   - DynamoDB access"
echo "   - Polly access"
echo ""
echo "3. Environment variables:"
echo "   cat backend/.env"
echo ""
echo "4. Recent deployment:"
echo "   cd backend && serverless deploy"
echo ""
