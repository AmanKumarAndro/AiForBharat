# Technical Specification

## 1. System Requirements

### 1.1 Functional Requirements

**FR-1: Phone Authentication**
- System must send OTP to valid phone numbers
- OTP must be 6 digits and expire after 10 minutes
- Maximum 3 OTP attempts per 5 minutes per phone number
- Support E.164 phone number format

**FR-2: Token Management**
- Generate JWT tokens upon successful OTP verification
- Tokens must expire after 7 days
- Tokens must contain user phone number
- Support token validation on protected routes

**FR-3: User Profile Management**
- Create user record on first successful login
- Support profile completion with required fields
- Track profile completion status
- Allow profile retrieval for authenticated users

**FR-4: User Types**
- Support two user types: "farmer" and "provider"
- Validate user type during onboarding
- Store user type in profile

### 1.2 Non-Functional Requirements

**NFR-1: Performance**
- API response time < 2 seconds (95th percentile)
- Support concurrent users up to 10,000
- Lambda cold start < 1 second

**NFR-2: Scalability**
- Auto-scale Lambda functions based on demand
- DynamoDB on-demand capacity for automatic scaling
- Support 1M+ users

**NFR-3: Security**
- All API calls over HTTPS
- JWT tokens signed with HS256 algorithm
- Secrets stored in AWS Parameter Store
- Input validation on all endpoints

**NFR-4: Availability**
- 99.9% uptime SLA
- Multi-AZ deployment via AWS
- Automatic failover for DynamoDB

**NFR-5: Cost Efficiency**
- Serverless architecture for pay-per-use
- On-demand DynamoDB billing
- Minimal Lambda memory allocation

## 2. Data Models

### 2.1 User Profile Schema

```javascript
{
  // Primary Key
  phone: String,              // Format: +[country_code][number]
  
  // Profile Information
  name: String,               // User's full name
  userType: String,           // Enum: "farmer" | "provider"
  
  // Location Data
  totalLandArea: Number,      // In acres, positive number
  latitude: Number,           // Decimal degrees (-90 to 90)
  longitude: Number,          // Decimal degrees (-180 to 180)
  city: String,               // City name
  state: String,              // State name
  
  // System Fields
  isProfileComplete: Boolean, // Profile completion status
  language: String,           // Default: "hi" (Hindi)
  createdAt: String,          // ISO 8601 timestamp
  updatedAt: String           // ISO 8601 timestamp
}
```

### 2.2 JWT Payload Schema

```javascript
{
  phone: String,              // User's phone number
  iat: Number,                // Issued at (Unix timestamp)
  exp: Number                 // Expiration (Unix timestamp)
}
```

## 3. API Specifications

### 3.1 Send OTP

**Endpoint**: `POST /auth/send-otp`

**Input Validation**:
- `phone`: Required, must match regex `^\+\d{10,15}$`

**Business Logic**:
1. Validate phone number format
2. Call Twilio Verify API to send OTP
3. Return success response

**Error Handling**:
- Invalid phone format → 400 Bad Request
- Twilio API failure → 500 Internal Server Error

### 3.2 Verify OTP

**Endpoint**: `POST /auth/verify-otp`

**Input Validation**:
- `phone`: Required, string
- `otp`: Required, string (6 digits)

**Business Logic**:
1. Validate input fields
2. Verify OTP with Twilio Verify API
3. Check if user exists in DynamoDB
4. If new user, create record with default values
5. Generate JWT token with 7-day expiry
6. Return token and profile completion status

**Error Handling**:
- Missing fields → 400 Bad Request
- Invalid OTP → 400 Bad Request
- Database error → 500 Internal Server Error

### 3.3 Onboard User

**Endpoint**: `POST /farmer/onboard`

**Authentication**: Required (JWT in Authorization header)

**Input Validation**:
- `name`: Required, string, non-empty
- `userType`: Required, enum ["farmer", "provider"]
- `totalLandArea`: Required, number, > 0
- `latitude`: Required, number, -90 to 90
- `longitude`: Required, number, -180 to 180
- `city`: Required, string, non-empty
- `state`: Required, string, non-empty

**Business Logic**:
1. Validate JWT token
2. Extract phone from token
3. Validate all input fields
4. Update user profile in DynamoDB
5. Set `isProfileComplete` to true
6. Update `updatedAt` timestamp
7. Return success response

**Error Handling**:
- Missing/invalid token → 401 Unauthorized
- Missing fields → 400 Bad Request
- Invalid userType → 400 Bad Request
- Invalid totalLandArea → 400 Bad Request
- Database error → 500 Internal Server Error

### 3.4 Get Profile

**Endpoint**: `GET /farmer/profile`

**Authentication**: Required (JWT in Authorization header)

**Business Logic**:
1. Validate JWT token
2. Extract phone from token
3. Query DynamoDB for user record
4. Return user profile

**Error Handling**:
- Missing/invalid token → 401 Unauthorized
- User not found → 404 Not Found
- Database error → 500 Internal Server Error

## 4. Security Specifications

### 4.1 Authentication Flow

```
1. Client → API: Send OTP request with phone
2. API → Twilio: Initiate verification
3. Twilio → User: Send SMS with OTP
4. User → Client: Enter OTP
5. Client → API: Verify OTP request
6. API → Twilio: Verify OTP
7. Twilio → API: Verification result
8. API → DynamoDB: Create/retrieve user
9. API → Client: Return JWT token
10. Client: Store token securely
11. Client → API: Include token in subsequent requests
12. API: Validate token and process request
```

### 4.2 JWT Configuration

- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiry**: 7 days (604800 seconds)
- **Secret**: Stored in AWS Parameter Store
- **Payload**: Minimal (phone number only)

