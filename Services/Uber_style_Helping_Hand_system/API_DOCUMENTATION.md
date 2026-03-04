# API Documentation

## Base URL

```
https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod
```

## Authentication

Currently no authentication required. For production, implement JWT tokens or API keys.

## Response Format

All responses are in JSON format with appropriate HTTP status codes.

## Error Handling

### Error Response Format

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists or taken |
| 500 | Internal Server Error |

---

## Endpoints

### 1. Register Provider

Register a new service provider.

**Endpoint**: `POST /provider`

**Request Body**:
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

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number with country code |
| name | string | Yes | Provider's full name |
| service_type | string | Yes | TRACTOR, LABOUR, or TRANSPORT |
| pincode | string | Yes | 6-digit pincode |
| price_per_hour | number | Yes | Hourly rate in rupees |
| latitude | number | No | GPS latitude (-90 to 90) |
| longitude | number | No | GPS longitude (-180 to 180) |

**Success Response** (200):
```json
{
  "provider_id": "PRV_9910890180",
  "message": "Provider registered successfully"
}
```

**Error Response** (400):
```json
{
  "error": "Missing required field: name"
}
```

**Example**:
```bash
curl -X POST https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/provider \
  -H 'Content-Type: application/json' \
  -d '{
    "phone": "+919910890180",
    "name": "Ramesh Kumar",
    "service_type": "TRACTOR",
    "pincode": "411001",
    "price_per_hour": 500,
    "latitude": 18.5204,
    "longitude": 73.8567
  }'
```

---

### 2. Create Service Request

Create a new service request.

**Endpoint**: `POST /request`

**Request Body**:
```json
{
  "farmer_id": "+919910890180",
  "farmer_name": "Rajesh Sharma",
  "service_type": "TRACTOR",
  "farmer_pincode": "411001",
  "estimated_price": 500
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| farmer_id | string | Yes | Farmer's phone number |
| farmer_name | string | Yes | Farmer's full name |
| service_type | string | Yes | TRACTOR, LABOUR, or TRANSPORT |
| farmer_pincode | string | Yes | 6-digit pincode |
| estimated_price | number | No | Expected price (default: 500) |

**Success Response** (200):
```json
{
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "status": "PENDING",
  "message": "Request created successfully"
}
```

**Error Response** (400):
```json
{
  "error": "Invalid service_type. Must be TRACTOR, LABOUR, or TRANSPORT"
}
```

**What Happens**:
1. Request created with status PENDING
2. Matching Lambda triggered asynchronously
3. Top 3 providers notified via SMS
4. Status updated to NOTIFYING

**Example**:
```bash
curl -X POST https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/request \
  -H 'Content-Type: application/json' \
  -d '{
    "farmer_id": "+919910890180",
    "farmer_name": "Rajesh Sharma",
    "service_type": "TRACTOR",
    "farmer_pincode": "411001",
    "estimated_price": 500
  }'
