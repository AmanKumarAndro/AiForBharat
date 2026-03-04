# API Documentation

Complete reference for the Commodity Market Analyzer REST API.

## Base URL

```
https://{api-id}.execute-api.{region}.amazonaws.com/Prod
```

Replace with your actual API Gateway endpoint after deployment.

## Authentication

No authentication required. The API is publicly accessible.

## Rate Limiting

- Sample API key: 10 requests/minute
- Custom API key: Higher limits (obtain from data.gov.in)

## CORS

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

---

## Endpoints

### 1. POST /fetch - Get Commodity Data

Retrieve raw commodity market data with optional filters.

#### Request

```json
{
  "state": "Maharashtra",
  "district": "Pune",
  "commodity": "Onion",
  "limit": 50,
  "action": "fetch"
}
```

**Parameters:**
- `state` (optional): Filter by state name
- `district` (optional): Filter by district name
- `commodity` (optional): Filter by commodity name
- `limit` (optional): Max records to return (default: 100, max: 1000)
- `action` (required): Must be "fetch"

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

#### Example Usage

**cURL:**
```bash
curl -X POST https://YOUR-API-URL/fetch \
  -H "Content-Type: application/json" \
  -d '{"state":"Maharashtra","limit":50,"action":"fetch"}'
```

**JavaScript:**
```javascript
const response = await fetch('https://YOUR-API-URL/fetch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    state: 'Maharashtra',
    limit: 50,
    action: 'fetch'
  })
});
const data = await response.json();
```

**Python:**
```python
import requests

response = requests.post('https://YOUR-API-URL/fetch', json={
    'state': 'Maharashtra',
    'limit': 50,
    'action': 'fetch'
})
data = response.json()
```

---

### 2. POST /analyze - Get AI Analysis

Get AI-powered market analysis and recommendations using Amazon Bedrock.

#### Request

```json
{
  "state": "West Bengal",
  "district": "Coochbehar",
  "limit": 50,
  "action": "analyze"
}
```

**Parameters:**
- `state` (optional): Filter by state name
- `district` (optional): Filter by district name
- `commodity` (optional): Filter by commodity name
- `limit` (optional): Max records to analyze (default: 100)
- `action` (required): Must be "analyze"

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
    "analysis": "Based on analysis of 50 records from West Bengal, Coochbehar:\n\n1. Price Trend Analysis:\n- Pointed gourd shows stable pricing...\n\n2. Market Recommendations:\n- BUY: Pointed gourd during June-July...\n\n3. Regional Insights:\n- Pundibari market: Average modal price ₹12,500...\n\n4. Best Opportunities:\n- Pointed gourd - Consistent demand...\n\n5. Risk Assessment:\n- LOW RISK: Stable commodity..."
  }
}
```

#### Example Usage

**cURL:**
```bash
curl -X POST https://YOUR-API-URL/analyze \
  -H "Content-Type: application/json" \
  -d '{"state":"West Bengal","limit":50,"action":"analyze"}'
```

**JavaScript:**
```javascript
const response = await fetch('https://YOUR-API-URL/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    state: 'West Bengal',
    limit: 50,
    action: 'analyze'
  })
});
const analysis = await response.json();
```

**Python:**
```python
import requests

response = requests.post('https://YOUR-API-URL/analyze', json={
    'state': 'West Bengal',
    'limit': 50,
    'action': 'analyze'
})
analysis = response.json()
```

---

## Data Types

### CommodityRecord

```typescript
interface CommodityRecord {
  State: string;              // State name (e.g., "Maharashtra")
  District: string;           // District name (e.g., "Pune")
  Market: string;             // Market/mandi name (e.g., "Pune")
  Commodity: string;          // Commodity name (e.g., "Onion")
  Variety: string;            // Variety/type (e.g., "Nasik Red")
  Grade: string;              // Quality grade (e.g., "FAQ")
  Arrival_Date: string;       // Format: DD/MM/YYYY
  Min_Price: string;          // Minimum price (INR per quintal)
  Max_Price: string;          // Maximum price (INR per quintal)
  Modal_Price: string;        // Most common price (INR per quintal)
  Commodity_Code: string;     // Unique commodity code
}
```

### AnalysisMetadata

```typescript
interface AnalysisMetadata {
  state: string | null;
  district: string | null;
  commodity: string | null;
  total_records: number;
  analyzed_records: number;
  timestamp: string;          // ISO 8601 format
}
```

---

## Error Responses

All endpoints return this format on error:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Errors

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid action parameter. Must be 'fetch' or 'analyze'"
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "error": "429 Client Error: Too Many Requests"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Failed to fetch data from API"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Data Reference

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
- Pointed gourd (Parval)

### Price Units
All prices are in INR (Indian Rupees) per quintal (100 kg).

### Date Format
Dates are in DD/MM/YYYY format (e.g., "01/03/2026").

---

## TypeScript Types

Complete type definitions for TypeScript projects:

```typescript
// Request Types
interface FetchRequest {
  state?: string;
  district?: string;
  commodity?: string;
  limit?: number;
  action: 'fetch';
}

interface AnalyzeRequest {
  state?: string;
  district?: string;
  commodity?: string;
  limit?: number;
  action: 'analyze';
}

// Response Types
interface FetchResponse {
  success: boolean;
  data: {
    total: number;
    count: number;
    limit: number;
    offset: number;
    records: CommodityRecord[];
  };
}

interface AnalyzeResponse {
  success: boolean;
  data: {
    metadata: AnalysisMetadata;
    analysis: string;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
}

// API Client
class CommodityApiClient {
  constructor(private baseUrl: string) {}

  async fetch(params: Omit<FetchRequest, 'action'>): Promise<FetchResponse> {
    const response = await fetch(`${this.baseUrl}/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, action: 'fetch' })
    });
    return response.json();
  }

  async analyze(params: Omit<AnalyzeRequest, 'action'>): Promise<AnalyzeResponse> {
    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, action: 'analyze' })
    });
    return response.json();
  }
}
```

---

## Best Practices

### 1. Error Handling

Always check the `success` field:

```javascript
const response = await fetch(url, options);
const data = await response.json();

if (data.success) {
  console.log(data.data);
} else {
  console.error(data.error);
}
```

### 2. Rate Limiting

Implement exponential backoff for 429 errors:

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    return response.json();
  }
  throw new Error('Max retries exceeded');
}
```

### 3. Caching

Cache responses to reduce API calls:

```javascript
const cache = new Map();

async function fetchWithCache(params, ttl = 300000) {
  const key = JSON.stringify(params);
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await api.fetch(params);
  cache.set(key, { data, timestamp: Date.now() });
  
  return data;
}
```

---

## Support

For detailed usage instructions, see:
- [User Guide](USER-GUIDE.md) - Complete usage guide
- [Architecture](ARCHITECTURE.md) - System design
- [Features](FEATURES.md) - Feature documentation

---

**API Version:** 1.0.0  
**Last Updated:** March 4, 2026
