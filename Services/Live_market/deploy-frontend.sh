#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./deploy-frontend.sh BUCKET_NAME API_ENDPOINT"
    echo "Example: ./deploy-frontend.sh my-bucket https://abc123.execute-api.us-east-1.amazonaws.com/Prod"
    exit 1
fi

BUCKET_NAME=$1
API_ENDPOINT=$2

echo "🌐 Deploying frontend to S3..."

# Update the API endpoint in the JavaScript file
echo "📝 Updating API endpoint..."
sed -i.bak "s|const API_ENDPOINT = window.API_ENDPOINT.*|const API_ENDPOINT = window.API_ENDPOINT || '$API_ENDPOINT';|" static/js/app.js

# Sync files to S3
echo "📤 Uploading files to S3..."
aws s3 sync templates/ s3://$BUCKET_NAME/ --exclude "*" --include "*.html"
aws s3 sync static/ s3://$BUCKET_NAME/static/

# Set content types
aws s3 cp s3://$BUCKET_NAME/static/css/style.css s3://$BUCKET_NAME/static/css/style.css --content-type "text/css" --metadata-directive REPLACE
aws s3 cp s3://$BUCKET_NAME/static/js/app.js s3://$BUCKET_NAME/static/js/app.js --content-type "application/javascript" --metadata-directive REPLACE

# Restore backup
mv static/js/app.js.bak static/js/app.js

echo ""
echo "✅ Frontend deployed successfully!"
echo "🌍 Website URL: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
