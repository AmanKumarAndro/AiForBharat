#!/bin/bash
# Deployment script for Weather Advisory Lambda

# Load environment variables from .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
fi

echo "📦 Packaging Lambda function..."
zip -r function.zip lambda_function.py

echo "✅ Package created: function.zip"
echo ""
echo "Next steps:"
echo "1. Upload function.zip to AWS Lambda"
echo "2. Set environment variables:"
echo "   - OPENWEATHER_API_KEY=<your-key-from-.env>"
echo "   - AWS_REGION=${AWS_REGION:-us-east-1}"
echo "3. Attach IAM role with bedrock:InvokeModel permission"
echo "4. Set timeout to 15 seconds"
echo "5. Add API Gateway trigger"
echo ""
echo "Or use AWS CLI:"
echo "aws lambda create-function \\"
echo "  --function-name weather-advisory \\"
echo "  --runtime python3.11 \\"
echo "  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-bedrock-role \\"
echo "  --handler lambda_function.lambda_handler \\"
echo "  --zip-file fileb://function.zip \\"
echo "  --timeout 15 \\"
echo "  --environment Variables={OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY:-YOUR_OPENWEATHER_API_KEY},AWS_REGION=${AWS_REGION:-us-east-1}}"