### 4.3 Input Validation Rules

**Phone Number**:
- Pattern: `^\+\d{10,15}$`
- Must start with `+`
- Must contain 10-15 digits after country code

**User Type**:
- Allowed values: "farmer", "provider"
- Case-sensitive

**Land Area**:
- Type: Number
- Constraint: > 0
- Unit: Acres

**Coordinates**:
- Latitude: -90 to 90
- Longitude: -180 to 180
- Type: Number (decimal degrees)

## 5. Database Specifications

### 5.1 DynamoDB Table

**Table Name**: `kisanvoice-auth-api-{stage}-farmers`

**Capacity Mode**: On-demand (PAY_PER_REQUEST)

**Key Schema**:
- Partition Key: `phone` (String)
- Sort Key: None

**Attributes**:
- All attributes defined in User Profile Schema (Section 2.1)

**Indexes**: None (single-item access pattern)

**TTL**: Not configured (users persist indefinitely)

### 5.2 Access Patterns

**AP-1: Get User by Phone**
- Operation: GetItem
- Key: `{ phone: "+919876543210" }`
- Use Case: Profile retrieval, login verification

**AP-2: Create User**
- Operation: PutItem
- Use Case: First-time login

**AP-3: Update User Profile**
- Operation: UpdateItem
- Key: `{ phone: "+919876543210" }`
- Use Case: Profile onboarding

## 6. External Service Integration

### 6.1 Twilio Verify API

**Service**: Twilio Verify v2

**Operations**:

**Send Verification**:
- Endpoint: `POST /v2/Services/{ServiceSid}/Verifications`
- Parameters: `to` (phone), `channel` (sms)
- Response: Verification SID, status

**Check Verification**:
- Endpoint: `POST /v2/Services/{ServiceSid}/VerificationCheck`
- Parameters: `to` (phone), `code` (OTP)
- Response: Status ("approved" or "pending")

**Rate Limits**:
- 3 attempts per 5 minutes per phone number
- Enforced by Twilio

### 6.2 AWS Services

**Lambda**:
- Runtime: Node.js 18.x
- Memory: 256 MB (configurable)
- Timeout: 30 seconds
- Concurrency: Unreserved (auto-scaling)

**API Gateway**:
- Type: REST API
- Protocol: HTTPS only
- CORS: Enabled for all origins

**DynamoDB**:
- Encryption: AWS managed keys
- Backup: Point-in-time recovery (optional)
- Streams: Disabled

**Parameter Store**:
- Type: SecureString
- Encryption: AWS KMS
- Access: IAM role-based

## 7. Error Handling

### 7.1 Error Response Format

```javascript
{
  success: false,
  message: "Error description"
}
```

### 7.2 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (invalid/missing token) |
| 404 | Not Found (user doesn't exist) |
| 500 | Internal Server Error |

### 7.3 Error Logging

- All errors logged to CloudWatch Logs
- Include error message, stack trace, request ID
- No sensitive data in logs (phone numbers masked)

## 8. Performance Specifications

### 8.1 Response Time Targets

| Endpoint | Target (p95) | Target (p99) |
|----------|--------------|--------------|
| Send OTP | 1.5s | 2.5s |
| Verify OTP | 2.0s | 3.0s |
| Onboard | 1.0s | 1.5s |
| Get Profile | 0.5s | 1.0s |

### 8.2 Throughput Targets

- Concurrent requests: 10,000
- Requests per second: 1,000
- Daily active users: 100,000

## 9. Deployment Specifications

### 9.1 Infrastructure as Code

**Tool**: Serverless Framework v3

**Configuration File**: `serverless.yml`

**Deployment Command**: `serverless deploy --stage {stage}`

### 9.2 Environment Stages

| Stage | Purpose | AWS Account |
|-------|---------|-------------|
| dev | Development and testing | Development |
| prod | Production traffic | Production |

### 9.3 CI/CD Pipeline (Recommended)

```
Code Commit → Lint → Unit Tests → Deploy to Dev → Integration Tests → Manual Approval → Deploy to Prod
```

## 10. Monitoring & Alerting

### 10.1 Metrics to Track

**Lambda Metrics**:
- Invocations
- Errors
- Duration
- Throttles

**API Gateway Metrics**:
- Request count
- 4xx errors
- 5xx errors
- Latency

**DynamoDB Metrics**:
- Read/write capacity
- Throttled requests
- System errors

**Custom Metrics**:
- OTP success rate
- Profile completion rate
- Token generation rate

### 10.2 Recommended Alarms

- Lambda error rate > 5%
- API Gateway 5xx errors > 10 in 5 minutes
- DynamoDB throttling events > 0
- Twilio API failures > 5 in 5 minutes

## 11. Testing Requirements

### 11.1 Unit Tests

- Test all utility functions
- Mock external dependencies (Twilio, DynamoDB)
- Code coverage > 80%

### 11.2 Integration Tests

- Test complete authentication flow
- Test profile onboarding flow
- Test error scenarios
- Use test phone numbers (Twilio test credentials)

### 11.3 Load Tests

- Simulate 1,000 concurrent users
- Test auto-scaling behavior
- Measure response times under load

## 12. Compliance & Standards

### 12.1 Data Privacy

- Store minimal user data
- No PII beyond phone number and name
- Support data deletion (GDPR right to be forgotten)

### 12.2 API Standards

- RESTful design principles
- JSON request/response format
- Consistent error response structure
- Semantic HTTP status codes

### 12.3 Security Standards

- OWASP Top 10 compliance
- Input validation on all endpoints
- Secure secret management
- HTTPS only
