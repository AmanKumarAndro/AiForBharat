#!/bin/bash
# Setup Bedrock Knowledge Base with Scraped Data
# Step 3: Create Knowledge Base and Data Source

set -e

REGION="ap-south-1"
BUCKET_NAME="farmer-voice-ai-dev-documents"
KB_PREFIX="farming-knowledge"
KB_NAME="farmer-voice-ai-knowledge-base"

echo "🚀 Setting up Bedrock Knowledge Base"
echo "======================================"
echo ""

# Step 1: Check if Knowledge Base already exists
echo "Step 1: Checking for existing Knowledge Base..."
KB_ID=$(aws bedrock-agent list-knowledge-bases \
  --region ${REGION} \
  --query "knowledgeBaseSummaries[?name=='${KB_NAME}'].knowledgeBaseId" \
  --output text 2>/dev/null || echo "")

if [ -n "$KB_ID" ]; then
    echo "✅ Knowledge Base already exists: ${KB_ID}"
    echo ""
else
    echo "⚠️  No Knowledge Base found. You need to create one."
    echo ""
    echo "📋 To create a Knowledge Base:"
    echo ""
    echo "1. Go to AWS Console → Amazon Bedrock → Knowledge bases"
    echo "   https://console.aws.amazon.com/bedrock/home?region=${REGION}#/knowledge-bases"
    echo ""
    echo "2. Click 'Create knowledge base'"
    echo ""
    echo "3. Configure:"
    echo "   Name: ${KB_NAME}"
    echo "   Description: Farming knowledge in Hindi"
    echo "   IAM Role: Create new role"
    echo ""
    echo "4. Data source:"
    echo "   Type: Amazon S3"
    echo "   S3 URI: s3://${BUCKET_NAME}/${KB_PREFIX}/"
    echo "   Chunking: Default (300 tokens, 20% overlap)"
    echo ""
    echo "5. Embeddings model:"
    echo "   Model: Titan Embeddings G1 - Text"
    echo "   Dimensions: 1536"
    echo ""
    echo "6. Vector database:"
    echo "   Type: Quick create (OpenSearch Serverless)"
    echo ""
    echo "7. Click 'Create'"
    echo ""
    echo "8. After creation, copy the Knowledge Base ID and run:"
    echo "   echo 'KNOWLEDGE_BASE_ID=your-kb-id' >> ../../.env"
    echo ""
    exit 0
fi

# Step 2: Get Data Source ID
echo "Step 2: Getting Data Source ID..."
DS_ID=$(aws bedrock-agent list-data-sources \
  --knowledge-base-id ${KB_ID} \
  --region ${REGION} \
  --query "dataSourceSummaries[0].dataSourceId" \
  --output text 2>/dev/null || echo "")

if [ -z "$DS_ID" ]; then
    echo "❌ No data source found for Knowledge Base"
    echo "Please create a data source in AWS Console"
    exit 1
fi

echo "✅ Data Source ID: ${DS_ID}"
echo ""

# Step 3: Trigger ingestion
echo "Step 3: Triggering Knowledge Base ingestion..."
echo "This will index all the uploaded documents..."
echo ""

INGESTION_JOB=$(aws bedrock-agent start-ingestion-job \
  --knowledge-base-id ${KB_ID} \
  --data-source-id ${DS_ID} \
  --region ${REGION} \
  --output json)

JOB_ID=$(echo $INGESTION_JOB | jq -r '.ingestionJob.ingestionJobId')

echo "✅ Ingestion job started: ${JOB_ID}"
echo ""

# Step 4: Monitor ingestion status
echo "Step 4: Monitoring ingestion status..."
echo "This may take 2-5 minutes..."
echo ""

for i in {1..30}; do
    STATUS=$(aws bedrock-agent get-ingestion-job \
      --knowledge-base-id ${KB_ID} \
      --data-source-id ${DS_ID} \
      --ingestion-job-id ${JOB_ID} \
      --region ${REGION} \
      --query 'ingestionJob.status' \
      --output text)
    
    echo "[$i/30] Status: ${STATUS}"
    
    if [ "$STATUS" = "COMPLETE" ]; then
        echo ""
        echo "✅ Ingestion completed successfully!"
        echo ""
        
        # Get statistics
        STATS=$(aws bedrock-agent get-ingestion-job \
          --knowledge-base-id ${KB_ID} \
          --data-source-id ${DS_ID} \
          --ingestion-job-id ${JOB_ID} \
          --region ${REGION} \
          --query 'ingestionJob.statistics' \
          --output json)
        
        echo "📊 Ingestion Statistics:"
        echo "$STATS" | jq '.'
        echo ""
        
        # Update .env file
        if ! grep -q "KNOWLEDGE_BASE_ID=" ../../.env; then
            echo "KNOWLEDGE_BASE_ID=${KB_ID}" >> ../../.env
            echo "✅ Updated .env with KNOWLEDGE_BASE_ID"
        fi
        
        echo ""
        echo "🎉 Knowledge Base is ready!"
        echo ""
        echo "📋 Details:"
        echo "   Knowledge Base ID: ${KB_ID}"
        echo "   Data Source ID: ${DS_ID}"
        echo "   S3 Location: s3://${BUCKET_NAME}/${KB_PREFIX}/"
        echo "   Documents: 11 files"
        echo ""
        echo "🧪 Test it:"
        echo "   aws bedrock-agent-runtime retrieve \\"
        echo "     --knowledge-base-id ${KB_ID} \\"
        echo "     --retrieval-query text='PM-KISAN योजना क्या है?' \\"
        echo "     --region ${REGION}"
        echo ""
        exit 0
    elif [ "$STATUS" = "FAILED" ]; then
        echo ""
        echo "❌ Ingestion failed!"
        echo ""
        aws bedrock-agent get-ingestion-job \
          --knowledge-base-id ${KB_ID} \
          --data-source-id ${DS_ID} \
          --ingestion-job-id ${JOB_ID} \
          --region ${REGION} \
          --query 'ingestionJob.failureReasons' \
          --output json | jq '.'
        exit 1
    fi
    
    sleep 10
done

echo ""
echo "⏱️  Ingestion is still in progress..."
echo "Check status in AWS Console:"
echo "https://console.aws.amazon.com/bedrock/home?region=${REGION}#/knowledge-bases/${KB_ID}"
