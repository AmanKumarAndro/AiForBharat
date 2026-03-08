# Architecture Documentation

## System Overview

The Master Analytics API is a serverless application built on AWS that aggregates data from multiple DynamoDB tables to provide unified analytics for the KisanVoice platform.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│                    (HTTP API - REST)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      AWS Lambda                                  │
│                  (Node.js 18.x Runtime)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              src/index.js (Handler)                       │  │
│  │              - Route Management                           │  │
│  │              - Request Orchestration                      │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                  │
│  ┌────────────▼─────────────────────────────────────────────┐  │
│  │           Service Layer                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │ aggregator.js│  │ features.js  │  │ dynamodb.js  │   │  │
│  │  │              │  │              │  │              │   │  │
│  │  │ High-level   │  │ Feature      │  │ Low-level    │   │  │
│  │  │ aggregation  │  │ specific     │  │ DB ops       │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────▼──────────────────────────────┐  │
│  │              Utils Layer                                  │  │
│  │              - Response formatting                        │  │
│  │              - Error handling                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ AWS SDK
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      DynamoDB Tables                             │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Authentication   │  │  Voice AI        │  │ Helping Hand │ │
│  │ - Farmers        │  │  - Sessions      │  │ - Requests   │ │
│  └──────────────────┘  └──────────────────┘  │ - Providers  │ │
│                                               │ - Treatments │ │
│  ┌──────────────────┐  ┌──────────────────┐  │ - Pesticides │ │
│  │ Irrigation       │  │  Geographic      │  │ - KVK        │ │
│  │ - Farmers        │  │  - Pincodes      │  │ - Mappings   │ │
│  │ - Crops          │  │  - Locations     │  └──────────────┘ │
│  │ - Monsoon        │  └──────────────────┘                    │
│  │ - Savings        │                                           │
│  │ - SMS Log        │                                           │
│  │ - Soil State     │                                           │
│  └──────────────────┘                                           │
└──────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. API Gateway Layer

**Technology:** AWS API Gateway (HTTP API)

**Responsibilities:**
- HTTP request routing
- Request/response transformation
- Protocol handling (HTTP → Lambda event)

**Configuration:**
- Method: GET only
- Path pattern: `/dashboard/{proxy+}`
- Integration: Lambda proxy integration

### 2. Lambda Function Layer

**Technology:** AWS Lambda (Node.js 18.x)

**Configuration:**
- Memory: 512 MB
- Timeout: 10 seconds
- Runtime: Node.js 18.x
- Region: ap-south-1 (Mumbai)

**Responsibilities:**
- Request routing
- Business logic execution
- Response formatting
- Error handling

### 3. Service Layer

#### 3.1 Handler Module (`src/index.js`)

**Purpose:** Main entry point and router

**Key Functions:**
- Route matching and dispatching
- Handler function orchestration
- Top-level error handling

**Routes Mapping:**
```javascript
/dashboard/overview        → handleOverview()
/dashboard/activity        → handleActivity()
/dashboard/farmers         → handleFarmers()
/dashboard/ai-usage        → handleAIUsage()
/dashboard/alerts          → handleAlerts()
/dashboard/services        → handleServices()
/dashboard/features        → handleAllFeatures()
/dashboard/features/*      → Feature-specific handlers
/dashboard/users           → handleAllUsers()
```

#### 3.2 Features Service (`src/services/features.js`)

**Purpose:** Feature-specific data aggregation

**Key Responsibilities:**
- DynamoDB table scanning
- Data transformation and aggregation
- Statistical calculations
- Multi-source data merging

**Key Methods:**
- `getAllFeatures()` - Master aggregator
- `getVoiceAISessions()` - Voice AI analytics
- `getServiceRequests()` - Service platform data
- `getIrrigationFarmers()` - Irrigation system data
- `getAllLoggedInUsers()` - User deduplication

**Helper Functions:**
- `groupBy()` - Group items by field
- `getTopItems()` - Extract top N items
- `getUniqueValues()` - Deduplicate values
- `calculateAverage()` - Statistical average

#### 3.3 DynamoDB Service (`src/services/dynamodb.js`)

**Purpose:** Low-level database operations

**Key Methods:**
- `getTableCount()` - Total record count
- `getTodayCount()` - Today's records with date field flexibility
- `getRecentActivity()` - Activity feed generation
- `getFarmersByState()` - Geographic aggregation
- `getTopQueries()` - Query frequency analysis

