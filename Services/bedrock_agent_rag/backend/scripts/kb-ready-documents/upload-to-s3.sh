#!/bin/bash
# Upload Knowledge Base Documents to S3
# Generated: 2026-03-03 01:10:33

# Configuration
BUCKET_NAME="farmer-voice-ai-dev-documents"
REGION="ap-south-1"
KB_PREFIX="farming-knowledge"

echo "🚀 Uploading knowledge base documents to S3..."

# Upload articles
echo "📄 Uploading articles..."
aws s3 sync ./articles/ s3://${BUCKET_NAME}/${KB_PREFIX}/articles/ \
  --region ${REGION} \
  --content-type "text/plain; charset=utf-8"

# Upload videos metadata
echo "🎥 Uploading video metadata..."
aws s3 sync ./videos/ s3://${BUCKET_NAME}/${KB_PREFIX}/videos/ \
  --region ${REGION} \
  --content-type "text/plain; charset=utf-8"

# Upload schemes
echo "🏛️  Uploading government schemes..."
aws s3 sync ./schemes/ s3://${BUCKET_NAME}/${KB_PREFIX}/schemes/ \
  --region ${REGION} \
  --content-type "text/plain; charset=utf-8"

# Upload index
echo "📚 Uploading index..."
aws s3 cp ./index.json s3://${BUCKET_NAME}/${KB_PREFIX}/index.json \
  --region ${REGION} \
  --content-type "application/json; charset=utf-8"

echo "✅ Upload completed!"
echo "📊 Check S3 bucket: s3://${BUCKET_NAME}/${KB_PREFIX}/"

# Trigger Knowledge Base sync (optional)
# Uncomment and set your KB ID and Data Source ID
# echo "🔄 Triggering Knowledge Base sync..."
# aws bedrock-agent start-ingestion-job \
#   --knowledge-base-id YOUR_KB_ID \
#   --data-source-id YOUR_DS_ID \
#   --region ${REGION}
