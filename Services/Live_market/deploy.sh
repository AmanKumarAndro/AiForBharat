#!/bin/bash

echo "🚀 Deploying Commodity Analyzer to AWS Lambda..."

# Build the SAM application
echo "📦 Building SAM application..."
sam build

# Deploy the application
echo "🌐 Deploying to AWS..."
sam deploy --guided

# Get the API endpoint
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the API Gateway endpoint URL from the outputs above"
echo "2. Update static/js/app.js with your API endpoint"
echo "3. Deploy the frontend to S3:"
echo "   ./deploy-frontend.sh YOUR_BUCKET_NAME YOUR_API_ENDPOINT"
