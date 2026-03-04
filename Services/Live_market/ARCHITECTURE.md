# Architecture Documentation

## System Overview

The Commodity Market Analyzer is a serverless application built on AWS that provides AI-powered agricultural commodity market analysis.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser  │  iOS App  │  Android App  │  API Clients        │
└────────┬──────────────┬──────────────┬──────────────┬───────────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                            │
                    ┌───────▼────────┐
                    │  API Gateway   │
                    │   (REST API)   │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  AWS Lambda    │
                    │   Function     │
                    └───┬────────┬───┘
                        │        │
            ┌───────────┘        └───────────┐
            │                                │
    ┌───────▼────────┐            ┌─────────▼────────┐
    │  data.gov.in   │            │  Amazon Bedrock  │
    │      API       │            │   (Nova Model)   │
    └────────────────┘            └──────────────────┘
```

## Components

### 1. Frontend Layer

#### Web Application
- **Technology**: HTML5, CSS3, Vanilla JavaScript
- **Hosting**: AWS S3 Static Website
- **Features**:
  - Responsive design
  - Real-time data fetching
  - AI analysis display
  - Error handling

#### React Native Mobile App
- **Technology**: React Native, TypeScript
- **Platforms**: iOS, Android
- **Features**:
  - Type-safe API client
  - Custom React hooks
  - Offline support
  - Caching mechanism
  - Retry logic

### 2. API Layer

#### API Gateway
- **Type**: REST API
- **Endpoints**:
  - `POST /fetch` - Fetch raw commodity data
  - `POST /analyze` - Get AI-powered analysis
  - `OPTIONS /*` - CORS preflight
- **Features**:
  - CORS enabled
  - Request validation
  - Rate limiting
  - CloudWatch logging

### 3. Compute Layer

#### AWS Lambda Function
- **Runtime**: Python 3.13
- **Memory**: 512 MB
- **Timeout**: 60 seconds
- **Handler**: `lambda_function.lambda_handler`
- **Responsibilities**:
  - Request routing
  - Data fetching from external API
  - AI analysis orchestration
  - Response formatting
  - Error handling

### 4. AI Layer

#### Amazon Bedrock
- **Model**: Amazon Nova Micro v1.0
- **Type**: Foundation Model
- **Cost**: FREE (no charges)
- **Features**:
  - Natural language understanding
  - Market trend analysis
  - Price prediction
  - Recommendation generation

### 5. Data Layer

#### data.gov.in API
- **Dataset**: Agricultural Commodity Prices
- **Records**: 77.5M+
- **Update Frequency**: Daily
- **Coverage**: All Indian states and districts

## Data Flow

### Fetch Data Flow

```
1. User Request
   ↓
2. API Gateway receives POST /fetch
   ↓
3. Lambda function invoked
   ↓
4. Fetch data from data.gov.in API
   ↓
5. Format response
   ↓
6. Return to client
```

### Analyze Data Flow

```
1. User Request
   ↓
2. API Gateway receives POST /analyze
   ↓
3. Lambda function invoked
   ↓
4. Fetch data from data.gov.in API
   ↓
5. Prepare analysis prompt
   ↓
6. Send to Amazon Bedrock (Nova)
   ↓
7. Receive AI analysis
   ↓
8. Format response with metadata
   ↓
9. Return to client
```

## Infrastructure as Code

### AWS SAM Template

The entire infrastructure is defined in `template.yaml`:

```yaml
Resources:
  - Lambda Function (CommodityAnalyzerFunction)
  - API Gateway (ServerlessRestApi)
  - S3 Bucket (CommodityWebBucket)
  - IAM Roles (Bedrock permissions)
  - Bucket Policy (Public read access)
```

### Deployment Process

```
1. sam build
   - Packages Python dependencies
   - Prepares Lambda deployment package
   
2. sam deploy
   - Creates CloudFormation stack
   - Provisions all resources
   - Configures permissions
   - Outputs API endpoint
```

## Security Architecture

### Authentication & Authorization

- **API Gateway**: No authentication (public API)
- **Lambda**: IAM role with Bedrock permissions
- **Bedrock**: Invoked via IAM role
- **S3**: Public read access for static website

### IAM Permissions

```yaml
Lambda Execution Role:
  - bedrock:InvokeModel (for AI analysis)
  - logs:CreateLogGroup (for CloudWatch)
  - logs:CreateLogStream
  - logs:PutLogEvents
```

### Network Security

- **HTTPS Only**: All API calls encrypted in transit
- **CORS**: Configured for cross-origin requests
- **No VPC**: Lambda runs in AWS-managed VPC

## Scalability

### Auto-Scaling

- **Lambda**: Automatic scaling (up to 1000 concurrent executions)
- **API Gateway**: Unlimited requests (with throttling)
- **S3**: Unlimited storage and bandwidth

### Performance Optimization

- **Lambda Memory**: 512 MB (balanced cost/performance)
- **Lambda Timeout**: 60 seconds (handles slow API calls)
- **Bedrock Tokens**: 2000 max tokens (sufficient for analysis)

## Monitoring & Logging

### CloudWatch Logs

- **Lambda Logs**: All function executions
- **API Gateway Logs**: Request/response logging
- **Metrics**: Invocations, errors, duration

### Monitoring Dashboards

```
Metrics to Monitor:
- Lambda invocations
- Lambda errors
- Lambda duration
- API Gateway 4xx errors
- API Gateway 5xx errors
- Bedrock invocation count
```

## Disaster Recovery

### Backup Strategy

- **Code**: Version controlled in Git
- **Infrastructure**: Defined in SAM template
- **Data**: No persistent data (stateless)

### Recovery Process

```
1. Redeploy from Git repository
2. sam build && sam deploy
3. Update DNS/endpoints if needed
```

## Cost Architecture

### Cost Breakdown (10,000 requests/month)

```
Lambda:
- Requests: 10,000 × $0.0000002 = $0.002
- Duration: 10,000 × 3s × $0.0000166667 = $0.50
- Total: $0.50

API Gateway:
- Requests: 10,000 × $0.0000035 = $0.035
- Total: $0.035

Bedrock (Nova):
- Input tokens: FREE
- Output tokens: FREE
- Total: $0.00

S3:
- Storage: 1 MB × $0.023 = $0.023
- Requests: 10,000 × $0.0000004 = $0.004
- Total: $0.027

Monthly Total: ~$0.56
```

## Technology Stack Details

### Backend

```python
Language: Python 3.13
Framework: AWS Lambda
Dependencies:
  - boto3 (AWS SDK)
  - requests (HTTP client)
```

### Frontend (Web)

```javascript
Language: JavaScript (ES6+)
Framework: None (Vanilla JS)
Styling: CSS3 with Flexbox/Grid
```

### Frontend (Mobile)

```typescript
Language: TypeScript 4.0+
Framework: React Native
Dependencies:
  - @react-native-async-storage/async-storage (optional)
  - @react-native-community/netinfo (optional)
```

## Integration Points

### External APIs

1. **data.gov.in API**
   - Endpoint: `https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24`
   - Authentication: API Key
   - Rate Limit: 10 requests/minute (sample key)

2. **Amazon Bedrock**
   - Model: `amazon.nova-micro-v1:0`
   - API: `bedrock-runtime.invoke_model`
   - Region: `us-east-1`

## Deployment Environments

### Development

```
Local Development:
- Flask dev server (app.py)
- Local Python execution
- No AWS resources needed
```

### Production

```
AWS Resources:
- Lambda function in us-east-1
- API Gateway in us-east-1
- S3 bucket in us-east-1
- Bedrock in us-east-1
```

## File Structure

```
commodity-analyzer/
├── lambda_function.py          # Lambda handler
├── commodity_analyzer.py       # Core logic (standalone)
├── config.py                   # Configuration
├── template.yaml               # SAM template
├── requirements.txt            # Python dependencies
├── static/                     # Web frontend
│   ├── css/style.css
│   └── js/app.js
├── templates/
│   └── index.html
└── react-native/               # Mobile integration
    ├── types.ts
    ├── api.ts
    ├── hooks.ts
    ├── CommodityScreen.tsx
    └── advanced-features.tsx
```

## API Request/Response Flow

### Request Processing

```python
1. API Gateway receives request
2. Lambda handler invoked with event
3. Parse request body/query parameters
4. Validate action type (fetch/analyze)
5. Call appropriate function
6. Return formatted response
```

### Error Handling

```python
Try-Catch Blocks:
- API request errors (timeout, 429, etc.)
- Bedrock invocation errors
- JSON parsing errors
- General exceptions

Error Response Format:
{
  "success": false,
  "error": "Error message"
}
```

## Performance Characteristics

### Latency

```
Fetch Endpoint:
- API Gateway: ~10ms
- Lambda cold start: ~500ms
- Lambda warm: ~50ms
- data.gov.in API: ~1-2s
- Total: ~1.5-2.5s

Analyze Endpoint:
- API Gateway: ~10ms
- Lambda cold start: ~500ms
- Lambda warm: ~50ms
- data.gov.in API: ~1-2s
- Bedrock inference: ~2-3s
- Total: ~3.5-5.5s
```

### Throughput

```
Concurrent Requests: Up to 1000
Requests per Second: ~100-200
Daily Capacity: 8.6M requests
```

## Future Architecture Considerations

### Potential Enhancements

1. **Caching Layer**: Add ElastiCache for frequently accessed data
2. **Database**: Add DynamoDB for user preferences
3. **Authentication**: Add Cognito for user management
4. **CDN**: Add CloudFront for global distribution
5. **Queue**: Add SQS for async processing
6. **Batch Processing**: Add Step Functions for complex workflows

### Scalability Improvements

1. **Regional Deployment**: Multi-region for lower latency
2. **Edge Computing**: Lambda@Edge for global performance
3. **Data Pipeline**: Kinesis for real-time data streaming
4. **Analytics**: Athena for query analysis

---

This architecture provides a scalable, cost-effective, and maintainable solution for commodity market analysis with AI-powered insights.
