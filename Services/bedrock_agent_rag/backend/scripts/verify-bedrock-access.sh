#!/bin/bash

REGION="ap-south-1"

echo "🔍 Verifying Bedrock Model Access"
echo "=================================="
echo ""

# Check if AWS CLI is configured
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

echo "Checking Bedrock access in region: $REGION"
echo ""

# List foundation models
echo "📋 Available Foundation Models:"
aws bedrock list-foundation-models --region $REGION \
    --query "modelSummaries[?contains(modelId, 'claude') || contains(modelId, 'titan')].{Model:modelId,Provider:providerName,Status:modelLifecycle.status}" \
    --output table 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Bedrock API is accessible!"
    echo ""
    
    # Check specific models
    echo "Checking required models:"
    echo ""
    
    CLAUDE=$(aws bedrock list-foundation-models --region $REGION \
        --query "modelSummaries[?modelId=='anthropic.claude-3-sonnet-20240229-v1:0'].modelId" \
        --output text 2>/dev/null)
    
    TITAN_EMBED=$(aws bedrock list-foundation-models --region $REGION \
        --query "modelSummaries[?modelId=='amazon.titan-embed-text-v1'].modelId" \
        --output text 2>/dev/null)
    
    if [ -n "$CLAUDE" ]; then
        echo "✅ Claude 3 Sonnet: ENABLED"
    else
        echo "❌ Claude 3 Sonnet: NOT ENABLED"
    fi
    
    if [ -n "$TITAN_EMBED" ]; then
        echo "✅ Titan Embeddings: ENABLED"
    else
        echo "❌ Titan Embeddings: NOT ENABLED"
    fi
    
    echo ""
    
    if [ -n "$CLAUDE" ] && [ -n "$TITAN_EMBED" ]; then
        echo "🎉 All required models are enabled!"
        echo ""
        echo "You can now:"
        echo "  1. Create Knowledge Base"
        echo "  2. Test the API: node scripts/test-context.js"
    else
        echo "⚠️  Some models are not enabled yet."
        echo ""
        echo "Please enable them at:"
        echo "https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/modelaccess"
    fi
else
    echo ""
    echo "❌ Cannot access Bedrock API"
    echo ""
    echo "Possible reasons:"
    echo "  1. Models not enabled in AWS Console"
    echo "  2. IAM permissions missing"
    echo "  3. Region not supported"
    echo ""
    echo "Please visit:"
    echo "https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/modelaccess"
fi
