# KisanVoice System Requirements

**Technical Requirements & Specifications**

---

## System Requirements

### Development Environment

**Required:**
- Node.js 18.x or higher
- npm 8.x or higher
- AWS CLI 2.x
- Git

**Optional:**
- Serverless Framework CLI
- Postman (for API testing)
- VS Code or similar IDE

### AWS Account Requirements

**Services Used:**
- Lambda (serverless compute)
- DynamoDB (database)
- API Gateway (REST API)
- EventBridge (scheduling)
- SQS (dead letter queue)
- Secrets Manager (credentials)
- CloudWatch (logging & monitoring)
- IAM (permissions)

**Permissions Needed:**
- Lambda: Create, update, invoke functions
- DynamoDB: Create tables, read/write data
- API Gateway: Create REST APIs
- EventBridge: Create/manage rules
- SQS: Create queues, send/receive messages
- Secrets Manager: Create/read secrets
- CloudWatch: Create logs, metrics, alarms
- IAM: Create roles and policies

### External Services

**Twilio Account:**
- Account SID
- Auth Token
- Messaging Service SID
- Phone number (for SMS)
- Minimum balance: $20

**OpenWeatherMap Account:**
- API Key
- Free tier: 1,000 calls/day
- Recommended: Paid tier for production

---

## Installation Requirements

### 1. Clone Repository

```bash
git clone https://github.com/your-org/kisanvoice-irrigation.git
cd kisanvoice-irrigation
```

### 2. Install Dependencies

```bash
npm install
```

**Key Dependencies:**
- aws-sdk: AWS service integration
- axios: HTTP client
- twilio: SMS delivery
- uuid: Unique ID generation

### 3. Configure AWS Credentials

```bash
aws configure
```

**Required:**
- AWS Access Key ID
- AWS Secret Access Key
- Default region: ap-south-1
- Output format: json

### 4. Create Secrets

```bash
aws secretsmanager create-secret \
  --name kisanvoice/prod \
  --secret-string '{
    "TWILIO_ACCOUNT_SID": "your_sid",
    "TWILIO_AUTH_TOKEN": "your_token",
    "TWILIO_MESSAGING_SERVICE_SID": "your_service_sid",
    "OPENWEATHER_API_KEY": "your_api_key"
  }'
```

### 5. Deploy Infrastructure

```bash
npx serverless deploy
```

### 6. Seed Data

```bash
npm run seed:crops
npm run seed:monsoon
```

---

## Runtime Requirements

### Lambda Functions

| Function | Runtime | Timeout | Memory | Trigger |
|----------|---------|---------|--------|---------|
| register-farmer-irrigation | Node.js 18.x | 30s | 128MB | API Gateway |
| daily-intelligence | Node.js 18.x | 15s | 256MB | EventBridge |
| weather-alert-check | Node.js 18.x | 300s | 512MB | EventBridge |
| get-dashboard | Node.js 18.x | 15s | 128MB | API Gateway |
| get-alerts-by-phone | Node.js 18.x | 10s | 128MB | API Gateway |
| delete-alert | Node.js 18.x | 10s | 128MB | API Gateway |
| unregister-farmer | Node.js 18.x | 30s | 128MB | API Gateway |
| get-crop-calendar | Node.js 18.x | 10s | 128MB | API Gateway |
| twilio-webhook | Node.js 18.x | 10s | 128MB | API Gateway |
| twilio-status | Node.js 18.x | 10s | 128MB | API Gateway |
| retry-alert | Node.js 18.x | 30s | 128MB | SQS |
| weekly-summary | Node.js 18.x | 300s | 256MB | EventBridge |

### DynamoDB Tables

