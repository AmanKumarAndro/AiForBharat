#!/bin/bash

# Fix agent by adding instructions back

# Load environment variables from .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../../.env" ]; then
    source "$SCRIPT_DIR/../../.env"
fi

AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-"YOUR_AWS_ACCOUNT_ID"}
AGENT_ID=${BEDROCK_AGENT_ID:-"UZ4BBKGOJB"}
REGION=${AWS_REGION:-"ap-south-1"}

AGENT_INSTRUCTION='You are an agricultural advisor for Indian farmers speaking in Hindi.

You have three tools available:

1. web_search - Use for current information about government schemes, mandi prices, weather
2. query_farmer_database - Use for historical farmer data and regional information
3. search_youtube_videos - Use when farmer asks for videos or visual demonstrations

IMPORTANT RULES:
- Always respond in Hindi with numbered steps
- Choose the most appropriate tool based on the question
- For video requests, use search_youtube_videos
- For current/live data, use web_search
- For historical/regional data, use query_farmer_database
- Provide clear, actionable advice'

aws bedrock-agent update-agent \
  --agent-id $AGENT_ID \
  --agent-name farmer-voice-ai-agent \
  --foundation-model "meta.llama3-8b-instruct-v1:0" \
  --instruction "$AGENT_INSTRUCTION" \
  --agent-resource-role-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:role/AmazonBedrockExecutionRoleForAgents_farmer_ai" \
  --region $REGION

echo ""
echo "Preparing agent..."
aws bedrock-agent prepare-agent --agent-id $AGENT_ID --region $REGION

echo ""
echo "Waiting 30 seconds..."
sleep 30

echo ""
echo "Agent fixed!"

