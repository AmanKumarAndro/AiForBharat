# Deployment Summary

## Scripts Organization

All scripts have been organized into a structured directory:

```
scripts/
├── deploy/                      # Deployment scripts
│   ├── deploy_all.sh           # Complete deployment
│   └── deploy_list_endpoints.sh # List endpoints deployment
├── setup/                       # Setup scripts
│   ├── setup_api_gateway.sh
│   ├── setup_twilio_sms.sh
│   └── setup_twilio.sh
├── test/                        # Test scripts
│   ├── test_complete_flow.sh
│   ├── test_complete_with_sms.sh
│   ├── test_sms_reply_workaround.sh
│   ├── test_api.sh
│   ├── test_direct.sh
│   ├── test_sms_notifications.sh
│   ├── test_twilio_sms.sh
│   ├── test_twilio_whatsapp.sh
│   ├── send_test_sms.py
│   ├── verify_twilio_numbers.py
│   ├── test_payload.json
│   └── response.json
└── README.md                    # Scripts documentation
```

**Total**: 18 files organized

---

## Deployment Script

### deploy_all.sh

**Purpose**: Complete automated deployment of all components

**Features**:
- ✅ Packages all 11 Lambda functions
- ✅ Deploys/updates Lambda functions
- ✅ Configures environment variables (Twilio)
- ✅ Deploys API Gateway
- ✅ Adds Lambda permissions
- ✅ Colored output for easy reading
- ✅ Error handling and validation

**Usage**:
```bash
bash scripts/deploy/deploy_all.sh
```

**What It Deploys**:

1. **Lambda Functions** (11 total):
   - HH_CreateRequest
   - HH_MatchProviders (with Twilio layer)
   - HH_AcceptRequest (with Twilio layer)
   - HH_CompleteAndRate
   - HH_GetStatus
   - HH_RegisterProvider
   - HH_GetProvidersMap
   - HH_GetFarmerRequests
   - HH_GetProviderJobs
   - HH_HandleSMSReply (with Twilio layer)
   - HH_TestSMSAccept (with Twilio layer)

2. **API Gateway**:
   - Deploys to prod stage
   - All 10 endpoints configured

3. **Environment Variables**:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_PHONE_NUMBER

4. **Permissions**:
   - API Gateway → Lambda permissions
   - All endpoints authorized

---

## Quick Start

### 1. Initial Setup

```bash
# Configure AWS CLI (if not done)
aws configure

# Set Twilio credentials (optional, has defaults)
export TWILIO_ACCOUNT_SID=your_sid
export TWILIO_AUTH_TOKEN=your_token
export TWILIO_PHONE_NUMBER=your_number
```

### 2. Deploy Everything

```bash
# Run deployment script
bash scripts/deploy/deploy_all.sh
```

**Expected Output**:
```
==========================================
Helping Hand - Complete Deployment
==========================================

Region: ap-south-1
Account: YOUR_AWS_ACCOUNT_ID
API ID: nhl6zxlp70
Stage: prod

✓ AWS CLI configured
✓ jq installed

==========================================
Step 1: Package Lambda Functions
==========================================

✓ create_request packaged
✓ match_providers packaged
...

==========================================
Step 2: Deploy Lambda Functions
==========================================

✓ HH_CreateRequest updated
✓ HH_MatchProviders updated
...

==========================================
Step 3: Configure Environment Variables
==========================================

✓ HH_MatchProviders environment variables set
...

==========================================
Step 4: Deploy API Gateway
==========================================

✓ API deployed: abc123

==========================================
Step 5: Add Lambda Permissions
==========================================

✓ HH_RegisterProvider permission added
...

==========================================
Deployment Summary
==========================================

API Base URL:
  https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod

Endpoints:
  POST   .../provider
  POST   .../request
  GET    .../status/{id}
  POST   .../accept
  POST   .../test-accept
  POST   .../complete
  GET    .../providers-map
  GET    .../farmer-requests/{farmer_id}
  GET    .../provider-jobs/{provider_id}
  POST   .../sms-reply

Lambda Functions:
  ✓ HH_CreateRequest
  ✓ HH_MatchProviders
  ...

✓ Deployment completed successfully!

Next Steps:
  1. Test endpoints using: ./scripts/test/test_complete_flow.sh
  2. Configure Twilio webhook for SMS replies
  3. Seed test data: python infrastructure/seed_data.py
```

### 3. Seed Test Data

```bash
python infrastructure/seed_data.py
```

### 4. Test Deployment

