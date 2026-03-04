# Technical Specification

## Project Information

**Project Name**: Commodity Market Analyzer  
**Version**: 1.0.0  
**Last Updated**: March 4, 2026  
**Status**: Production Ready

## Executive Summary

A serverless application that provides AI-powered analysis of Indian agricultural commodity market data. Built on AWS Lambda with Amazon Bedrock integration, supporting web and mobile platforms.

## Functional Requirements

### FR1: Data Fetching
- **ID**: FR1
- **Priority**: High
- **Description**: Fetch commodity market data from data.gov.in API
- **Inputs**: State, district, commodity, limit
- **Outputs**: JSON array of commodity records
- **Acceptance Criteria**:
  - Support filtering by state, district, commodity
  - Return up to specified limit of records
  - Handle API rate limits gracefully
  - Return total record count

### FR2: AI Analysis
- **ID**: FR2
- **Priority**: High
- **Description**: Generate AI-powered market analysis using Amazon Bedrock
- **Inputs**: Commodity data, analysis parameters
- **Outputs**: Structured market analysis with recommendations
- **Acceptance Criteria**:
  - Analyze price trends
  - Provide buy/sell recommendations
  - Identify market opportunities
  - Assess risk levels
  - Format output in readable sections

### FR3: Web Interface
- **ID**: FR3
- **Priority**: Medium
- **Description**: Provide web-based user interface
- **Inputs**: User search criteria
- **Outputs**: Visual display of data and analysis
- **Acceptance Criteria**:
  - Responsive design
  - Search form with filters
  - Display raw data in tables
  - Display AI analysis in formatted text
  - Show loading states
  - Handle errors gracefully

### FR4: Mobile Integration
- **ID**: FR4
- **Priority**: Medium
- **Description**: Provide React Native components for mobile apps
- **Inputs**: API endpoint configuration
- **Outputs**: Reusable TypeScript components
- **Acceptance Criteria**:
  - Type-safe API client
  - React hooks for data fetching
  - Complete screen component
  - Offline support
  - Caching mechanism
  - Retry logic

## Non-Functional Requirements

### NFR1: Performance
- **Response Time**: 
  - Fetch endpoint: < 3 seconds
  - Analyze endpoint: < 6 seconds
- **Throughput**: Support 100+ concurrent requests
- **Cold Start**: < 1 second for Lambda

### NFR2: Scalability
- **Horizontal Scaling**: Auto-scale to 1000 concurrent Lambda executions
- **Data Volume**: Handle 77.5M+ records
- **User Load**: Support unlimited users (API Gateway)

### NFR3: Availability
- **Uptime**: 99.9% (AWS SLA)
- **Recovery Time**: < 5 minutes
- **Backup**: Infrastructure as code (SAM template)

### NFR4: Security
- **Encryption**: HTTPS for all API calls
- **Authentication**: IAM roles for AWS services
- **Authorization**: Bedrock invoke permissions
- **Data Privacy**: No PII storage

### NFR5: Cost
- **Target**: < $5/month for 10,000 requests
- **Optimization**: Use FREE Amazon Nova model
- **Monitoring**: CloudWatch for cost tracking

### NFR6: Maintainability
- **Code Quality**: Type hints, docstrings
- **Documentation**: Comprehensive docs
- **Version Control**: Git repository
- **Infrastructure**: Declarative SAM template

## Technical Specifications

### Backend Specifications

#### Lambda Function
```yaml
Runtime: python3.13
Memory: 512 MB
Timeout: 60 seconds
Handler: lambda_function.lambda_handler
Environment Variables:
  - API_KEY: data.gov.in API key
  - BEDROCK_MODEL_ID: amazon.nova-micro-v1:0
```

#### Python Dependencies
```
requests>=2.31.0
boto3>=1.34.0
```

#### API Endpoints

**POST /fetch**
```typescript
Request:
{
  state?: string;
  district?: string;
  commodity?: string;
  limit?: number;
  action: "fetch";
}

Response:
{
  success: boolean;
  data: {
    total: number;
    count: number;
    limit: number;
    offset: number;
    records: CommodityRecord[];
  }
}
```

