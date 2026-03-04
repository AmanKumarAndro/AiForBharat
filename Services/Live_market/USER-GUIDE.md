# User Guide

Complete guide for using the Commodity Market Analyzer application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Web Application](#web-application)
3. [Mobile Application](#mobile-application)
4. [API Usage](#api-usage)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is Commodity Market Analyzer?

A tool that helps you analyze Indian agricultural commodity markets using AI. Get real-time prices, market trends, and buying/selling recommendations for 77.5M+ market records.

### Who Should Use This?

- **Farmers**: Check market prices and get selling recommendations
- **Traders**: Analyze market trends and identify opportunities
- **Analysts**: Research agricultural market data
- **Developers**: Integrate commodity data into applications

### Prerequisites

For deployment:
- AWS Account
- AWS CLI configured
- AWS SAM CLI installed

For usage:
- Web browser (Chrome, Firefox, Safari, Edge)
- OR React Native mobile app
- OR API client (curl, Postman, etc.)

---

## Web Application

### Accessing the Web App

After deployment, open the S3 website URL:
```
http://YOUR-BUCKET-NAME.s3-website-us-east-1.amazonaws.com
```

### Using the Search Form

#### 1. Basic Search

Search all commodities in a state:
```
State: Maharashtra
District: (leave empty)
Commodity: (leave empty)
Limit: 50
```

#### 2. Specific District

Search commodities in a specific district:
```
State: West Bengal
District: Coochbehar
Commodity: (leave empty)
Limit: 50
```

#### 3. Specific Commodity

Search for a specific commodity:
```
State: Maharashtra
District: Pune
Commodity: Onion
Limit: 50
```

### Understanding Results

#### Data Table

The results table shows:
- **State**: State name
- **District**: District name
- **Market**: Market/mandi name
- **Commodity**: Commodity name
- **Variety**: Variety or type
- **Grade**: Quality grade (FAQ = Fair Average Quality)
- **Date**: Arrival date (DD/MM/YYYY)
- **Min Price**: Minimum price (₹/quintal)
- **Max Price**: Maximum price (₹/quintal)
- **Modal Price**: Most common price (₹/quintal)

#### AI Analysis

The AI analysis provides:
1. **Price Trend Analysis**: Rising or falling prices
2. **Market Recommendations**: Buy/sell suggestions
3. **Regional Insights**: Price variations by location
4. **Best Opportunities**: Top commodities to trade
5. **Risk Assessment**: Price volatility analysis

### Tips for Better Results

1. **Start Broad**: Begin with state-only search
2. **Narrow Down**: Add district or commodity filters
3. **Adjust Limit**: Use 50-100 records for good analysis
4. **Compare Dates**: Look at recent vs older data
5. **Check Multiple Markets**: Compare prices across districts

---

## Mobile Application

### Integration Steps

#### 1. Copy Files

```bash
cp -r react-native/ your-app/src/
```

#### 2. Update API URL

Edit `src/react-native/api.ts`:
```typescript
const API_BASE_URL = 'https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/Prod';
```

#### 3. Add to Navigation

```typescript
import CommodityScreen from './src/react-native/CommodityScreen';

<Stack.Screen 
  name="Commodity" 
  component={CommodityScreen}
  options={{ title: 'Market Analyzer' }}
/>
```

### Using the Mobile App

#### Search Screen

1. **Enter Search Criteria**:
   - State (optional)
   - District (optional)
   - Commodity (optional)
   - Limit (default: 50)

2. **Tap "Search"**: Fetches commodity data

3. **Tap "Analyze with AI"**: Gets AI-powered analysis

#### Features

- **Loading States**: Shows spinner while fetching
- **Error Handling**: Displays error messages
- **Statistics**: Shows min/max/average prices
- **Offline Support**: Caches recent searches
- **Retry Logic**: Automatically retries failed requests

### Advanced Features

#### Caching

```typescript
import { CommodityApiClientWithCache } from './advanced-features';

const api = new CommodityApiClientWithCache(API_URL);
// Automatically caches responses for 5 minutes
```

#### Offline Support

```typescript
import { useCommodityWithOffline } from './advanced-features';

const { data, isOffline } = useCommodityWithOffline({
  state: 'Maharashtra'
});
```

#### Pagination

```typescript
import { useCommodityPagination } from './advanced-features';

const { data, loadMore, hasMore } = useCommodityPagination({
  state: 'Maharashtra',
  pageSize: 20
});
```

---

## API Usage

### Base URL

```
https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/Prod
```

### Fetch Commodity Data

#### Request

```bash
curl -X POST https://YOUR-API-URL/fetch \
  -H "Content-Type: application/json" \
  -d '{
    "state": "Maharashtra",
    "district": "Pune",
    "commodity": "Onion",
    "limit": 50,
    "action": "fetch"
  }'
```

#### Response

```json
{
  "success": true,
  "data": {
    "total": 6214933,
    "count": 50,
    "limit": 50,
    "offset": 0,
    "records": [
      {
        "State": "Maharashtra",
        "District": "Pune",
        "Market": "Pune",
        "Commodity": "Onion",
        "Variety": "Nasik Red",
        "Grade": "FAQ",
        "Arrival_Date": "01/03/2026",
        "Min_Price": "2000",
        "Max_Price": "2500",
        "Modal_Price": "2200",
        "Commodity_Code": "23"
      }
    ]
  }
}
```

### Get AI Analysis

#### Request

```bash
curl -X POST https://YOUR-API-URL/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "state": "West Bengal",
    "district": "Coochbehar",
    "limit": 50,
    "action": "analyze"
  }'
```

#### Response

```json
{
  "success": true,
  "data": {
    "metadata": {
      "state": "West Bengal",
      "district": "Coochbehar",
      "commodity": null,
      "total_records": 125000,
      "analyzed_records": 50,
      "timestamp": "2026-03-04T10:30:00.000Z"
    },
    "analysis": "Based on analysis of 50 records...\n\n1. Price Trend Analysis:\n..."
  }
}
```

### Using with Python

```python
import requests

API_URL = "https://YOUR-API-URL"

# Fetch data
response = requests.post(f"{API_URL}/fetch", json={
    "state": "Maharashtra",
    "limit": 50,
    "action": "fetch"
})
data = response.json()

# Get analysis
response = requests.post(f"{API_URL}/analyze", json={
    "state": "Maharashtra",
    "limit": 50,
    "action": "analyze"
})
analysis = response.json()
```

### Using with JavaScript

```javascript
const API_URL = 'https://YOUR-API-URL';

// Fetch data
const response = await fetch(`${API_URL}/fetch`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    state: 'Maharashtra',
    limit: 50,
    action: 'fetch'
  })
});
const data = await response.json();

// Get analysis
const analysisResponse = await fetch(`${API_URL}/analyze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    state: 'Maharashtra',
    limit: 50,
    action: 'analyze'
  })
});
const analysis = await analysisResponse.json();
```

---

## Deployment

### Step 1: Prerequisites

```bash
# Check AWS CLI
aws --version