**Features:**
- Graceful error handling
- Multiple date field support
- Configurable table names via environment

#### 3.4 Aggregator Service (`src/services/aggregator.js`)

**Purpose:** High-level cross-feature aggregation

**Responsibilities:**
- Combine data from multiple services
- Calculate derived metrics
- Generate dashboard overview

#### 3.5 Response Utilities (`src/utils/response.js`)

**Purpose:** Standardized HTTP responses

**Functions:**
- `success(data)` - 200 OK response
- `error(message, code)` - Error response

**Response Format:**
```javascript
{
  statusCode: 200|400|404|405|500,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}
```

### 4. Data Layer

#### DynamoDB Tables

**Authentication System:**
- `kisanvoice-auth-api-dev-farmers` - User profiles and authentication

**Voice AI System:**
- `farmer-voice-ai-dev-sessions` - AI interaction logs

**Helping Hand System:**
- `HH_Requests` - Service requests
- `HH_Providers` - Service provider directory
- `HH_TreatmentDB` - Crop treatment database
- `HH_BannedPesticides` - Banned pesticide registry
- `HH_KVKContacts` - Agricultural center contacts
- `HH_PincodeMappings` - Geographic location mappings

**Irrigation System:**
- `kisanvoice-irrigation-dev-farmers` - Irrigation user profiles
- `kisanvoice-irrigation-dev-crop-data` - Crop information
- `kisanvoice-irrigation-dev-monsoon-calendar` - Monsoon schedules
- `kisanvoice-irrigation-dev-savings` - Water savings tracking
- `kisanvoice-irrigation-dev-sms-log` - SMS notification logs
- `kisanvoice-irrigation-dev-soil-state` - Soil moisture data

## Data Flow

### Request Flow

```
1. Client Request
   ↓
2. API Gateway (Route validation)
   ↓
3. Lambda Handler (Route matching)
   ↓
4. Handler Function (Business logic)
   ↓
5. Service Layer (Data fetching)
   ↓
6. DynamoDB (Data retrieval)
   ↓
7. Service Layer (Data transformation)
   ↓
8. Handler Function (Response preparation)
   ↓
9. Utils (Response formatting)
   ↓
10. API Gateway (HTTP response)
    ↓
11. Client Response
```

### Example: `/dashboard/features` Request

```
1. GET /dashboard/features
   ↓
2. API Gateway → Lambda Event
   ↓
3. index.handler() → Route: /dashboard/features
   ↓
4. handleAllFeatures()
   ↓
5. features.getAllFeatures()
   ↓
6. Promise.all([
     getVoiceAISessions(),
     getServiceRequests(),
     getProviders(),
     getTreatmentDatabase(),
     getBannedPesticides(),
     getKVKContacts(),
     getPincodeMappings(),
     getFarmers(),
     getCropData(),
     getIrrigationFarmers(),
     getMonsoonCalendar(),
     getSavings(),
     getSMSLog(),
     getSoilState()
   ])
   ↓
7. 14 parallel DynamoDB Scan operations
   ↓
8. Data aggregation and transformation
   ↓
9. success(aggregatedData)
   ↓
10. JSON response with 200 status
```

## Design Patterns

### 1. Layered Architecture

**Presentation Layer:** API Gateway
**Business Logic Layer:** Lambda handlers and services
**Data Access Layer:** DynamoDB service
**Data Layer:** DynamoDB tables

### 2. Service-Oriented Design

Each service module has a single responsibility:
- `features.js` - Feature data
- `dynamodb.js` - Database operations
- `aggregator.js` - Cross-feature aggregation

### 3. Error Handling Pattern

```javascript
try {
  // Operation
  return successData;
} catch (error) {
  console.error('Error:', error);
  return safeDefault; // Never throw, always return safe value
}
```

### 4. Parallel Execution Pattern

```javascript
const [data1, data2, data3] = await Promise.all([
  fetchData1(),
  fetchData2(),
  fetchData3()
]);
```

Benefits:
- Reduced latency
- Better resource utilization
- Improved throughput

### 5. Configuration Pattern

Environment-based configuration via `serverless.yml`:
```yaml
environment:
  TABLE_NAME: ${self:custom.tables.tableName}
```

## Scalability

### Horizontal Scaling

**Lambda Auto-scaling:**
- Automatic concurrent execution scaling
- No manual intervention required
- Scales to AWS account limits

**DynamoDB:**
- On-demand capacity mode (recommended)
- Auto-scales read/write capacity
- No capacity planning needed

