# User Manual

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- AWS account with appropriate permissions
- AWS CLI configured with credentials
- Serverless Framework installed globally

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure AWS credentials:
```bash
aws configure
```

## Deployment

### Deploy to Development
```bash
npm run deploy
```

This deploys to the `dev` stage in `ap-south-1` region.

### Deploy to Production
```bash
serverless deploy --stage prod
```

### Deployment Output
After successful deployment, you'll receive:
- API Gateway endpoint URL
- Lambda function ARN
- CloudFormation stack name

Example:
```
endpoints:
  GET - https://abc123.execute-api.ap-south-1.amazonaws.com/dashboard/{proxy+}
functions:
  api: master-analytics-api-dev-api
```

## Local Development

### Run Locally
```bash
npm run local
```

This starts a local server at `http://localhost:3000`

### Test Endpoints Locally
```bash
curl http://localhost:3000/dashboard/overview
curl http://localhost:3000/dashboard/farmers
curl http://localhost:3000/dashboard/features
```

## Using the API

### Base URL
After deployment, use the provided API Gateway URL:
```
https://[your-api-id].execute-api.ap-south-1.amazonaws.com
```

### Making Requests

All endpoints use GET method:

```bash
# Get overview
curl https://[api-url]/dashboard/overview

# Get recent activity (limit 20)
curl https://[api-url]/dashboard/activity?limit=20

# Get farmer analytics
curl https://[api-url]/dashboard/farmers

# Get all features data
curl https://[api-url]/dashboard/features

# Get voice AI details
curl https://[api-url]/dashboard/features/voice-ai

# Get helping hand services
curl https://[api-url]/dashboard/features/helping-hand

# Get irrigation data
curl https://[api-url]/dashboard/features/irrigation

# Get all users
curl https://[api-url]/dashboard/users
```

### Using with JavaScript

```javascript
const response = await fetch('https://[api-url]/dashboard/overview');
const data = await response.json();
console.log(data);
```

### Using with Python

```python
import requests

response = requests.get('https://[api-url]/dashboard/overview')
data = response.json()
print(data)
```

## Utility Scripts

### Discover Tables
List all DynamoDB tables in your AWS account:
```bash
npm run discover
```

### Inspect Tables
View table schemas and sample data:
```bash
npm run inspect
```

## Monitoring

### CloudWatch Logs
View Lambda logs:
```bash
serverless logs -f api
serverless logs -f api --tail  # Follow logs in real-time
```

### AWS Console
1. Navigate to AWS Lambda console
2. Find function: `master-analytics-api-dev-api`
3. View Monitoring tab for metrics
4. Check CloudWatch Logs for detailed logs

## Troubleshooting

### Common Issues

**Issue: Deployment fails with permissions error**
- Ensure AWS credentials have necessary permissions
- Required permissions: Lambda, API Gateway, CloudFormation, IAM, DynamoDB

**Issue: API returns empty data**
- Verify DynamoDB table names in `serverless.yml`
- Check IAM role has read permissions for tables
- Review CloudWatch logs for errors

**Issue: Timeout errors**
- Increase timeout in `serverless.yml` (current: 10s)
- Optimize queries or add pagination
- Consider caching frequently accessed data

**Issue: Table not found errors**
- Update table names in `serverless.yml` custom section
- Ensure tables exist in the same region
- Check table names match exactly (case-sensitive)

### Debug Mode

Enable verbose logging:
```bash
serverless deploy --verbose
```

View detailed logs:
```bash
serverless logs -f api --startTime 1h
```

## Configuration

### Environment Variables

Edit `serverless.yml` to configure table names:

```yaml
custom:
  tables:
    farmers: your-farmers-table
    voiceQueries: your-voice-queries-table
    # ... other tables
```

### Memory and Timeout

Adjust Lambda settings in `serverless.yml`:

```yaml
provider:
  memorySize: 512  # MB
  timeout: 10      # seconds
```

### Region

Change deployment region:

```yaml
provider:
  region: us-east-1  # Change as needed
```

## Updating the API

### Add New Endpoint

1. Add route in `src/index.js`:
```javascript
case '/dashboard/new-endpoint':
  return await handleNewEndpoint();
```

2. Create handler function:
```javascript
const handleNewEndpoint = async () => {
  const data = await features.getNewData();
  return success(data);
};
```

3. Add method in `src/services/features.js`:
```javascript
const getNewData = async () => {
  // Implementation
};
```

4. Deploy changes:
```bash
npm run deploy
```

### Modify Existing Endpoint

1. Update handler or service method
2. Test locally: `npm run local`
3. Deploy: `npm run deploy`

## Removing the API

To completely remove the deployed stack:

```bash
serverless remove
```

This deletes:
- Lambda function
- API Gateway
- CloudFormation stack
- IAM roles

Note: DynamoDB tables are NOT deleted.

## Best Practices

1. Always test locally before deploying
2. Use different stages for dev/prod
3. Monitor CloudWatch logs regularly
4. Set up CloudWatch alarms for errors
5. Implement proper error handling
6. Add authentication for production
7. Enable CORS if needed for web access
8. Consider adding caching layer
9. Implement rate limiting for production
10. Regular security audits

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review error messages
3. Verify AWS permissions
4. Check DynamoDB table access
5. Ensure correct region configuration

## Next Steps

- Add authentication (API keys, JWT)
- Implement caching (ElastiCache, DynamoDB DAX)
- Add pagination for large datasets
- Set up CI/CD pipeline
- Create monitoring dashboards
- Implement rate limiting
- Add data export features
- Create WebSocket support for real-time updates