**POST /analyze**
```typescript
Request:
{
  state?: string;
  district?: string;
  commodity?: string;
  limit?: number;
  action: "analyze";
}

Response:
{
  success: boolean;
  data: {
    metadata: {
      state: string | null;
      district: string | null;
      commodity: string | null;
      total_records: number;
      analyzed_records: number;
      timestamp: string;
    };
    analysis: string;
  }
}
```

### Frontend Specifications

#### Web Application
```yaml
Technology: HTML5, CSS3, JavaScript ES6+
Hosting: AWS S3 Static Website
Files:
  - templates/index.html
  - static/css/style.css
  - static/js/app.js
Features:
  - Responsive design (mobile-first)
  - Form validation
  - Loading indicators
  - Error messages
  - Result display
```

#### React Native Components
```yaml
Language: TypeScript 4.0+
Framework: React Native
Files:
  - types.ts (Type definitions)
  - api.ts (API client)
  - hooks.ts (React hooks)
  - CommodityScreen.tsx (Main component)
  - advanced-features.tsx (Caching, offline)
Dependencies:
  - @react-native-async-storage/async-storage (optional)
  - @react-native-community/netinfo (optional)
```

### Data Specifications

#### CommodityRecord Type
```typescript
interface CommodityRecord {
  State: string;              // State name
  District: string;           // District name
  Market: string;             // Market name
  Commodity: string;          // Commodity name
  Variety: string;            // Variety/type
  Grade: string;              // Quality grade
  Arrival_Date: string;       // Format: DD/MM/YYYY
  Min_Price: string;          // Minimum price (INR/quintal)
  Max_Price: string;          // Maximum price (INR/quintal)
  Modal_Price: string;        // Most common price (INR/quintal)
  Commodity_Code: string;     // Unique commodity code
}
```

#### Analysis Response Type
```typescript
interface AnalysisMetadata {
  state: string | null;
  district: string | null;
  commodity: string | null;
  total_records: number;
  analyzed_records: number;
  timestamp: string;          // ISO 8601 format
}

interface AnalysisData {
  metadata: AnalysisMetadata;
  analysis: string;           // Formatted text analysis
}
```

### AI Model Specifications

#### Amazon Bedrock Configuration
```yaml
Model: amazon.nova-micro-v1:0
Region: us-east-1
API: bedrock-runtime.invoke_model
Request Format:
  messages:
    - role: user
      content:
        - text: <prompt>
  inferenceConfig:
    maxTokens: 2000
    temperature: 0.7
Response Format:
  output:
    message:
      content:
        - text: <analysis>
```

#### Prompt Template
```
Analyze the following agricultural commodity market data and provide insights:

Total Records: {total}
Records Analyzed: {count}

Data Sample:
{json_data}

Please provide:
1. Price Trend Analysis: Identify commodities with rising or falling prices
2. Market Recommendations: Which commodities are good for buying/selling
3. Regional Insights: Price variations across different markets
4. Best Opportunities: Top 3 commodities with best price potential
5. Risk Assessment: Commodities with high price volatility

Format your response in clear sections with actionable recommendations.
```

### Infrastructure Specifications

#### AWS Resources
```yaml
CloudFormation Stack:
  - Lambda Function
  - API Gateway (REST API)
  - S3 Bucket (Static Website)
  - IAM Role (Lambda Execution)
  - Bucket Policy (Public Read)

Outputs:
  - ApiEndpoint: API Gateway URL
  - WebsiteURL: S3 Website URL
  - BucketName: S3 Bucket Name
```

#### IAM Permissions
```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel",
    "logs:CreateLogGroup",
    "logs:CreateLogStream",
    "logs:PutLogEvents"
  ],
  "Resource": "*"
}
```

## Integration Specifications

### External API Integration

#### data.gov.in API
```yaml
Base URL: https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24
Authentication: API Key (query parameter)
Rate Limit: 10 requests/minute (sample key)
Response Format: JSON
Timeout: 30 seconds
```

#### Request Parameters
```
api-key: string (required)
format: "json" (required)
limit: number (optional, default: 100)
filters[State]: string (optional)
filters[District]: string (optional)
filters[Commodity]: string (optional)
```

### AWS Service Integration

#### Bedrock Integration
```python
import boto3
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

response = bedrock.invoke_model(
    modelId='amazon.nova-micro-v1:0',
    body=json.dumps({
        "messages": [{
            "role": "user",
            "content": [{"text": prompt}]
        }],
        "inferenceConfig": {
            "maxTokens": 2000,
            "temperature": 0.7
        }
    })
)
```

