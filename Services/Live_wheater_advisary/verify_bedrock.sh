#!/bin/bash
# Verify Bedrock access and test the API

echo "🔍 Checking Bedrock model access..."
echo ""

# Try to invoke Bedrock directly
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-haiku-20240307-v1:0 \
  --region ap-south-1 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":50,"messages":[{"role":"user","content":"Say hello"}]}' \
  /tmp/bedrock_test.json 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Bedrock access is enabled!"
  echo ""
  echo "Response:"
  cat /tmp/bedrock_test.json | python3 -m json.tool
  echo ""
  echo "Now testing the Weather API with Bedrock..."
  echo ""
  curl -X POST https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory \
    -H 'Content-Type: application/json' \
    -d '{"lat": 28.4595, "lon": 77.0266, "activity": "spraying"}' 2>/dev/null \
    | python3 -m json.tool
else
  echo "❌ Bedrock access not yet enabled"
  echo ""
  echo "Please enable it at:"
  echo "https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/modelaccess"
fi
