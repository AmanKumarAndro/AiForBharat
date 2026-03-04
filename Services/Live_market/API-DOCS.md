# API Documentation

Complete reference for the Commodity Market Analyzer REST API.

## Base URL

```
https://{api-id}.execute-api.{region}.amazonaws.com/Prod
```

## Authentication

No authentication required. Publicly accessible API.

## Endpoints

### POST /fetch - Get Commodity Data

Retrieve raw commodity market data.

**Request:**
```json
{
  "state": "Maharashtra",
  "district": "Pune",
  "commodity": "Onion",
  "limit": 50,
  "action": "fetch"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 6214933,
    "count": 50,
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

**Example:**
```bash
curl -X POST https://YOUR-API-URL/fetch \
  -H "Content-Type: application/json" \
  -d '{"state":"Maharashtra","limit":50,"action":"fetch"}'
```

---

### POST /analyze - Get AI Analysis

Get AI-powered market analysis using Amazon Bedrock.

**Request:**
```json
{
  "state": "West Bengal",
  "district": "Coochbehar",
  "limit": 50,
  "action": "analyze"
}
```

**Response:**
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
    "analysis": "Based on analysis of 50 records...\n\n1. Price Trend Analysis:\n...\n\n2. Market Recommendations:\n...\n\n3. Regional Insights:\n...\n\n4. Best Opportunities:\n...\n\n5. Risk Assessment:\n..."
  }
}
```

**Example:**
```bash
curl -X POST https://YOUR-API-URL/analyze \
  -H "Content-Type: application/json" \
  -d '{"state":"West Bengal","limit":50,"action":"analyze"}'
```

---

## Data Types

### CommodityRecord
```typescript
interface CommodityRecord {
  State: string;
  District: string;
  Market: string;
  Commodity: string;
  Variety: string;
  Grade: string;
  Arrival_Date: string;       // DD/MM/YYYY
  Min_Price: string;          // INR per quintal
  Max_Price: string;
  Modal_Price: string;
  Commodity_Code: string;
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
  timestamp: string;          // ISO 8601
}
```

---

## Error Responses

```json
{
  "success": false,
  "error": "Error message"
}
```

## Status Codes

- 200: Success
- 400: Bad Request
- 429: Rate Limit Exceeded
- 500: Server Error

## Rate Limits

Sample API key: 10 requests/minute

## Popular States

Maharashtra, West Bengal, Karnataka, Tamil Nadu, Uttar Pradesh, Punjab, Haryana, Gujarat

## Popular Commodities

Onion, Tomato, Potato, Rice, Wheat, Cotton, Pointed gourd (Parval)

## Price Units

All prices in INR per quintal (100 kg)

---

## TypeScript Client

```typescript
class CommodityApiClient {
  constructor(private baseUrl: string) {}

  async fetch(params: {
    state?: string;
    district?: string;
    commodity?: string;
    limit?: number;
  }) {
    const response = await fetch(`${this.baseUrl}/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, action: 'fetch' })
    });
    return response.json();
  }

  async analyze(params: {
    state?: string;
    district?: string;
    commodity?: string;
    limit?: number;
  }) {
    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, action: 'analyze' })
    });
    return response.json();
  }
}

// Usage
const api = new CommodityApiClient('https://YOUR-API-URL');
const data = await api.fetch({ state: 'Maharashtra', limit: 50 });
const analysis = await api.analyze({ state: 'Maharashtra', limit: 50 });
```

---

## Best Practices

1. **Error Handling**: Always check `success` field
2. **Rate Limiting**: Implement exponential backoff for 429 errors
3. **Caching**: Cache responses to reduce API calls
4. **Timeouts**: Set appropriate request timeouts

---

See [User Guide](USER-GUIDE.md) for detailed examples and usage instructions.

**API Version:** 1.0.0  
**Last Updated:** March 4, 2026
