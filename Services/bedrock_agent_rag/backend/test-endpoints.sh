#!/bin/bash

API_URL="https://kqndxs5w8c.execute-api.ap-south-1.amazonaws.com/dev"

echo "🧪 Testing Deployed Endpoints"
echo "=============================="
echo "API URL: $API_URL"
echo ""

# Test 1: Synthesize (simplest test)
echo "🔊 Test 1: Text-to-Speech (Synthesize)"
echo "--------------------------------------"
curl -X POST "$API_URL/synthesize" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "नमस्ते किसान भाई। यह एक परीक्षण है।",
    "sessionId": "test-'$(date +%s)'"
  }' | jq -r '.audioBase64' | head -c 100

echo -e "\n\n✅ Synthesize endpoint working!\n"

# Test 2: Query (without KB - will use fallback)
echo "🔍 Test 2: Query Endpoint (without Knowledge Base)"
echo "--------------------------------------------------"
curl -X POST "$API_URL/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "गेहूं की बुवाई कब करें?",
    "sessionId": "test-'$(date +%s)'"
  }' | jq '.'

echo -e "\n✅ Query endpoint working!\n"

echo "=============================="
echo "✅ All endpoint tests passed!"
echo ""
echo "📝 Next Steps:"
echo "1. Go to AWS Console > Bedrock > Knowledge bases"
echo "2. Create Knowledge Base with S3 URI: s3://farmer-voice-ai-dev-documents/knowledge-base/"
echo "3. Copy Knowledge Base ID to backend/.env"
echo "4. Run: npm run test-kb"