# Check SAM CLI
sam --version

# Configure AWS credentials
aws configure
```

### Step 2: Deploy Backend

```bash
# Build
sam build

# Deploy (first time)
sam deploy --guided

# Follow prompts:
# - Stack Name: commodity-analyzer
# - AWS Region: us-east-1
# - Confirm changes: Y
# - Allow IAM role creation: Y
# - Save configuration: Y
```

### Step 3: Get API Endpoint

After deployment, note the API endpoint:
```
Outputs
-----------------------------------------------------------------
ApiEndpoint: https://abc123.execute-api.us-east-1.amazonaws.com/Prod/
```

### Step 4: Deploy Frontend

```bash
# Get bucket name from outputs
export BUCKET_NAME="commodity-analyzer-commoditywebbucket-xxxxx"

# Deploy frontend
./deploy-frontend.sh $BUCKET_NAME $API_URL
```

### Step 5: Access Application

Open the website URL:
```
http://BUCKET-NAME.s3-website-us-east-1.amazonaws.com
```

### Step 6: Test

```bash
# Test fetch endpoint
curl -X POST $API_URL/fetch \
  -H "Content-Type: application/json" \
  -d '{"state":"Maharashtra","limit":5,"action":"fetch"}'

# Test analyze endpoint
curl -X POST $API_URL/analyze \
  -H "Content-Type: application/json" \
  -d '{"state":"Maharashtra","limit":10,"action":"analyze"}'
```

---

## Troubleshooting

### Common Issues

#### Issue: "sam: command not found"

**Solution**: Install SAM CLI
```bash
# macOS
brew install aws-sam-cli

# Linux
pip install aws-sam-cli