## Error Handling Specifications

### Error Types

#### API Errors
```python
- requests.exceptions.Timeout: 30 second timeout
- requests.exceptions.HTTPError: HTTP 4xx/5xx errors
- requests.exceptions.ConnectionError: Network issues
```

#### Bedrock Errors
```python
- botocore.exceptions.ClientError: Bedrock API errors
- json.JSONDecodeError: Response parsing errors
```

#### Application Errors
```python
- ValueError: Invalid input parameters
- KeyError: Missing required fields
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes
```
200: Success
400: Bad Request (invalid parameters)
429: Too Many Requests (rate limit)
500: Internal Server Error
```

## Testing Specifications

### Unit Tests
```python
test_lambda.py:
  - test_fetch_endpoint()
  - test_analyze_endpoint()
  - test_cors_headers()
  - test_error_handling()

test_nova.py:
  - test_bedrock_connection()
  - test_model_availability()
  - test_response_format()
```

### Integration Tests
```python
test_bedrock_only.py:
  - test_nova_model()
  - test_prompt_formatting()
  - test_response_parsing()
```

### Test Data
```json
{
  "state": "Maharashtra",
  "district": "Pune",
  "commodity": "Onion",
  "limit": 10,
  "action": "fetch"
}
```

## Deployment Specifications

### Build Process
```bash
sam build
  - Resolves Python dependencies
  - Packages Lambda code
  - Validates SAM template
```

### Deployment Process
```bash
sam deploy --guided
  - Creates CloudFormation stack
  - Provisions AWS resources
  - Configures permissions
  - Outputs endpoints
```

### Configuration Parameters
```yaml
Stack Name: commodity-analyzer
AWS Region: us-east-1
API Key: YOUR_DATA_GOV_API_KEY
Bedrock Model: amazon.nova-micro-v1:0
```

## Monitoring Specifications

### CloudWatch Metrics
```
Lambda Metrics:
  - Invocations
  - Errors
  - Duration
  - Throttles
  - ConcurrentExecutions

API Gateway Metrics:
  - Count (requests)
  - 4XXError
  - 5XXError
  - Latency
  - IntegrationLatency
```

### CloudWatch Logs
```
Log Groups:
  - /aws/lambda/commodity-analyzer-CommodityAnalyzerFunction
  - /aws/apigateway/commodity-analyzer

Log Format:
  - Timestamp
  - Request ID
  - Log level
  - Message
```

### Alarms
```yaml
High Error Rate:
  Metric: Errors
  Threshold: > 10 in 5 minutes
  Action: SNS notification

High Latency:
  Metric: Duration
  Threshold: > 10 seconds
  Action: SNS notification
```

## Version History

### Version 1.0.0 (March 4, 2026)
- Initial release
- Lambda function with Bedrock integration
- Web frontend
- React Native components
- Complete documentation

## Dependencies

### Runtime Dependencies
```
Python: 3.13
Node.js: Not required (optional for React Native)
AWS CLI: 2.x
AWS SAM CLI: 1.x
```

### Python Packages
```
boto3==1.34.0
requests==2.31.0
```

### TypeScript Types
```typescript
React: 18.x
React Native: 0.72+
TypeScript: 4.0+
```

## Constraints and Limitations

### Technical Constraints
- Lambda timeout: 60 seconds maximum
- Bedrock token limit: 2000 tokens
- API rate limit: 10 requests/minute (sample key)
- S3 object size: 5 GB maximum

### Business Constraints
- Data source: data.gov.in only
- Geographic coverage: India only
- Language: English only
- Currency: INR only

### Known Limitations
- No user authentication
- No data persistence
- No historical data storage
- No real-time updates (polling required)

## Future Enhancements

### Phase 2 (Planned)
- User authentication (Cognito)
- Historical data storage (DynamoDB)
- Real-time updates (WebSocket)
- Advanced analytics (QuickSight)

### Phase 3 (Proposed)
- Multi-language support
- Price prediction models
- Alert notifications
- Export functionality

---

This specification provides complete technical details for implementing, deploying, and maintaining the Commodity Market Analyzer application.
