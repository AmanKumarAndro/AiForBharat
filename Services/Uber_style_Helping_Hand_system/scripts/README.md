# Scripts Directory

This directory contains all deployment, setup, and test scripts for the Helping Hand platform.

## Directory Structure

```
scripts/
├── deploy/          # Deployment scripts
├── setup/           # Setup and configuration scripts
├── test/            # Test scripts
└── README.md        # This file
```

---

## Deploy Scripts

### deploy_all.sh

**Purpose**: Complete deployment of all Lambda functions and API Gateway

**Usage**:
```bash
./scripts/deploy/deploy_all.sh
```

**What It Does**:
1. Packages all Lambda functions
2. Deploys/updates Lambda functions
3. Configures environment variables
4. Deploys API Gateway
5. Adds Lambda permissions

**Prerequisites**:
- AWS CLI configured
- jq installed
- Correct IAM permissions

**Environment Variables** (optional):
```bash
export TWILIO_ACCOUNT_SID=your_sid
export TWILIO_AUTH_TOKEN=your_token
export TWILIO_PHONE_NUMBER=your_number
```

---

### deploy_list_endpoints.sh

**Purpose**: Deploy farmer requests and provider jobs list endpoints

**Usage**:
```bash
./scripts/deploy/deploy_list_endpoints.sh
```

**What It Does**:
1. Creates API Gateway resources
2. Configures Lambda integrations
3. Adds permissions
4. Deploys to prod stage

---

## Setup Scripts

### setup_api_gateway.sh

**Purpose**: Initial API Gateway setup

**Usage**:
```bash
./scripts/setup/setup_api_gateway.sh
```

**What It Does**:
- Creates REST API
- Configures resources and methods
- Sets up integrations

---

### setup_twilio.sh

**Purpose**: Setup Twilio WhatsApp integration (legacy)

**Usage**:
```bash
./scripts/setup/setup_twilio.sh
```

**Note**: WhatsApp integration not currently used

---

### setup_twilio_sms.sh

**Purpose**: Setup Twilio SMS integration

**Usage**:
```bash
./scripts/setup/setup_twilio_sms.sh
```

**What It Does**:
- Creates Twilio Lambda layer
- Configures SMS Lambda functions
- Sets environment variables

---

## Test Scripts

### Test Flow Scripts

#### test_complete_flow.sh

**Purpose**: Test complete request flow without SMS

**Usage**:
```bash
./scripts/test/test_complete_flow.sh
```

**Flow**:
1. Create request
2. Check status
3. Accept request (app)
4. Complete and rate

---

#### test_complete_with_sms.sh

**Purpose**: Test complete flow with SMS notifications

**Usage**:
```bash
./scripts/test/test_complete_with_sms.sh
```

**Flow**:
1. Create request
2. SMS sent to providers
3. Accept via test endpoint
4. Complete and rate

---

#### test_sms_reply_workaround.sh

**Purpose**: Test SMS reply acceptance with workaround

**Usage**:
```bash
./scripts/test/test_sms_reply_workaround.sh
```

**Flow**:
1. Create TRANSPORT request
2. Wait for SMS notifications
3. Simulate SMS reply via test endpoint
4. Verify confirmations

**Use Case**: Testing when iOS cannot send SMS to Twilio trial number

---

### Individual Test Scripts

#### test_api.sh

**Purpose**: Basic API endpoint testing

**Usage**:
```bash
./scripts/test/test_api.sh
```

**Tests**:
- Provider registration
- Request creation
- Status check

---

#### test_direct.sh

**Purpose**: Direct Lambda invocation testing

**Usage**:
```bash
./scripts/test/test_direct.sh
```

**Tests**: Lambda functions directly (bypasses API Gateway)

---

#### test_sms_notifications.sh

**Purpose**: Test SMS notification system

**Usage**:
```bash
./scripts/test/test_sms_notifications.sh
```

**Tests**: SMS delivery to providers

---

#### test_twilio_sms.sh

**Purpose**: Test Twilio SMS integration

**Usage**:
```bash
./scripts/test/test_twilio_sms.sh
```