# Windows
choco install aws-sam-cli
```

#### Issue: "Unable to locate credentials"

**Solution**: Configure AWS credentials
```bash
aws configure
# Enter Access Key ID
# Enter Secret Access Key
# Enter Region: us-east-1
```

#### Issue: "Access Denied" for Bedrock

**Solution**: Amazon Nova should work by default. Verify region:
```bash
aws configure set region us-east-1
```

#### Issue: CORS error in browser

**Solution**: Redeploy to ensure CORS is configured
```bash
sam deploy
```

#### Issue: "429 Too Many Requests"

**Solution**: You've hit the rate limit. Wait 1 minute or get a custom API key from data.gov.in

#### Issue: Frontend not loading

**Solution**: Check bucket policy
```bash
aws s3api get-bucket-policy --bucket YOUR-BUCKET-NAME
```

Make bucket public:
```bash
aws s3api put-bucket-policy --bucket YOUR-BUCKET-NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
  }]
}'
```

### Viewing Logs

#### Lambda Logs

```bash
# Tail logs in real-time
sam logs -n CommodityAnalyzerFunction --tail

# View recent logs
sam logs -n CommodityAnalyzerFunction --start-time '10min ago'
```

#### CloudWatch Logs

```bash
# View in AWS Console
aws logs tail /aws/lambda/commodity-analyzer-CommodityAnalyzerFunction --follow
```

### Performance Issues

#### Slow Response Times

1. **Check Lambda memory**: Increase to 1024 MB in template.yaml
2. **Check API timeout**: Increase timeout to 90 seconds
3. **Check data.gov.in API**: May be slow during peak hours

#### High Costs

1. **Check invocation count**: View CloudWatch metrics
2. **Enable caching**: Add API Gateway caching
3. **Optimize limit**: Use smaller limit values

### Getting Help

1. **Check Documentation**: Read all docs thoroughly
2. **View Logs**: Check CloudWatch logs for errors
3. **Test Locally**: Use `test_lambda.py` for local testing
4. **AWS Support**: Contact AWS support for infrastructure issues

---

## Best Practices

### For Farmers

1. **Check Daily**: Prices update daily
2. **Compare Markets**: Check multiple districts
3. **Track Trends**: Monitor prices over time
4. **Use AI Analysis**: Get selling recommendations

### For Traders

1. **Analyze Multiple Commodities**: Compare opportunities
2. **Monitor Volatility**: Check risk assessments
3. **Regional Comparison**: Find price arbitrage
4. **Set Alerts**: Monitor specific commodities

### For Developers

1. **Cache Responses**: Reduce API calls
2. **Handle Errors**: Implement retry logic
3. **Rate Limiting**: Respect API limits
4. **Monitor Usage**: Track costs and performance

### For Analysts

1. **Large Datasets**: Use higher limits (100-500)
2. **Export Data**: Save responses for analysis
3. **Time Series**: Track historical trends
4. **Visualization**: Create charts from data

---

## FAQ

### Q: Is this free to use?

A: The Amazon Nova AI model is FREE. You only pay for AWS infrastructure (~$4/month for 10,000 requests).

### Q: How often is data updated?

A: The data.gov.in API updates daily with new market arrivals.

### Q: Can I use this commercially?

A: Yes, the application is MIT licensed. Check data.gov.in terms for data usage.

### Q: What's the rate limit?

A: Sample API key: 10 requests/minute. Get a custom key from data.gov.in for higher limits.

### Q: Can I add authentication?

A: Yes, you can add AWS Cognito or API keys to the API Gateway.

### Q: How do I update the deployment?

A: Run `sam build && sam deploy` to update the backend.

### Q: Can I use a different AI model?

A: Yes, edit `config.py` to use Nova Lite or Nova Pro (both FREE).

### Q: How do I delete everything?

A: Run `sam delete` to remove all AWS resources.

---

## Quick Reference

### Common Commands

```bash
# Deploy
sam build && sam deploy

# Update frontend
./deploy-frontend.sh BUCKET API_URL

# View logs
sam logs -n CommodityAnalyzerFunction --tail

# Test
curl -X POST $API_URL/fetch -H "Content-Type: application/json" -d '{"state":"Maharashtra","limit":5,"action":"fetch"}'

# Delete
sam delete
```

### Popular States

- Maharashtra
- West Bengal
- Karnataka
- Tamil Nadu
- Uttar Pradesh
- Punjab
- Haryana
- Gujarat

### Popular Commodities

- Onion
- Tomato
- Potato
- Rice
- Wheat
- Cotton
- Sugarcane
- Pointed gourd (Parval)

### Price Units

All prices are in INR per quintal (100 kg).

---

**Need more help?** Check the other documentation files:
- [Architecture](ARCHITECTURE.md) - System design
- [API Documentation](API-DOCUMENTATION.md) - Complete API reference
- [Features](FEATURES.md) - Detailed feature documentation