| Table | Partition Key | Sort Key | Billing Mode | GSI |
|-------|---------------|----------|--------------|-----|
| farmers | pk (farmer#uuid) | sk (profile) | On-Demand | phone-index |
| soil-state | pk (farmer#uuid) | sk (state) | On-Demand | - |
| sms-log | pk (farmer#uuid) | sk (sms#timestamp) | On-Demand | - |
| savings | pk (farmer#uuid) | sk (saving#date) | On-Demand | - |
| monsoon-calendar | pk (district#name) | sk (monsoon) | On-Demand | - |
| crop-data | pk (crop#name) | sk (stage#name) | On-Demand | - |

### EventBridge Rules

| Rule | Schedule | Target |
|------|----------|--------|
| irrigation-{farmerId} | Daily at farmer's alertTime | daily-intelligence Lambda |
| weather-alert-check | Every 3 hours (cron: 0 */3 * * ? *) | weather-alert-check Lambda |
| weekly-summary | Every Sunday 8 AM IST (cron: 30 2 ? * SUN *) | weekly-summary Lambda |

---

## API Requirements

### Base URL

```
https://ys4xa8tu60.execute-api.ap-south-1.amazonaws.com/dev
```

### Endpoints

**Registration:**
- POST /irrigation/register

**Dashboard:**
- GET /irrigation/dashboard/{farmerId}

**Alerts:**
- GET /irrigation/alerts/phone/{phone}
- DELETE /irrigation/alerts/delete/{farmerId}/{alertId}

**Farmer Management:**
- DELETE /irrigation/unregister/{farmerId}

**Crop Information:**
- GET /irrigation/crop-calendar
- GET /irrigation/crop-calendar/{crop}

**Webhooks:**
- POST /twilio/inbound
- POST /twilio/status

### Request Headers

```json
{
  "Content-Type": "application/json"
}
```

### CORS Configuration

```yaml
cors:
  origin: '*'
  headers:
    - Content-Type
    - X-Amz-Date
    - Authorization
    - X-Api-Key
  allowCredentials: false
```

---

## Data Requirements

### Farmer Registration

**Required Fields:**
- phone: E.164 format (+919876543210)
- name: String (2-100 characters)
- crop: Enum (wheat, rice, cotton, sugarcane, maize, potato)
- cropStage: Enum (initial, development, mid, late, flowering, grain_filling, maturity)
- district: String (must be in supported list)

**Optional Fields:**
- lat: Number (-90 to 90)
- lon: Number (-180 to 180)
- language: Enum (hi, en)
- alertTime: String (HH:MM format, default: 17:00)

### Crop Data

**Structure:**
```json
{
  "crop": "wheat",
  "totalDays": 120,
  "stages": [
    {
      "name": "Germination",
      "startDay": 0,
      "endDay": 20,
      "kc": 0.3,
      "stressThreshold": 30
    }
  ]
}
```

**Required for Each Stage:**
- name: String
- startDay: Number
- endDay: Number
- kc: Number (crop coefficient)
- stressThreshold: Number (mm)

### Monsoon Calendar

**Structure:**
```json
{
  "district": "Karnal",
  "monsoonStart": "2026-06-15",
  "monsoonEnd": "2026-09-30",
  "avgRainfall": 650
}
```

---

## Mobile App Requirements

### React Native

**Minimum Version:**
- React Native: 0.70+
- React: 18+

**Required Packages:**
```json
{
  "axios": "^1.6.0",
  "@react-native-async-storage/async-storage": "^1.19.0",
  "react-navigation": "^6.0.0"
}
```

### iOS

**Minimum Version:** iOS 13.0+

**Permissions:**
- Location (optional, for GPS)
- Notifications (optional, for push)

### Android

**Minimum Version:** Android 8.0 (API 26)+

**Permissions:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

---

## Testing Requirements

### Unit Tests

**Framework:** Jest

**Coverage Target:** 80%+

**Run Tests:**
```bash
npm test
```

### Integration Tests

**Tools:**
- AWS CLI
- Postman
- curl

**Test Scenarios:**
- Farmer registration
- Daily intelligence trigger
- Weather alert check
- Alert retrieval
- Alert deletion

### Load Testing

**Requirements:**
- 100 concurrent farmers
- 1,000 API requests/minute
- < 1 second response time
- 99.9% success rate

---

## Monitoring Requirements

### CloudWatch Metrics

**Lambda:**
- Invocation count
- Error count
- Duration
- Throttles
- Concurrent executions

**DynamoDB:**
- Read capacity units
- Write capacity units
- Throttled requests
- System errors

**API Gateway:**
- Request count
- 4xx errors
- 5xx errors
- Latency

### CloudWatch Alarms

**Critical:**
- Lambda error rate > 5%
- DynamoDB throttling
- SQS DLQ message count > 0
- API Gateway 5xx rate > 1%

**Warning:**
- Lambda duration > 10s
- DynamoDB read/write capacity > 80%
- API Gateway latency > 2s

### Logging

**Log Retention:**
- Development: 7 days
- Production: 30 days

**Log Format:** JSON structured logs

**Required Fields:**
- timestamp
- level (INFO, WARN, ERROR)
- message
- farmerId (if applicable)
- correlationId

---

## Security Requirements

### Authentication

**Current:** Open API (MVP)

**Future:** JWT tokens with user authentication

### Data Encryption

**At Rest:**
- DynamoDB: Enabled
- Secrets Manager: Enabled
- S3 (if used): Enabled

**In Transit:**
- HTTPS only
- TLS 1.2+

### Phone Number Validation

**Format:** E.164 (+[country code][number])

**Validation:**
- Length: 10-15 digits
- Country code: Required
- No special characters except +

### Rate Limiting

**Registration:** 10 requests/minute per IP

**Data Fetching:** 100 requests/minute per farmer

**Manual Trigger:** 5 requests/hour per farmer

---

## Backup & Recovery Requirements

### Backup Strategy

**DynamoDB:**
- Point-in-time recovery: Enabled
- Daily snapshots: Automated
- Retention: 30 days

**Lambda Code:**
- Version control: Git
- Backup: GitHub/GitLab
- Deployment: Serverless Framework

### Recovery Objectives

**RTO (Recovery Time Objective):** 1 hour

**RPO (Recovery Point Objective):** 5 minutes

**Recovery Process:**
1. Redeploy Lambda functions from Git
2. Restore DynamoDB from snapshot
3. Verify EventBridge rules
4. Test API endpoints
5. Monitor CloudWatch logs

---

## Cost Requirements

### AWS Costs (Monthly)

**1,000 Farmers:**
- Lambda: $5
- DynamoDB: $2
- API Gateway: $1
- EventBridge: $1
- Total AWS: $9

**10,000 Farmers:**
- Lambda: $25
- DynamoDB: $15
- API Gateway: $3
- EventBridge: $2
- Total AWS: $45

### External Service Costs

**Twilio:**
- SMS rate: $0.0079 per SMS
- 1,000 farmers × 2 SMS/day × 30 days = $474/month

**OpenWeatherMap:**
- Free tier: 1,000 calls/day (sufficient for 300 farmers)
- Paid tier: $40/month for 100,000 calls/day

### Total Cost Estimate

| Farmers | AWS | Twilio | Weather | Total |
|---------|-----|--------|---------|-------|
| 1,000 | $9 | $237 | $0 | $246 |
| 10,000 | $45 | $2,370 | $40 | $2,455 |
| 100,000 | $380 | $23,700 | $40 | $24,120 |

---

## Compliance Requirements

### TRAI Regulations (India)

**SMS Compliance:**
- STOP/START support: Required
- Opt-out mechanism: Required
- Sender ID registration: Required
- DND registry check: Recommended

### Data Privacy

**GDPR Compliance:**
- Data collection consent
- Right to access data
- Right to delete data
- Data portability

**Indian IT Act:**
- Reasonable security practices
- Data breach notification
- Sensitive personal data protection

---

## Support Requirements

### Documentation

**Required:**
- README.md
- ARCHITECTURE.md
- FEATURES.md
- REQUIREMENTS.md (this file)
- SPEC.md
- USER_GUIDE.md
- API_DOCUMENTATION.md

### Support Channels

**For Farmers:**
- SMS: HELP command
- Phone: Helpline number
- Mobile app: In-app support

**For Developers:**
- GitHub Issues
- Email: dev@kisanvoice.com
- Documentation: docs.kisanvoice.com

---

**Version:** 1.0.0  
**Last Updated:** March 4, 2026
