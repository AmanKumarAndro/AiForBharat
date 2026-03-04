# Technical Specification

## System Requirements

### Functional Requirements

#### FR-01: Provider Registration
- System shall allow providers to register with phone, name, service type, pincode, and price
- System shall generate unique provider ID (PRV_<phone>)
- System shall set initial rating to 5.0
- System shall store GPS coordinates for map display

#### FR-02: Service Request Creation
- System shall allow farmers to create requests with service type and location
- System shall generate unique request ID (UUID)
- System shall set initial status to PENDING
- System shall trigger provider matching asynchronously

#### FR-03: Provider Matching
- System shall find providers by service type
- System shall filter by pincode (exact match or nearby)
- System shall filter by availability (is_available = true)
- System shall select top 3 providers by rating (descending)
- System shall send SMS notification to selected providers

#### FR-04: Request Acceptance
- System shall allow providers to accept via app or SMS reply
- System shall prevent race conditions using atomic operations
- System shall update request status to MATCHED
- System shall update provider status to ON_JOB
- System shall send confirmation SMS to both parties

#### FR-05: Service Completion
- System shall allow farmers to complete and rate service
- System shall accept rating from 1 to 5
- System shall store optional feedback text
- System shall update provider's average rating
- System shall increment provider's total_jobs counter
- System shall set provider back to AVAILABLE

#### FR-06: Status Tracking
- System shall provide real-time status for requests
- System shall return provider details when matched
- System shall return rating/feedback when completed

#### FR-07: Map Display
- System shall provide list of providers with GPS coordinates
- System shall filter by pincode and service type
- System shall include availability status

#### FR-08: Task Lists
- System shall provide list of all farmer's requests
- System shall provide list of all provider's jobs
- System shall categorize by status (ongoing/completed/pending)
- System shall sort by date (most recent first)

### Non-Functional Requirements

#### NFR-01: Performance
- API response time < 500ms (excluding SMS)
- SMS delivery time < 5 seconds
- Database query time < 100ms
- Support 1000 concurrent users

#### NFR-02: Availability
- System uptime: 99.9%
- Planned maintenance window: < 4 hours/month
- Automatic failover for critical components

#### NFR-03: Scalability
- Support 10,000 requests/day initially
- Scale to 100,000 requests/day
- Auto-scaling for traffic spikes

#### NFR-04: Security
- HTTPS only for all API calls
- Encrypted data at rest (DynamoDB)
- Encrypted data in transit (TLS 1.2+)
- IAM roles for service access

#### NFR-05: Reliability
- Zero data loss
- Atomic operations for critical updates
- Automatic retries for transient failures
- Idempotent operations

#### NFR-06: Maintainability
- Structured logging
- Comprehensive error handling
- Code documentation
- Infrastructure as Code

## Data Models

### Request Entity

```json
{
  "request_id": "UUID",
  "farmer_id": "+919910890180",
  "farmer_name": "Rajesh Sharma",
  "service_type": "TRACTOR | LABOUR | TRANSPORT",
  "farmer_pincode": "411001",
  "status": "PENDING | NOTIFYING | MATCHED | COMPLETED | NO_PROVIDERS_FOUND",
  "estimated_price": 500,
  "created_at": "2026-03-01T09:11:39.716614Z",
  "matched_provider_id": "PRV_9910890180",
  "completed_at": "2026-03-01T10:30:00.000000Z",
  "farmer_rating": 5,
  "farmer_feedback": "Excellent service!"
}
```

### Provider Entity

```json
{
  "provider_id": "PRV_9910890180",
  "phone": "+919910890180",
  "name": "Ramesh Kumar",
  "service_type": "TRACTOR | LABOUR | TRANSPORT",
  "pincode": "411001",
  "latitude": 18.5204,
  "longitude": 73.8567,
  "price_per_hour": 500,
  "rating": 4.8,
  "total_jobs": 25,
  "is_available": true,
  "status": "AVAILABLE | ON_JOB",
  "device_token": "expo-push-token",
  "nearby_pincodes": ["411002", "411003"]
}
```

### Pincode Mapping Entity

```json
{
  "pincode": "411001",
  "nearby": ["411002", "411003", "411004"],
  "district": "Pune",
  "state": "Maharashtra"
}
```

## API Specifications

### 1. Register Provider

**Endpoint**: POST /provider

**Request**:
```json
{
  "phone": "+919910890180",
  "name": "Ramesh Kumar",
  "service_type": "TRACTOR",
  "pincode": "411001",
  "price_per_hour": 500,
  "latitude": 18.5204,
  "longitude": 73.8567
}
```