```bash
# Test complete flow
bash scripts/test/test_complete_flow.sh

# Test SMS flow
bash scripts/test/test_sms_reply_workaround.sh
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] AWS CLI configured
- [ ] jq installed
- [ ] Correct AWS region (ap-south-1)
- [ ] IAM role exists (HelpingHandLambdaRole)
- [ ] Twilio credentials available
- [ ] Git changes committed

### During Deployment

- [ ] Run deploy_all.sh
- [ ] Monitor output for errors
- [ ] Verify all steps complete
- [ ] Check deployment ID

### Post-Deployment

- [ ] Seed test data
- [ ] Run test scripts
- [ ] Verify API endpoints
- [ ] Test SMS notifications
- [ ] Check CloudWatch logs
- [ ] Monitor for 24 hours

---

## Verification

### Check Lambda Functions

```bash
aws lambda list-functions --region ap-south-1 | grep HH_
```

**Expected**: 11 functions listed

### Check API Gateway

```bash
aws apigateway get-rest-apis --region ap-south-1
```

**Expected**: API ID nhl6zxlp70 listed

### Test API Endpoint

```bash
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/providers-map"
```

**Expected**: JSON response with providers

### Check CloudWatch Logs

```bash
aws logs tail /aws/lambda/HH_CreateRequest --since 5m --region ap-south-1
```

**Expected**: Recent log entries

---

## Rollback

If deployment fails or issues occur:

### 1. Rollback Lambda

```bash
# List versions
aws lambda list-versions-by-function \
  --function-name HH_CreateRequest \
  --region ap-south-1

# Rollback to previous version
aws lambda update-alias \
  --function-name HH_CreateRequest \
  --name prod \
  --function-version <previous-version> \
  --region ap-south-1
```

### 2. Rollback API Gateway

```bash
# List deployments
aws apigateway get-deployments \
  --rest-api-id nhl6zxlp70 \
  --region ap-south-1

# Rollback to previous deployment
aws apigateway create-deployment \
  --rest-api-id nhl6zxlp70 \
  --stage-name prod \
  --description "Rollback" \
  --region ap-south-1
```

---

## Troubleshooting

### Deployment Fails

**Error**: AWS CLI not configured
```bash
aws configure
```

**Error**: Missing jq
```bash
# macOS
brew install jq

# Ubuntu
sudo apt-get install jq
```

**Error**: Permission denied
```bash
chmod +x scripts/deploy/deploy_all.sh
```

**Error**: Lambda role not found
```bash
# Create IAM role
aws iam create-role \
  --role-name HelpingHandLambdaRole \
  --assume-role-policy-document file://infrastructure/iam_policy.json
```

### Tests Fail

**Error**: API not responding
```bash
# Check API Gateway
aws apigateway get-rest-apis --region ap-south-1

# Redeploy
bash scripts/deploy/deploy_all.sh
```

**Error**: Lambda timeout
```bash
# Increase timeout
aws lambda update-function-configuration \
  --function-name HH_CreateRequest \
  --timeout 60 \
  --region ap-south-1
```

---

## Monitoring

### CloudWatch Metrics

```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=HH_CreateRequest \
  --start-time 2026-03-04T00:00:00Z \
  --end-time 2026-03-04T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region ap-south-1
```

### CloudWatch Logs

```bash
# Tail logs
aws logs tail /aws/lambda/HH_CreateRequest --follow --region ap-south-1

# Search logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/HH_CreateRequest \
  --filter-pattern "ERROR" \
  --region ap-south-1
```

---

## Cost Estimation

### Per Deployment

- Lambda updates: Free (within free tier)
- API Gateway deployment: Free
- CloudWatch logs: ~$0.01

### Monthly (1,000 requests)

- Lambda: $0.20
- API Gateway: $3.50
- DynamoDB: $1.25
- CloudWatch: $0.50
- Twilio SMS: $22.50
- **Total**: ~$28/month

---

## Next Steps

1. **Configure Twilio Webhook**:
   - Go to Twilio Console
   - Set webhook URL: https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/sms-reply

2. **Set Up Monitoring**:
   - Create CloudWatch alarms
   - Set up error notifications
   - Configure dashboards

3. **Add Authentication**:
   - Implement JWT tokens
   - Add API keys
   - Configure Cognito

4. **Enable CORS**:
   - Configure allowed origins
   - Set appropriate headers

5. **Production Hardening**:
   - Add rate limiting
   - Enable WAF
   - Set up backups
   - Configure auto-scaling

---

## Summary

✅ **Scripts Organized**: 18 files in structured folders  
✅ **Deployment Script**: Complete automated deployment  
✅ **Documentation**: Comprehensive scripts README  
✅ **Testing**: Multiple test scripts available  
✅ **Ready to Deploy**: All scripts executable and tested  

**Status**: Ready for deployment ✅

---

**Last Updated**: March 4, 2026  
**Version**: 1.0