**Tests**: Twilio SMS sending

---

#### test_twilio_whatsapp.sh

**Purpose**: Test Twilio WhatsApp integration (legacy)

**Usage**:
```bash
./scripts/test/test_twilio_whatsapp.sh
```

**Note**: WhatsApp not currently used

---

### Utility Scripts

#### send_test_sms.py

**Purpose**: Send test SMS via Twilio

**Usage**:
```bash
python scripts/test/send_test_sms.py
```

**Requirements**:
- Python 3.x
- twilio package
- Environment variables set

---

#### verify_twilio_numbers.py

**Purpose**: Verify Twilio phone numbers

**Usage**:
```bash
python scripts/test/verify_twilio_numbers.py
```

**What It Does**:
- Lists verified numbers
- Checks number capabilities
- Validates configuration

---

#### test_payload.json

**Purpose**: Sample test payload for API testing

**Usage**:
```bash
curl -X POST $API_URL/request \
  -H 'Content-Type: application/json' \
  -d @scripts/test/test_payload.json
```

---

## Quick Start

### 1. Initial Deployment

```bash
# Deploy everything
./scripts/deploy/deploy_all.sh

# Seed test data
python infrastructure/seed_data.py
```

### 2. Test Deployment

```bash
# Test complete flow
./scripts/test/test_complete_flow.sh

# Test SMS flow
./scripts/test/test_sms_reply_workaround.sh
```

### 3. Verify

```bash
# Check Lambda functions
aws lambda list-functions --region ap-south-1 | grep HH_

# Check API Gateway
aws apigateway get-rest-apis --region ap-south-1
```

---

## Environment Variables

### Required for Deployment

```bash
# AWS Configuration (from aws configure)
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_DEFAULT_REGION=ap-south-1

# Twilio Configuration (optional, has defaults)
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+16187025334
```

### Setting Environment Variables

```bash
# Temporary (current session)
export TWILIO_ACCOUNT_SID=your_sid
export TWILIO_AUTH_TOKEN=your_token

# Permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export TWILIO_ACCOUNT_SID=your_sid' >> ~/.bashrc
echo 'export TWILIO_AUTH_TOKEN=your_token' >> ~/.bashrc
source ~/.bashrc
```

---

## Troubleshooting

### Deployment Fails

**Problem**: AWS CLI not configured
```bash
# Solution
aws configure
```

**Problem**: Missing permissions
```bash
# Solution: Check IAM role has required permissions
aws iam get-role --role-name HelpingHandLambdaRole
```

**Problem**: jq not installed
```bash
# Solution (macOS)
brew install jq

# Solution (Ubuntu)
sudo apt-get install jq
```

### Tests Fail

**Problem**: API Gateway not deployed
```bash
# Solution
./scripts/deploy/deploy_all.sh
```

**Problem**: Lambda functions not updated
```bash
# Solution: Redeploy
./scripts/deploy/deploy_all.sh
```

**Problem**: SMS not working
```bash
# Solution: Check Twilio credentials
python scripts/test/verify_twilio_numbers.py
```

---

## Best Practices

### Before Deployment

1. Test locally first
2. Review changes in Git
3. Backup current deployment
4. Check AWS costs

### During Deployment

1. Monitor CloudWatch logs
2. Check for errors
3. Verify each step
4. Test incrementally

### After Deployment

1. Run test scripts
2. Check API endpoints
3. Verify SMS delivery
4. Monitor for 24 hours

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1
      
      - name: Deploy
        run: ./scripts/deploy/deploy_all.sh
      
      - name: Test
        run: ./scripts/test/test_complete_flow.sh
```

---

## Maintenance

### Regular Tasks

**Weekly**:
- Review CloudWatch logs
- Check error rates
- Monitor costs

**Monthly**:
- Update dependencies
- Review security
- Optimize performance

**Quarterly**:
- Update documentation
- Review architecture
- Plan improvements

---

## Support

For issues with scripts:
1. Check script output for errors
2. Review CloudWatch logs
3. Check AWS console
4. Refer to main documentation

---

**Last Updated**: March 4, 2026  
**Version**: 1.0
