#!/bin/bash

echo "🚀 Activating Claude 3 Sonnet Model"
echo "===================================="
echo ""
echo "Since AWS now auto-enables models on first use, we need to"
echo "invoke the model once to activate it for your account."
echo ""

REGION="ap-south-1"

echo "Attempting to invoke Claude 3 Sonnet..."
echo ""

# Try to invoke the model directly
aws bedrock-runtime invoke-model \
  --region $REGION \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/bedrock-response.json 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Claude 3 Sonnet activated successfully!"
    echo ""
    cat /tmp/bedrock-response.json | jq '.'
    echo ""
    echo "🎉 Model is now active! You can test the API:"
    echo "   node scripts/test-context.js"
else
    echo ""
    echo "❌ Could not activate via CLI."
    echo ""
    echo "📋 Please activate manually via AWS Console:"
    echo ""
    echo "1. Open: https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/playground"
    echo ""
    echo "2. Select 'Claude 3 Sonnet' from the model dropdown"
    echo ""
    echo "3. Type any message (e.g., 'Hello') and click 'Run'"
    echo ""
    echo "4. This will activate the model for your account"
    echo ""
    echo "5. Come back and run: node scripts/test-context.js"
    echo ""
    echo "Note: You need AWS Marketplace permissions to activate Anthropic models."
    echo "If you don't have these permissions, ask your AWS account administrator."
fi