**Response** (200):
```json
{
  "provider_id": "PRV_9910890180",
  "message": "Provider registered successfully"
}
```

**Validation**:
- phone: Required, valid phone number with country code
- name: Required, 2-100 characters
- service_type: Required, one of [TRACTOR, LABOUR, TRANSPORT]
- pincode: Required, 6 digits
- price_per_hour: Required, positive number
- latitude: Optional, -90 to 90
- longitude: Optional, -180 to 180

### 2. Create Request

**Endpoint**: POST /request

**Request**:
```json
{
  "farmer_id": "+919910890180",
  "farmer_name": "Rajesh Sharma",
  "service_type": "TRACTOR",
  "farmer_pincode": "411001",
  "estimated_price": 500
}
```

**Response** (200):
```json
{
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "status": "PENDING",
  "message": "Request created successfully"
}
```

**Validation**:
- farmer_id: Required, valid phone number
- farmer_name: Required, 2-100 characters
- service_type: Required, one of [TRACTOR, LABOUR, TRANSPORT]
- farmer_pincode: Required, 6 digits
- estimated_price: Optional, positive number, default 500

### 3. Get Status

**Endpoint**: GET /status/{request_id}

**Response** (200 - Pending):
```json
{
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "status": "PENDING",
  "service_type": "TRACTOR",
  "created_at": "2026-03-01T09:11:39.716614Z"
}
```

**Response** (200 - Matched):
```json
{
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "status": "MATCHED",
  "service_type": "TRACTOR",
  "created_at": "2026-03-01T09:11:39.716614Z",
  "provider": {
    "name": "Ramesh Kumar",
    "phone": "+919910890180",
    "rating": 4.8,
    "price_per_hour": 500.0
  }
}
```

### 4. Accept Request

**Endpoint**: POST /accept

**Request**:
```json
{
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "provider_id": "PRV_9910890180"
}
```

**Response** (200):
```json
{
  "message": "Request accepted successfully",
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "provider": {
    "name": "Ramesh Kumar",
    "phone": "+919910890180",
    "rating": 4.8
  }
}
```

**Response** (409 - Already Taken):
```json
{
  "error": "Request already accepted by another provider"
}
```

### 5. Complete & Rate

**Endpoint**: POST /complete

**Request**:
```json
{
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "rating": 5,
  "feedback": "Excellent service!"
}
```

**Response** (200):
```json
{
  "message": "Service completed and rated successfully",
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "provider_new_rating": 4.85
}
```

**Validation**:
- rating: Required, integer 1-5
- feedback: Optional, max 500 characters

### 6. Get Providers Map

**Endpoint**: GET /providers-map?pincode={pincode}&service_type={type}

**Response** (200):
```json
{
  "providers": [
    {
      "provider_id": "PRV_9910890180",
      "name": "Ramesh Kumar",
      "service_type": "TRACTOR",
      "pincode": "411001",
      "rating": 4.8,
      "price_per_hour": 500,
      "is_available": true,
      "latitude": 18.5204,
      "longitude": 73.8567,
      "phone": "+919910890180"
    }
  ],
  "count": 1
}
```

### 7. Get Farmer Requests

**Endpoint**: GET /farmer-requests/{farmer_id}?status={status}

**Response** (200):
```json
{
  "farmer_id": "+919910890180",
  "summary": {
    "total": 20,
    "ongoing": 15,
    "completed": 0,
    "pending": 5
  },
  "ongoing": [...],
  "completed": [...],
  "pending": [...]
}
```

### 8. Get Provider Jobs

**Endpoint**: GET /provider-jobs/{provider_id}?status={status}

**Response** (200):
```json
{
  "provider_id": "PRV_+919910890180",
  "provider_name": "Sravan Maurya",
  "provider_status": "AVAILABLE",
  "is_available": true,
  "rating": 5.0,
  "total_jobs": 0,
  "summary": {
    "total": 4,
    "ongoing": 4,
    "completed": 0
  },
  "ongoing": [...],
  "completed": [...]
}
```

### 9. Test Accept (SMS Simulation)

**Endpoint**: POST /test-accept

**Request**:
```json
{
  "provider_phone": "+919910890180"
}
```

**Response** (200):
```json
{
  "message": "Request accepted successfully (via test API)",
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "provider": {...},
  "farmer": {...}
}
```

### 10. SMS Reply Webhook

**Endpoint**: POST /sms-reply

**Request** (URL-encoded form data from Twilio):
```
From=+919910890180&Body=YES&MessageSid=SM...
```

