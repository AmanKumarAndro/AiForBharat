# System Architecture

## Overview

Helping Hand is built on a serverless architecture using AWS services, designed for scalability, reliability, and cost-effectiveness.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Farmer App   │  │ Provider App │  │  Web Portal  │     │
│  │ (React Native│  │ (React Native│  │   (React)    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │   (REST API)    │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
    │  Lambda   │     │  Lambda   │     │  Lambda   │
    │ Functions │     │ Functions │     │ Functions │
    └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │    DynamoDB     │
                    │   (NoSQL DB)    │
                    └─────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  ┌──────────────┐                                           │
│  │    Twilio    │  SMS Notifications                        │
│  │  SMS Gateway │  +16187025334                             │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. API Gateway

**Purpose**: HTTP API endpoint for all client requests

**Configuration**:
- Type: REST API
- Region: ap-south-1 (Mumbai)
- Stage: prod
- URL: https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod

**Endpoints**: 10 total
- POST /provider
- POST /request
- GET /status/{id}
- POST /accept
- POST /test-accept
- POST /complete
- GET /providers-map
- GET /farmer-requests/{farmer_id}
- GET /provider-jobs/{provider_id}
- POST /sms-reply

**Features**:
- CORS enabled
- AWS_PROXY integration with Lambda
- No authentication (add for production)

### 2. Lambda Functions

**Runtime**: Python 3.12  
**Memory**: 128-256 MB  
**Timeout**: 30 seconds  
**Role**: HelpingHandLambdaRole

#### Core Functions

**HH_CreateRequest**
- Creates service request
- Triggers matching Lambda asynchronously
- Sets initial status to PENDING

**HH_MatchProviders**
- Finds top 3 providers by rating
- Filters by service type and pincode
- Sends SMS notifications via Twilio
- Updates status to NOTIFYING

**HH_AcceptRequest**
- Accepts request via app
- Atomic update (prevents race conditions)
- Updates provider status to ON_JOB
- Sends confirmation SMS to farmer

**HH_TestSMSAccept**
- Test endpoint for SMS acceptance
- Simulates SMS reply without actual SMS
- Same logic as real SMS handler

**HH_HandleSMSReply**
- Twilio webhook handler
- Parses incoming SMS replies
- Accepts request if reply is YES/ACCEPT/Y/OK
- Sends confirmations to both parties

**HH_CompleteAndRate**
- Marks service as completed
- Stores farmer rating and feedback
- Updates provider's average rating
- Sets provider back to AVAILABLE

**HH_GetStatus**
- Returns current request status
- Includes provider details if matched
- Includes rating/feedback if completed

**HH_RegisterProvider**
- Registers new provider
- Generates unique provider ID
- Sets initial rating to 5.0
- Stores GPS coordinates

**HH_GetProvidersMap**
- Returns providers with GPS coordinates
- Filters by pincode and service type
- For map display (like Uber/Rapido)

**HH_GetFarmerRequests**
- Lists all farmer's requests
- Categorizes by status (ongoing/completed/pending)
- Sorted by date (most recent first)

**HH_GetProviderJobs**
- Lists all provider's jobs
- Categorizes by status (ongoing/completed)
- Includes provider info and stats

#### Lambda Layer

**TwilioSDK Layer**
- ARN: arn:aws:lambda:ap-south-1:YOUR_AWS_ACCOUNT_ID:layer:TwilioSDK:1
- Contains: twilio Python package
- Attached to: All SMS-related functions

### 3. DynamoDB Tables

#### HH_Requests

**Purpose**: Store service requests

**Primary Key**: request_id (String)

**Attributes**:
```
- request_id: UUID
- farmer_id: Phone number
- farmer_name: String
- service_type: TRACTOR | LABOUR | TRANSPORT
- farmer_pincode: String
- status: PENDING | NOTIFYING | MATCHED | COMPLETED | NO_PROVIDERS_FOUND
- estimated_price: Number
- created_at: ISO timestamp
- matched_provider_id: String (when MATCHED)
- completed_at: ISO timestamp (when COMPLETED)
- farmer_rating: Number 1-5 (when COMPLETED)
- farmer_feedback: String (when COMPLETED)
```

**Capacity**: On-demand

#### HH_Providers

**Purpose**: Store provider information

**Primary Key**: provider_id (String)

**GSI**: ServiceType-Rating-Index
- Partition Key: service_type
- Sort Key: rating (descending)

**Attributes**:
```
- provider_id: PRV_<phone>
- phone: String with country code
- name: String
- service_type: TRACTOR | LABOUR | TRANSPORT
- pincode: String
- latitude: Number
- longitude: Number
- price_per_hour: Number
- rating: Number (0-5)
- total_jobs: Number
- is_available: Boolean
- status: AVAILABLE | ON_JOB
- device_token: String (for push notifications)
- nearby_pincodes: List of strings
```

**Capacity**: On-demand

#### HH_PincodeMappings

**Purpose**: Store nearby pincode relationships

**Primary Key**: pincode (String)

**Attributes**:
```
- pincode: String
- nearby: List of nearby pincodes
- district: String
- state: String
```

**Capacity**: On-demand

### 4. Twilio SMS

**Purpose**: Send SMS notifications

**Configuration**:
- Account SID: YOUR_TWILIO_ACCOUNT_SID
- Phone Number: +16187025334 (US number)
- Type: Trial account

**SMS Types**:

1. **Provider Notification**
```
Helping Hand: New TRACTOR request from Rajesh Sharma in 411001.
Price: Rs500. Reply YES to accept. ID: a6706841
```

2. **Provider Confirmation**
```
Request accepted! Farmer: Rajesh Sharma, Phone: +919910890180,
Location: 411001. ID: a6706841
```

3. **Farmer Notification**
```
Helping Hand: Ramesh Kumar accepted your request!
Rating: 4.8 stars. Call: +919910890180. ID: a6706841
```

**Webhook**: POST /sms-reply (for incoming SMS)

## Data Flow

### Request Creation Flow

```
1. Farmer creates request
   ↓
2. HH_CreateRequest Lambda
   - Saves to DynamoDB (status: PENDING)
   - Invokes HH_MatchProviders async
   ↓
3. HH_MatchProviders Lambda
   - Queries providers by service_type + rating
   - Filters by pincode and availability
   - Selects top 3 providers
   - Sends SMS to each provider
   - Updates status to NOTIFYING
   ↓
4. Providers receive SMS
```

### Acceptance Flow (SMS)

```
1. Provider replies "YES" to SMS
   ↓
2. Twilio webhook → POST /sms-reply
   ↓
3. HH_HandleSMSReply Lambda
   - Extracts provider phone
   - Finds provider in DB
   - Finds latest NOTIFYING request
   - Atomic update (prevents race condition)
   - Updates request status to MATCHED
   - Updates provider status to ON_JOB
   - Sends confirmation SMS to provider
   - Sends notification SMS to farmer
```

### Acceptance Flow (Test Endpoint)

```
1. Call POST /test-accept with provider_phone
   ↓
2. HH_TestSMSAccept Lambda
   - Same logic as SMS handler
   - Simulates SMS reply without actual SMS
   - Useful for testing with trial Twilio account
```

### Completion Flow

```
1. Farmer completes service and rates
   ↓
2. HH_CompleteAndRate Lambda
   - Updates request status to COMPLETED
   - Stores rating and feedback
   - Calculates new provider rating
   - Increments provider total_jobs
   - Sets provider status to AVAILABLE
```

## Security

### Current Implementation

- ✅ HTTPS only (API Gateway)
- ✅ IAM roles for Lambda
- ✅ Atomic DynamoDB operations
- ✅ Environment variables for secrets
- ❌ No API authentication
- ❌ No rate limiting
- ❌ No input validation

### Production Recommendations

1. **Authentication**
   - Implement JWT tokens
   - Add API keys for mobile apps
   - Use AWS Cognito for user management

2. **Authorization**
   - Verify farmer can only access their requests
   - Verify provider can only access their jobs
   - Add role-based access control

3. **Rate Limiting**
   - API Gateway throttling
   - Per-user rate limits
   - DDoS protection via AWS WAF

4. **Input Validation**
   - Sanitize all inputs
   - Validate phone numbers
   - Validate pincodes
   - Prevent SQL injection (though using NoSQL)

5. **Monitoring**
   - CloudWatch alarms
   - X-Ray tracing
   - Error tracking
   - Performance monitoring

## Scalability

### Current Capacity

- **API Gateway**: 10,000 requests/second
- **Lambda**: 1,000 concurrent executions
- **DynamoDB**: Unlimited (on-demand)
- **Twilio**: 100 SMS/second

### Scaling Strategy

1. **Horizontal Scaling**
   - Lambda auto-scales automatically
   - DynamoDB on-demand scales automatically
   - No server management needed

2. **Caching**
   - Add CloudFront for static content
   - Add ElastiCache for frequent queries
   - Cache provider lists

3. **Database Optimization**
   - Add GSI for farmer_id queries
   - Add GSI for matched_provider_id queries
   - Use Query instead of Scan

4. **Async Processing**
   - Use SQS for SMS queue
   - Use EventBridge for scheduled tasks
   - Decouple components

## Cost Estimation

### Monthly Cost (1,000 requests)

- API Gateway: $3.50
- Lambda: $0.20
- DynamoDB: $1.25
- CloudWatch: $0.50
- Twilio SMS: $22.50 (3 SMS per request)
- **Total**: ~$28/month

### Monthly Cost (10,000 requests)

- API Gateway: $35
- Lambda: $2
- DynamoDB: $12.50
- CloudWatch: $5
- Twilio SMS: $225
- **Total**: ~$280/month

## Disaster Recovery

### Backup Strategy

1. **DynamoDB**
   - Enable point-in-time recovery
   - Daily backups to S3
   - Cross-region replication

2. **Lambda**
   - Code stored in S3
   - Version control in Git
   - Infrastructure as Code

3. **Configuration**
   - Store in Parameter Store
   - Backup to S3
   - Version controlled

### Recovery Plan

1. **Database Failure**
   - Restore from latest backup
   - RTO: 1 hour
   - RPO: 5 minutes

2. **Lambda Failure**
   - Redeploy from S3/Git
   - RTO: 15 minutes
   - RPO: 0 (stateless)

3. **Region Failure**
   - Failover to backup region
   - RTO: 2 hours
   - RPO: 1 hour

## Monitoring

### CloudWatch Metrics

- Lambda invocations
- Lambda errors
- Lambda duration
- API Gateway requests
- API Gateway 4xx/5xx errors
- DynamoDB read/write capacity
- DynamoDB throttles

### CloudWatch Alarms

- Lambda error rate > 5%
- API Gateway 5xx rate > 1%
- Lambda duration > 25 seconds
- DynamoDB throttles > 0

### Logging

- All Lambda functions log to CloudWatch
- Structured logging with JSON
- Log retention: 30 days
- Searchable via CloudWatch Insights

## Performance

### Response Times

- Create Request: ~200ms
- Match Providers: ~2-3s (includes SMS)
- Accept Request: ~300ms
- Get Status: ~100ms
- Get Providers Map: ~150ms
- List Requests/Jobs: ~200ms

### Optimization Opportunities

1. **Database**
   - Add GSI for common queries
   - Use Query instead of Scan
   - Implement pagination

2. **Caching**
   - Cache provider lists
   - Cache pincode mappings
   - Use ElastiCache

3. **Lambda**
   - Increase memory for faster execution
   - Use provisioned concurrency
   - Optimize cold starts

## Technology Choices

### Why Serverless?

- **Cost**: Pay only for what you use
- **Scalability**: Auto-scales automatically
- **Maintenance**: No server management
- **Speed**: Fast development and deployment

### Why DynamoDB?

- **Performance**: Single-digit millisecond latency
- **Scalability**: Unlimited throughput
- **Availability**: 99.99% SLA
- **Cost**: On-demand pricing

### Why Twilio?

- **Reliability**: 99.95% uptime
- **Global**: Works in 180+ countries
- **Simple**: Easy API integration
- **Features**: SMS, voice, WhatsApp

## Future Enhancements

1. **Real-time Updates**
   - WebSocket API for live updates
   - Push notifications via SNS
   - Real-time tracking

2. **Analytics**
   - Provider performance metrics
   - Farmer behavior analysis
   - Revenue tracking

3. **Payment Integration**
   - Razorpay/Stripe integration
   - Escrow system
   - Automated payouts

4. **Advanced Matching**
   - ML-based provider ranking
   - Predictive availability
   - Dynamic pricing

5. **Multi-region**
   - Deploy to multiple regions
   - Global load balancing
   - Data residency compliance

---

**Version**: 1.0  
**Last Updated**: March 1, 2026