```

---

### 3. Get Request Status

Get current status of a service request.

**Endpoint**: `GET /status/{request_id}`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| request_id | string | Yes | Request ID from create response |

**Success Response - Pending** (200):
```json
{
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "status": "PENDING",
  "service_type": "TRACTOR",
  "created_at": "2026-03-01T09:11:39.716614Z"
}
```

**Success Response - Matched** (200):
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

**Success Response - Completed** (200):
```json
{
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "status": "COMPLETED",
  "service_type": "TRACTOR",
  "created_at": "2026-03-01T09:11:39.716614Z",
  "completed_at": "2026-03-01T10:30:00.000000Z",
  "provider": {
    "name": "Ramesh Kumar",
    "phone": "+919910890180",
    "rating": 4.8,
    "price_per_hour": 500.0
  },
  "farmer_rating": 5,
  "farmer_feedback": "Excellent service!"
}
```

**Error Response** (404):
```json
{
  "error": "Request not found"
}
```

**Status Values**:
- PENDING: Matching providers
- NOTIFYING: SMS sent to providers
- MATCHED: Provider accepted
- COMPLETED: Service finished
- NO_PROVIDERS_FOUND: No available providers

**Example**:
```bash
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/status/a6706841-c5e1-4fb9-b973-4a606a24986e"
```

---

### 4. Accept Request (App)

Provider accepts a request through mobile app.

**Endpoint**: `POST /accept`

**Request Body**:
```json
{
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "provider_id": "PRV_9910890180"
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| request_id | string | Yes | Request ID to accept |
| provider_id | string | Yes | Provider's ID |

**Success Response** (200):
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

**Error Response** (409):
```json
{
  "error": "Request already accepted by another provider"
}
```

**Error Response** (404):
```json
{
  "error": "Request not found or not available"
}
```

**What Happens**:
1. Atomic update prevents race conditions
2. Request status → MATCHED
3. Provider status → ON_JOB
4. SMS sent to farmer with provider details

**Example**:
```bash
curl -X POST https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/accept \
  -H 'Content-Type: application/json' \
  -d '{
    "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
    "provider_id": "PRV_9910890180"
  }'
```

---

### 5. Accept Request (SMS Test)

Test endpoint to simulate SMS reply acceptance.

**Endpoint**: `POST /test-accept`

**Request Body**:
```json
{
  "provider_phone": "+919910890180"
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| provider_phone | string | Yes | Provider's phone number |

**Success Response** (200):
```json
{
  "message": "Request accepted successfully (via test API)",
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "provider": {
    "name": "Ramesh Kumar",
    "phone": "+919910890180",
    "rating": 4.8
  },
  "farmer": {
    "name": "Rajesh Sharma",
    "phone": "+919910890180"
  }
}
```

**Error Response** (404):
```json
{
  "error": "No pending requests found"
}
```

**Error Response** (409):
```json
{
  "error": "Request already taken by another provider"
}
```

**What Happens**:
1. Finds provider by phone
2. Finds latest NOTIFYING request for provider's service type
3. Accepts request (same logic as SMS handler)
4. Sends confirmation SMS to both parties

**Use Case**: Testing SMS acceptance without actual SMS (Twilio trial limitation workaround)

**Example**:
```bash
curl -X POST https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/test-accept \
  -H 'Content-Type: application/json' \
  -d '{"provider_phone": "+919910890180"}'
```

---

### 6. Complete & Rate Service

Farmer completes service and rates provider.

**Endpoint**: `POST /complete`

**Request Body**:
```json
{
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "rating": 5,
  "feedback": "Excellent service, very professional!"
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| request_id | string | Yes | Request ID to complete |
| rating | number | Yes | Rating from 1 to 5 |
| feedback | string | No | Optional feedback text |

**Success Response** (200):
```json
{
  "message": "Service completed and rated successfully",
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "provider_new_rating": 4.85
}
```

**Error Response** (400):
```json
{
  "error": "Rating must be between 1 and 5"
}
```

**Error Response** (404):
```json
{
  "error": "Request not found"
}
```

**What Happens**:
1. Request status → COMPLETED
2. Provider's average rating updated
3. Provider's total_jobs incremented
4. Provider status → AVAILABLE
5. Provider can receive new requests

**Rating Calculation**:
```
new_rating = ((old_rating × total_jobs) + new_rating) / (total_jobs + 1)
```

**Example**:
```bash
curl -X POST https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/complete \
  -H 'Content-Type: application/json' \
  -d '{
    "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
    "rating": 5,
    "feedback": "Excellent service!"
  }'
```

---

### 7. Get Providers Map

Get list of providers with GPS coordinates for map display.

**Endpoint**: `GET /providers-map`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| pincode | string | No | Filter by pincode |
| service_type | string | No | Filter by service type |

**Success Response** (200):
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

**What It Returns**:
- Only providers with GPS coordinates
- Filtered by pincode (if provided)
- Filtered by service_type (if provided)
- Sorted by rating (highest first)

**Use Case**: Display providers on map (like Uber/Rapido)

**Examples**:
```bash
# Get all TRACTOR providers in pincode 411001
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/providers-map?pincode=411001&service_type=TRACTOR"

# Get all providers (no filter)
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/providers-map"

# Get all LABOUR providers (any pincode)
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/providers-map?service_type=LABOUR"
```

---

### 8. Get Farmer Requests

Get all requests created by a farmer.

**Endpoint**: `GET /farmer-requests/{farmer_id}`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| farmer_id | string | Yes | Farmer's phone number |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status |

**Success Response** (200):
```json
{
  "farmer_id": "+919910890180",
  "summary": {
    "total": 20,
    "ongoing": 15,
    "completed": 0,
    "pending": 5
  },
  "ongoing": [
    {
      "request_id": "966db662-a4a9-43c6-8247-51c4216c7682",
      "status": "MATCHED",
      "service_type": "TRANSPORT",
      "farmer_name": "Test Farmer",
      "farmer_pincode": "411001",
      "estimated_price": 600.0,
      "created_at": "2026-03-01T09:20:37.322998Z",
      "matched_provider_id": "PRV_+919910890180"
    }
  ],
  "completed": [],
  "pending": []
}
```

**Categories**:
- **Ongoing**: MATCHED, NOTIFYING
- **Completed**: COMPLETED
- **Pending**: PENDING, NO_PROVIDERS_FOUND

**Sorting**: Most recent first

**Examples**:
```bash
# Get all requests
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/farmer-requests/+919910890180"

# Get only completed
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/farmer-requests/+919910890180?status=COMPLETED"
```

---

### 9. Get Provider Jobs

Get all jobs assigned to a provider.

**Endpoint**: `GET /provider-jobs/{provider_id}`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| provider_id | string | Yes | Provider's ID |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status |

**Success Response** (200):
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
  "ongoing": [
    {
      "request_id": "966db662-a4a9-43c6-8247-51c4216c7682",
      "status": "MATCHED",
      "service_type": "TRANSPORT",
      "farmer_id": "+919910890180",
      "farmer_name": "Test Farmer",
      "farmer_pincode": "411001",
      "estimated_price": 600.0,
      "created_at": "2026-03-01T09:20:37.322998Z"
    }
  ],
  "completed": []
}
```

**Error Response** (404):
```json
{
  "error": "Provider not found"
}
```

**Categories**:
- **Ongoing**: MATCHED
- **Completed**: COMPLETED

**Sorting**: Most recent first

**Examples**:
```bash
# Get all jobs
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/provider-jobs/PRV_+919910890180"

# Get only completed
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/provider-jobs/PRV_+919910890180?status=COMPLETED"
```

---

### 10. SMS Reply Webhook

Twilio webhook to handle incoming SMS replies.

**Endpoint**: `POST /sms-reply`

**Request** (URL-encoded form data from Twilio):
```
From=+919910890180&Body=YES&MessageSid=SM...
```

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| From | string | Provider's phone number |
| Body | string | SMS message text |
| MessageSid | string | Twilio message ID |

**Success Response** (200 - TwiML):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>
```

**Error Response** (200 - TwiML with message):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Reply YES to accept a request.</Message>
</Response>
```

**Accepted Keywords**:
- YES
- ACCEPT
- Y
- OK

**What Happens**:
1. Twilio receives SMS from provider
2. Calls this webhook
3. Lambda extracts provider phone
4. Finds provider in database
5. Finds latest NOTIFYING request
6. Accepts request atomically
7. Sends confirmations to both parties
8. Returns TwiML response to Twilio

**Configuration**:

Set in Twilio Console:
1. Go to Phone Numbers → Active Numbers
2. Click on +16187025334
3. Under "Messaging Configuration"
4. Set "A MESSAGE COMES IN" to:
   - Webhook (POST)
   - URL: https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/sms-reply

**Note**: Requires paid Twilio account to receive international SMS. Use test endpoint for trial account.

---

## Complete Flow Example

### Scenario: Farmer Requests Tractor Service

**Step 1: Create Request**
```bash
curl -X POST https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/request \
  -H 'Content-Type: application/json' \
  -d '{
    "farmer_id": "+919910890180",
    "farmer_name": "Rajesh Sharma",
    "service_type": "TRACTOR",
    "farmer_pincode": "411001",
    "estimated_price": 500
  }'
