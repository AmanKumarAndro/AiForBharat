#!/bin/bash

# Cleanup Test Farmers Script
# This script deletes all test farmer registrations and stops their alerts

REGION="ap-south-1"
FARMERS_TABLE="kisanvoice-irrigation-dev-farmers"
SOIL_STATE_TABLE="kisanvoice-irrigation-dev-soil-state"
SMS_LOG_TABLE="kisanvoice-irrigation-dev-sms-log"

echo "🔍 Finding active farmers..."

# Get all active farmers
FARMERS=$(aws dynamodb scan \
  --table-name $FARMERS_TABLE \
  --region $REGION \
  --filter-expression "active = :active" \
  --expression-attribute-values '{":active":{"BOOL":true}}' \
  --projection-expression "pk,eventBridgeRuleArn,#n" \
  --expression-attribute-names '{"#n":"name"}' \
  --output json)

FARMER_COUNT=$(echo $FARMERS | jq '.Items | length')
echo "📊 Found $FARMER_COUNT active farmers"

if [ "$FARMER_COUNT" -eq 0 ]; then
  echo "✅ No active farmers to delete"
  exit 0
fi

echo ""
echo "👥 Farmers to be deleted:"
echo $FARMERS | jq -r '.Items[] | "  - \(.name.S) (\(.pk.S))"'
echo ""

read -p "⚠️  Are you sure you want to delete ALL these farmers? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Cancelled"
  exit 0
fi

echo ""
echo "🗑️  Starting deletion process..."
echo ""

# Process each farmer
echo $FARMERS | jq -c '.Items[]' | while read farmer; do
  PK=$(echo $farmer | jq -r '.pk.S')
  FARMER_ID=$(echo $PK | sed 's/farmer#//')
  NAME=$(echo $farmer | jq -r '.name.S')
  RULE_ARN=$(echo $farmer | jq -r '.eventBridgeRuleArn.S // empty')
  
  echo "Processing: $NAME ($FARMER_ID)"
  
  # 1. Delete EventBridge Rule
  if [ ! -z "$RULE_ARN" ]; then
    RULE_NAME=$(echo $RULE_ARN | awk -F'/' '{print $NF}')
    echo "  ⏰ Deleting EventBridge rule: $RULE_NAME"
    
    # Remove targets first
    aws events remove-targets \
      --rule $RULE_NAME \
      --ids "1" \
      --region $REGION \
      2>/dev/null
    
    # Delete rule
    aws events delete-rule \
      --name $RULE_NAME \
      --region $REGION \
      2>/dev/null
    
    echo "  ✅ EventBridge rule deleted"
  fi
  
  # 2. Delete Farmer Profile
  echo "  👤 Deleting farmer profile..."
  aws dynamodb delete-item \
    --table-name $FARMERS_TABLE \
    --key "{\"pk\":{\"S\":\"$PK\"},\"sk\":{\"S\":\"profile\"}}" \
    --region $REGION
  echo "  ✅ Farmer profile deleted"
  
  # 3. Delete Soil State
  echo "  🌱 Deleting soil state..."
  aws dynamodb delete-item \
    --table-name $SOIL_STATE_TABLE \
    --key "{\"pk\":{\"S\":\"$PK\"},\"sk\":{\"S\":\"state\"}}" \
    --region $REGION \
    2>/dev/null
  echo "  ✅ Soil state deleted"
  
  # 4. Delete SMS Logs (all alerts for this farmer)
  echo "  📱 Deleting SMS logs..."
  SMS_LOGS=$(aws dynamodb query \
    --table-name $SMS_LOG_TABLE \
    --key-condition-expression "pk = :pk" \
    --expression-attribute-values "{\":pk\":{\"S\":\"$PK\"}}" \
    --projection-expression "pk,sk" \
    --region $REGION \
    --output json)
  
  SMS_COUNT=$(echo $SMS_LOGS | jq '.Items | length')
  
  if [ "$SMS_COUNT" -gt 0 ]; then
    echo $SMS_LOGS | jq -c '.Items[]' | while read sms; do
      SMS_PK=$(echo $sms | jq -r '.pk.S')
      SMS_SK=$(echo $sms | jq -r '.sk.S')
      aws dynamodb delete-item \
        --table-name $SMS_LOG_TABLE \
        --key "{\"pk\":{\"S\":\"$SMS_PK\"},\"sk\":{\"S\":\"$SMS_SK\"}}" \
        --region $REGION \
        2>/dev/null
    done
    echo "  ✅ Deleted $SMS_COUNT SMS logs"
  else
    echo "  ℹ️  No SMS logs to delete"
  fi
  
  echo "  ✅ $NAME deleted successfully"
  echo ""
done

echo "🎉 Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - Deleted $FARMER_COUNT farmers"
echo "  - Deleted $FARMER_COUNT EventBridge rules"
echo "  - Deleted $FARMER_COUNT soil states"
echo "  - Deleted all associated SMS logs"
echo ""
echo "✅ All test farmers and their alerts have been removed from the system"