**Response** (200 - TwiML):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>
```

## State Machine

### Request Status Transitions

```
PENDING
   │
   │ (Matching Lambda triggered)
   ▼
NOTIFYING
   │
   ├─► (Provider accepts) ──► MATCHED
   │
   └─► (No providers) ──► NO_PROVIDERS_FOUND

MATCHED
   │
   │ (Farmer completes & rates)
   ▼
COMPLETED
```

### Provider Status Transitions

```
AVAILABLE
   │
   │ (Accepts request)
   ▼
ON_JOB
   │
   │ (Service completed)
   ▼
AVAILABLE
```

## Business Rules

### BR-01: Provider Selection
- Select top 3 providers by rating (descending)
- Filter by service_type (exact match)
- Filter by pincode (exact or nearby)
- Filter by is_available = true
- If < 3 providers, send to all available

### BR-02: Race Condition Prevention
- Use DynamoDB conditional updates
- Check status IN (PENDING, NOTIFYING) before accepting
- Only one provider can accept a request
- Second provider gets "already taken" error

### BR-03: Rating Calculation
```
new_rating = ((old_rating × total_jobs) + new_rating) / (total_jobs + 1)
```

### BR-04: SMS Keywords
Accepted keywords for SMS reply:
- YES
- ACCEPT
- Y
- OK

Case-insensitive matching.

### BR-05: Provider Availability
- Provider is_available = false when ON_JOB
- Provider is_available = true when AVAILABLE
- Provider not included in matching when unavailable

## Error Handling

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| 400 | Bad Request | Validate input and retry |
| 404 | Not Found | Check ID and retry |
| 409 | Conflict | Request already taken |
| 500 | Internal Error | Retry with exponential backoff |

### Retry Strategy

- Transient errors: Retry 3 times with exponential backoff
- Permanent errors: Return error to client
- Timeout: 30 seconds for Lambda, 29 seconds for API Gateway

### Logging

- Log level: INFO for normal operations, ERROR for failures
- Include: request_id, farmer_id, provider_id, timestamp
- Structured logging with JSON format
- Sensitive data: Mask phone numbers in logs

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time (p50) | < 200ms | ~150ms |
| API Response Time (p99) | < 500ms | ~300ms |
| SMS Delivery Time | < 5s | ~2-3s |
| Database Query Time | < 100ms | ~50ms |
| Lambda Cold Start | < 1s | ~500ms |
| Lambda Warm Start | < 100ms | ~50ms |

## Capacity Planning

### Current Capacity

- API Gateway: 10,000 req/s
- Lambda: 1,000 concurrent
- DynamoDB: Unlimited (on-demand)
- Twilio: 100 SMS/s

### Growth Projections

| Month | Requests/Day | Providers | Farmers |
|-------|--------------|-----------|---------|
| 1 | 1,000 | 100 | 500 |
| 3 | 5,000 | 500 | 2,500 |
| 6 | 10,000 | 1,000 | 5,000 |
| 12 | 50,000 | 5,000 | 25,000 |

## Testing Requirements

### Unit Tests
- Test each Lambda function independently
- Mock DynamoDB and Twilio calls
- Test error handling
- Test edge cases

### Integration Tests
- Test complete request flow
- Test race conditions
- Test SMS notifications
- Test database operations

### Load Tests
- Test with 1,000 concurrent users
- Test with 10,000 requests/hour
- Test database performance
- Test SMS throughput

### Security Tests
- Test SQL injection (though NoSQL)
- Test XSS attacks
- Test authentication bypass
- Test rate limiting

## Deployment

### Environments

1. **Development**
   - Local testing
   - Mock services
   - No real SMS

2. **Staging**
   - AWS environment
   - Real services
   - Test data only

3. **Production**
   - AWS environment
   - Real services
   - Real data

### Deployment Process

1. Code review and approval
2. Run automated tests
3. Deploy to staging
4. Run integration tests
5. Manual QA testing
6. Deploy to production
7. Monitor for errors
8. Rollback if needed

### Rollback Strategy

- Keep previous Lambda versions
- Use Lambda aliases for traffic shifting
- Rollback in < 5 minutes
- Automated rollback on error rate > 5%

## Monitoring

### Metrics to Track

- Request count by endpoint
- Error rate by endpoint
- Response time by endpoint
- Lambda invocations
- Lambda errors
- Lambda duration
- DynamoDB read/write units
- SMS delivery rate
- SMS failure rate

### Alerts

- Error rate > 5%
- Response time > 1s
- Lambda timeout
- DynamoDB throttling
- SMS failure rate > 10%

---

**Version**: 1.0  
**Last Updated**: March 1, 2026
