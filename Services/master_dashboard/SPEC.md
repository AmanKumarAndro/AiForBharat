# Technical Specification

## Architecture

### System Design
- Serverless architecture using AWS Lambda
- API Gateway for HTTP routing
- DynamoDB for data persistence
- Node.js 18.x runtime

### Components

#### 1. Lambda Handler (`src/index.js`)
Main entry point handling HTTP routing and request orchestration.

**Routes:**
- `/dashboard/overview` - Aggregated metrics
- `/dashboard/activity` - Recent activity feed
- `/dashboard/farmers` - Farmer analytics
- `/dashboard/ai-usage` - AI usage statistics
- `/dashboard/alerts` - Alert summaries
- `/dashboard/services` - Service request metrics
- `/dashboard/features` - All features data
- `/dashboard/features/voice-ai` - Voice AI details
- `/dashboard/features/helping-hand` - Service platform data
- `/dashboard/features/irrigation` - Irrigation system data
- `/dashboard/users` - All logged-in users

#### 2. DynamoDB Service (`src/services/dynamodb.js`)
Low-level database operations and table management.

**Methods:**
- `getTableCount(tableName)` - Get total records
- `getTodayCount(tableName, dateFields)` - Get today's records
- `getRecentActivity(limit)` - Fetch recent activities
- `getFarmersByState()` - Geographic distribution
- `getTopQueries(limit)` - Most common queries

#### 3. Features Service (`src/services/features.js`)
Feature-specific data aggregation and analytics.

**Methods:**
- `getAllFeatures()` - Complete feature dataset
- `getVoiceAISessions()` - Voice AI analytics
- `getServiceRequests()` - Service request data
- `getProviders()` - Provider directory
- `getTreatmentDatabase()` - Treatment information
- `getBannedPesticides()` - Pesticide registry
- `getKVKContacts()` - KVK directory
- `getPincodeMappings()` - Geographic mappings
- `getFarmers()` - Farmer profiles
- `getCropData()` - Crop information
- `getIrrigationFarmers()` - Irrigation users
- `getMonsoonCalendar()` - Monsoon schedule
- `getSavings()` - Water savings data
- `getSMSLog()` - SMS notifications
- `getSoilState()` - Soil moisture data
- `getAllLoggedInUsers()` - Unified user list

#### 4. Aggregator Service (`src/services/aggregator.js`)
High-level data aggregation combining multiple sources.

#### 5. Response Utilities (`src/utils/response.js`)
Standardized HTTP response formatting.

## Data Models

### DynamoDB Tables

**Authentication:**
- `kisanvoice-auth-api-dev-farmers` - User profiles

**Voice AI:**
- `farmer-voice-ai-dev-sessions` - AI interactions

**Helping Hand:**
- `HH_Requests` - Service requests
- `HH_Providers` - Service providers
- `HH_TreatmentDB` - Treatment database
- `HH_BannedPesticides` - Banned substances
- `HH_KVKContacts` - Agricultural centers
- `HH_PincodeMappings` - Location data

**Irrigation:**
- `kisanvoice-irrigation-dev-farmers` - Irrigation users
- `kisanvoice-irrigation-dev-crop-data` - Crop information
- `kisanvoice-irrigation-dev-monsoon-calendar` - Monsoon data
- `kisanvoice-irrigation-dev-savings` - Water savings
- `kisanvoice-irrigation-dev-sms-log` - Notifications
- `kisanvoice-irrigation-dev-soil-state` - Soil data

## Performance

### Optimization Strategies
- Parallel Promise.all() for multi-table queries
- Scan operations with COUNT select for efficiency
- Projection expressions to limit data transfer
- Error handling with graceful degradation

### Limits
- Memory: 512 MB
- Timeout: 10 seconds
- Concurrent executions: AWS default limits

## Security

### IAM Permissions
Read-only access to DynamoDB tables:
- `dynamodb:Scan`
- `dynamodb:Query`
- `dynamodb:GetItem`

### API Access
- HTTP GET only
- No authentication (add as needed)
- CORS not configured (add as needed)

## Deployment

### Requirements
- AWS CLI configured
- Serverless Framework installed
- Node.js 18.x

### Configuration
Environment variables in `serverless.yml`:
- `FARMERS_TABLE`
- `VOICE_QUERIES_TABLE`
- `WEATHER_ALERTS_TABLE`
- `IRRIGATION_ALERTS_TABLE`
- `SERVICE_REQUESTS_TABLE`
- `MARKET_QUERIES_TABLE`

### Commands
```bash
serverless deploy              # Deploy to AWS
serverless deploy --stage prod # Deploy to production
serverless remove              # Remove stack
```

## Error Handling

All service methods implement try-catch blocks returning safe defaults:
- Empty arrays for list operations
- Zero for count operations
- Error logging to CloudWatch

## Future Enhancements

- Add authentication/authorization
- Implement caching layer
- Add pagination support
- Create WebSocket support for real-time updates
- Add data export capabilities
- Implement rate limiting
