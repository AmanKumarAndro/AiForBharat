#!/bin/bash

echo "=========================================="
echo "🚀 Deploying to us-east-1 (Virginia)"
echo "=========================================="
echo ""

# Check if in backend directory
if [ ! -f "serverless.yml" ]; then
  echo "❌ Error: serverless.yml not found"
  echo "Please run this script from the backend directory"
  exit 1
fi

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
  echo "❌ Error: Serverless Framework not installed"
  echo "Install with: npm install -g serverless"
  exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

echo "🚀 Step 2: Deploying to us-east-1..."
serverless deploy --region us-east-1 --verbose

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed"
  exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""

echo "📊 Step 3: Getting deployment info..."
serverless info --region us-east-1

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Copy the new API URL from above"
echo "2. Update your React Native app with the new URL"
echo "3. Create Bedrock Agent: python scripts/setup-agent-v3.py"
echo "4. Test the endpoints"
echo ""
echo "New region: us-east-1"
echo "Benefits:"
echo "  ✅ Claude 3 Haiku fully supported"
echo "  ✅ All 4 tools will work"
echo "  ✅ Audio bucket created"
echo "  ✅ /voice-query and /transcribe will work"
echo ""
echo "=========================================="