```

Response:
```json
{
  "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
  "status": "PENDING"
}
```

**Step 2: System Sends SMS to Providers**

SMS to top 3 providers:
```
Helping Hand: New TRACTOR request from Rajesh Sharma in 411001.
Price: Rs500. Reply YES to accept. ID: a6706841
```

**Step 3: Provider Accepts**

Option A - SMS Reply:
```
YES
```

Option B - Test Endpoint:
```bash
curl -X POST https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/test-accept \
  -H 'Content-Type: application/json' \
  -d '{"provider_phone": "+919910890180"}'
```

**Step 4: Confirmations Sent**

To Provider:
```
Request accepted! Farmer: Rajesh Sharma, Phone: +919910890180,
Location: 411001. ID: a6706841
```

To Farmer:
```
Helping Hand: Ramesh Kumar accepted your request!
Rating: 4.8 stars. Call: +919910890180. ID: a6706841
```

**Step 5: Check Status**
```bash
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/status/a6706841-c5e1-4fb9-b973-4a606a24986e"
```

Response:
```json
{
  "status": "MATCHED",
  "provider": {
    "name": "Ramesh Kumar",
    "phone": "+919910890180",
    "rating": 4.8
  }
}
```

**Step 6: Complete & Rate**
```bash
curl -X POST https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/complete \
  -H 'Content-Type: application/json' \
  -d '{
    "request_id": "a6706841-c5e1-4fb9-b973-4a606a24986e",
    "rating": 5,
    "feedback": "Excellent service!"
  }'
```

---

## Rate Limiting

Currently no rate limiting. For production:
- Implement API Gateway throttling
- Set per-user limits
- Add DDoS protection via AWS WAF

## CORS

CORS is enabled for all origins. For production:
- Restrict to specific domains
- Configure allowed methods
- Set appropriate headers

## Monitoring

Monitor via CloudWatch:
- API Gateway metrics
- Lambda invocations and errors
- DynamoDB read/write capacity
- SMS delivery rates

## Testing

### Postman Collection

Import: `postman/HelpingHand_Complete.postman_collection.json`

### Test Script

```bash
./test_sms_reply_workaround.sh
```

---

**Version**: 1.0  
**Last Updated**: March 1, 2026  
**Base URL**: https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod
