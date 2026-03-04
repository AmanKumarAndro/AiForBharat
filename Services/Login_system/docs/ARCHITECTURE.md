# Architecture Documentation

## System Overview

KisanVoice Authentication API is built on AWS serverless architecture, providing a scalable, cost-effective solution for user authentication and profile management.

## Architecture Diagram

```
┌─────────────┐
│   Client    │
│ (React Native)│
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│  API Gateway    │
│   (REST API)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         AWS Lambda Functions        │
│  ┌──────────┐      ┌─────────────┐ │
│  │   Auth   │      │   Farmer    │ │
│  │ Handlers │      │  Handlers   │ │
│  └──────────┘      └─────────────┘ │
└─────────┬───────────────┬───────────┘
          │               │
          ▼               ▼
    ┌──────────┐    ┌──────────┐
    │  Twilio  │    │ DynamoDB │
    │  Verify  │    │  Table   │
    └──────────┘    └──────────┘
```

## Components

### 1. API Gateway

- **Type**: REST API
- **Region**: ap-south-1 (Mumbai)
- **Features**:
  - CORS enabled for cross-origin requests
  - Request/response transformation
  - Throttling and rate limiting
  - API key management (optional)

### 2. AWS Lambda Functions

#### Authentication Functions

**sendOtp**
- Validates phone number format
- Initiates OTP verification via Twilio
- No database interaction

**verifyOtp**
- Validates OTP with Twilio Verify
- Creates user record if first-time login
- Generates JWT token
- Returns profile completion status

#### Profile Management Functions

**onboardFarmer**
- Protected by JWT middleware
- Validates all required fields
- Updates user profile in DynamoDB
- Sets `isProfileComplete` flag

**getProfile**
- Protected by JWT middleware
- Retrieves user data from DynamoDB
- Returns complete profile information

### 3. DynamoDB

**Table**: `kisanvoice-auth-api-{stage}-farmers`

**Configuration**:
- Billing Mode: PAY_PER_REQUEST (on-demand)
- Partition Key: `phone` (String)
- No sort key (single-item access pattern)

**Schema**:
```javascript
{
  phone: String,              // Primary key, format: +919876543210
  name: String,               // User's full name
  userType: String,           // "farmer" | "provider"
  totalLandArea: Number,      // In acres
  latitude: Number,           // Decimal degrees
  longitude: Number,          // Decimal degrees
  city: String,               // City name
  state: String,              // State name
  isProfileComplete: Boolean, // Profile completion status
  language: String,           // Default: "hi"
  createdAt: String,          // ISO 8601 timestamp
  updatedAt: String           // ISO 8601 timestamp
}
```

### 4. Twilio Verify API

**Purpose**: OTP generation and verification

**Flow**:
1. Client requests OTP → Lambda calls Twilio Verify
2. Twilio sends SMS with 6-digit code
3. Client submits OTP → Lambda verifies with Twilio
4. Twilio returns approval status

**Features**:
- Automatic retry logic
- Rate limiting (3 attempts per 5 minutes)
- Multiple channel support (SMS, Voice)

### 5. AWS Systems Manager Parameter Store

**Purpose**: Secure secret management

**Parameters**:
- `/kisanvoice/{stage}/jwt-secret` - JWT signing key
- `/kisanvoice/{stage}/twilio-account-sid` - Twilio account ID
- `/kisanvoice/{stage}/twilio-auth-token` - Twilio auth token
- `/kisanvoice/{stage}/twilio-verify-service-sid` - Verify service ID

**Type**: SecureString (encrypted at rest)

## Security Architecture

### Authentication Flow

```
1. User enters phone number
   ↓
2. API sends OTP via Twilio
   ↓
3. User enters OTP
   ↓
4. API verifies OTP with Twilio
   ↓
5. API generates JWT token (7-day expiry)
   ↓
6. Client stores token securely
   ↓
7. Client includes token in Authorization header
   ↓
8. Middleware validates JWT on protected routes
```

### Security Measures

1. **JWT Tokens**
   - HS256 algorithm
   - 7-day expiration
   - Payload contains only phone number
   - Signed with secret from Parameter Store

2. **API Security**
   - HTTPS only (enforced by API Gateway)
   - CORS configured for specific origins
   - Input validation on all endpoints
   - Rate limiting via Twilio

3. **Data Security**
   - Secrets stored in AWS Parameter Store (encrypted)
   - DynamoDB encryption at rest (AWS managed)
   - No sensitive data in logs
   - IAM roles with least privilege

4. **Phone Validation**
   - Regex pattern: `^\+\d{10,15}$`
   - Must include country code
   - Prevents invalid submissions

## Scalability

### Auto-Scaling

- **Lambda**: Automatic scaling up to account limits
- **DynamoDB**: On-demand capacity mode scales automatically
- **API Gateway**: Handles up to 10,000 requests per second (default)

### Performance Optimization

- Lambda cold start mitigation via provisioned concurrency (optional)
- DynamoDB single-table design for fast queries
- Minimal dependencies for faster Lambda execution
- Connection pooling for external services

## Cost Optimization

### Pricing Model

1. **Lambda**
   - Pay per request + compute time
   - Free tier: 1M requests/month

2. **DynamoDB**
   - On-demand: Pay per read/write
   - No minimum capacity charges

3. **API Gateway**
   - Pay per API call
   - Free tier: 1M calls/month

4. **Twilio**
   - Pay per SMS sent
   - Verify API pricing applies

### Cost-Saving Strategies

- On-demand DynamoDB (no idle capacity costs)
- Minimal Lambda memory allocation (128-256 MB)
- Efficient code to reduce execution time
- Caching strategies for repeated requests (future)

## Monitoring & Logging

### CloudWatch Logs

- All Lambda functions log to CloudWatch
- Log groups: `/aws/lambda/{function-name}`
- Retention: 7 days (configurable)

### Metrics

- Lambda invocations, errors, duration
- API Gateway request count, latency, errors
- DynamoDB read/write capacity usage
- Custom metrics for business logic (optional)

### Alarms (Recommended)

- Lambda error rate > 5%
- API Gateway 5xx errors > 10
- DynamoDB throttling events
- Twilio API failures

## Disaster Recovery

### Backup Strategy

- DynamoDB Point-in-Time Recovery (enable for production)
- Parameter Store values documented securely
- Infrastructure as Code (serverless.yml) in version control

### Recovery Procedures

1. **Lambda Function Failure**: Automatic retry by AWS
2. **DynamoDB Outage**: AWS handles regional failover
3. **Complete Stack Loss**: Redeploy from `serverless.yml`
4. **Data Loss**: Restore from DynamoDB backup

## Deployment Architecture

### Environments

- **Development** (`dev`): Testing and development
- **Production** (`prod`): Live user traffic

### CI/CD Pipeline (Recommended)

```
Code Push → GitHub Actions → Run Tests → Deploy to Dev → Manual Approval → Deploy to Prod
```

### Deployment Process

1. Code changes committed to repository
2. Serverless Framework packages Lambda functions
3. CloudFormation stack updated
4. Zero-downtime deployment (Lambda versioning)
5. API Gateway updated with new Lambda versions

## Future Enhancements

1. **Caching Layer**: Redis/ElastiCache for session data
2. **Multi-Region**: Deploy to multiple AWS regions
3. **GraphQL API**: Alternative to REST
4. **WebSocket Support**: Real-time notifications
5. **Advanced Analytics**: User behavior tracking
6. **Rate Limiting**: API-level throttling per user
7. **Refresh Tokens**: Extend session without re-authentication

## Dependencies

### External Services

- Twilio Verify API (critical dependency)
- AWS Services (Lambda, DynamoDB, API Gateway, Parameter Store)

### NPM Packages

- `aws-sdk`: AWS service integration
- `jsonwebtoken`: JWT token management
- `twilio`: Twilio API client

## Compliance & Standards

- **Data Privacy**: User phone numbers stored securely
- **GDPR Considerations**: User data deletion capability (to be implemented)
- **API Standards**: RESTful design principles
- **Security Standards**: OWASP best practices