### Performance Optimization

**Current Optimizations:**
1. Parallel Promise.all() for multi-table queries
2. Scan with COUNT select for count operations
3. Projection expressions to limit data transfer
4. Early return on errors with safe defaults

**Future Optimizations:**
1. Add DynamoDB DAX caching layer
2. Implement pagination for large datasets
3. Use Query instead of Scan where possible
4. Add CloudFront CDN for static responses
5. Implement response caching in Lambda

## Security Architecture

### IAM Role Permissions

**Principle of Least Privilege:**
```yaml
- Effect: Allow
  Action:
    - dynamodb:Scan
    - dynamodb:Query
    - dynamodb:GetItem
  Resource: [specific table ARNs]
```

**No Write Permissions:**
- Read-only access to all tables
- No delete or update capabilities

### Network Security

**Current State:**
- Public API endpoint
- No authentication
- No rate limiting

**Recommended Additions:**
1. API Gateway API keys
2. AWS WAF for DDoS protection
3. VPC integration for Lambda
4. Cognito for authentication
5. Rate limiting policies

## Monitoring & Observability

### CloudWatch Integration

**Automatic Metrics:**
- Lambda invocations
- Duration
- Error count
- Throttles
- Concurrent executions

**Custom Logs:**
- Request/response logging
- Error logging with stack traces
- Performance timing

### Recommended Monitoring

1. **CloudWatch Alarms:**
   - Error rate > 5%
   - Duration > 8 seconds
   - Throttles > 0

2. **CloudWatch Dashboards:**
   - Request volume
   - Latency percentiles (p50, p95, p99)
   - Error rates by endpoint

3. **X-Ray Tracing:**
   - End-to-end request tracing
   - Service map visualization
   - Performance bottleneck identification

## Deployment Architecture

### Infrastructure as Code

**Tool:** Serverless Framework

**Configuration:** `serverless.yml`

**Resources Created:**
- Lambda function
- IAM execution role
- API Gateway HTTP API
- CloudWatch Log Group
- CloudFormation stack

### Deployment Pipeline

```
1. Code changes
   ↓
2. npm install (dependencies)
   ↓
3. serverless package (bundle)
   ↓
4. CloudFormation change set
   ↓
5. Lambda function update
   ↓
6. API Gateway deployment
   ↓
7. Deployment complete
```

### Multi-Stage Strategy

**Stages:**
- `dev` - Development environment
- `staging` - Pre-production testing
- `prod` - Production environment

**Stage Isolation:**
- Separate Lambda functions
- Separate API endpoints
- Separate IAM roles
- Same DynamoDB tables (consider separate tables for prod)

## Disaster Recovery

### Backup Strategy

**DynamoDB:**
- Point-in-time recovery (enable recommended)
- On-demand backups
- Cross-region replication (for critical tables)

**Lambda:**
- Code stored in S3 by AWS
- Version management via Serverless Framework
- Git repository as source of truth

### Recovery Procedures

**Lambda Failure:**
1. Automatic retry by API Gateway
2. Redeploy from Git if needed
3. Rollback via CloudFormation

**DynamoDB Failure:**
1. AWS handles infrastructure failures
2. Restore from backup if data corruption
3. Failover to replica region if configured

## Cost Optimization

### Current Cost Drivers

1. **Lambda:**
   - Invocations: $0.20 per 1M requests
   - Duration: $0.0000166667 per GB-second

2. **DynamoDB:**
   - On-demand: $1.25 per million read requests
   - Storage: $0.25 per GB-month

3. **API Gateway:**
   - HTTP API: $1.00 per million requests

### Optimization Strategies

1. Reduce Lambda memory if possible
2. Implement caching to reduce DynamoDB reads
3. Use provisioned capacity for predictable workloads
4. Compress responses
5. Implement pagination to reduce data transfer

## Future Architecture Enhancements

### Short-term (1-3 months)

1. Add authentication layer (Cognito)
2. Implement API rate limiting
3. Add response caching
4. Set up CloudWatch alarms
5. Enable X-Ray tracing

### Medium-term (3-6 months)

1. Add DynamoDB DAX caching
2. Implement pagination
3. Add WebSocket support for real-time updates
4. Create separate read replicas
5. Add data export functionality

### Long-term (6-12 months)

1. Migrate to GraphQL API
2. Implement event-driven architecture
3. Add machine learning insights
4. Create data warehouse for analytics
5. Multi-region deployment
