# API Documentation

## Weather Advisory API v1.0

---

## Base URL

```
https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod
```

---

## Authentication

No authentication required. This is a public API.

---

## Endpoints

### POST /weather/advisory

Get agriculture-specific weather advisory with spray safety recommendations.

---

## Request

### Headers

```
Content-Type: application/json
```

### Body Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `lat` | number | Yes | Latitude coordinate (-90 to 90) | 28.4595 |
| `lon` | number | Yes | Longitude coordinate (-180 to 180) | 77.0266 |
| `activity` | string | No | Activity type (default: "spraying") | "spraying" |

### Request Example

```bash
curl -X POST https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory \
  -H 'Content-Type: application/json' \
  -d '{
    "lat": 28.4595,
    "lon": 77.0266,
    "activity": "spraying"
  }'
```

---

## Response

### Success Response (200 OK)

#### Response Schema

```json
{
  "location": "string",
  "timestamp": "string (ISO 8601)",
  "rain_probability_next_6h": number,
  "wind_speed": number,
  "humidity": number,
  "temperature": number,
  "uv_index": number,
  "advisory": {
    "spray_safe": boolean,
    "messages": ["string"]
  },
  "friendly_message": "string"
}
```

#### Field Descriptions

| Field | Type | Description | Range/Format |
|-------|------|-------------|--------------|
| `location` | string | Location identifier | "Lat: X, Lon: Y" |
| `timestamp` | string | Advisory generation time (UTC) | ISO 8601 |
| `rain_probability_next_6h` | number | Rain probability in next 6 hours | 0-100 (%) |
| `wind_speed` | number | Current wind speed | km/h |
| `humidity` | number | Relative humidity | 0-100 (%) |
| `temperature` | number | Current temperature | Celsius |
| `uv_index` | number | UV radiation index | 0-11+ |
| `advisory.spray_safe` | boolean | Safe to spray pesticides | true/false |
| `advisory.messages` | array | Technical advisory messages | Array of strings |
| `friendly_message` | string | AI-generated farmer-friendly message | Natural language |

#### Success Example

```json
{
  "location": "Lat: 28.4595, Lon: 77.0266",
  "timestamp": "2026-03-01T00:01:43.164739",
  "rain_probability_next_6h": 0,
  "wind_speed": 6.6,
  "humidity": 22,
  "temperature": 19.2,
  "uv_index": 0,
  "advisory": {
    "spray_safe": true,
    "messages": [
      "Conditions favorable for spraying"
    ]
  },
  "friendly_message": "Dear Farmer, Great news! With no rain in sight, light winds, and comfortable temperatures, the next 6 hours are perfect for spraying your crops. Just remember to stay hydrated and take breaks to protect yourself from the low humidity. Happy spraying!"
}
```

---

### Error Responses

#### 400 Bad Request

**Cause:** Missing or invalid parameters

**Response Schema:**
```json
{
  "error": "string"
}
```

**Example:**
```json
{
  "error": "Missing lat or lon parameters"
}
```

#### 500 Internal Server Error

**Cause:** Server error, weather API failure, or Bedrock error

**Response Schema:**
```json
{
  "error": "string"
}
```

**Example:**
```json
{
  "error": "Internal error: Weather API error: 401"
}
```

---

## Safety Rules

The API applies the following agriculture safety rules:

| Condition | Threshold | Result | Message |
|-----------|-----------|--------|---------|
| Rain Probability | > 60% | `spray_safe: false` | "Rain expected in next 6 hours" |
| Wind Speed | > 15 km/h | `spray_safe: false` | "High wind speed - spray drift risk" |
| Humidity | > 80% | Warning only | "High humidity - increased fungus risk" |
| UV Index | > 8 | Warning only | "High UV - avoid mid-day spraying" |
| All favorable | - | `spray_safe: true` | "Conditions favorable for spraying" |

---

## Code Examples

### JavaScript (Node.js)

```javascript
const axios = require('axios');

async function getWeatherAdvisory(lat, lon) {
  try {
    const response = await axios.post(
      'https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory',
      {
        lat: lat,
        lon: lon,
        activity: 'spraying'
      }
    );
    
    console.log('Spray Safe:', response.data.advisory.spray_safe);
    console.log('Message:', response.data.friendly_message);
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
getWeatherAdvisory(28.4595, 77.0266);
```

### Python

```python
import requests

def get_weather_advisory(lat, lon):
    url = 'https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory'
    
    payload = {
        'lat': lat,
        'lon': lon,
        'activity': 'spraying'
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        print(f"Spray Safe: {data['advisory']['spray_safe']}")
        print(f"Message: {data['friendly_message']}")
        
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        raise

# Usage
advisory = get_weather_advisory(28.4595, 77.0266)
```

### cURL

```bash
# Basic request
curl -X POST https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory \
  -H 'Content-Type: application/json' \
  -d '{"lat": 28.4595, "lon": 77.0266, "activity": "spraying"}'

# Pretty print with jq
curl -X POST https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory \
  -H 'Content-Type: application/json' \
  -d '{"lat": 28.4595, "lon": 77.0266, "activity": "spraying"}' \
  | jq '.'

# Extract friendly message only
curl -X POST https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory \
  -H 'Content-Type: application/json' \
  -d '{"lat": 28.4595, "lon": 77.0266, "activity": "spraying"}' \
  | jq -r '.friendly_message'
```

### React Native

```javascript
import axios from 'axios';

const getWeatherAdvisory = async (latitude, longitude) => {
  try {
    const response = await axios.post(
      'https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory',
      {
        lat: latitude,
        lon: longitude,
        activity: 'spraying'
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Network error'
    };
  }
};

// Usage in component
const checkSpraySafety = async () => {
  const result = await getWeatherAdvisory(28.4595, 77.0266);
  
  if (result.success) {
    const { spray_safe, friendly_message } = result.data;
    Alert.alert(
      spray_safe ? 'Safe to Spray' : 'Not Safe',
      friendly_message
    );
  } else {
    Alert.alert('Error', result.error);
  }
};
```

---

## Test Locations

### Indian Cities

| City | Latitude | Longitude |
|------|----------|-----------|
| Gurgaon (Delhi NCR) | 28.4595 | 77.0266 |
| Mumbai | 19.0760 | 72.8777 |
| Bangalore | 12.9716 | 77.5946 |
| Pune | 18.5204 | 73.8567 |
| Hyderabad | 17.3850 | 78.4867 |
| Chennai | 13.0827 | 80.2707 |

### Test Commands

```bash
# Gurgaon
curl -X POST https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory \
  -H 'Content-Type: application/json' \
  -d '{"lat": 28.4595, "lon": 77.0266, "activity": "spraying"}'

# Mumbai
curl -X POST https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory \
  -H 'Content-Type: application/json' \
  -d '{"lat": 19.0760, "lon": 72.8777, "activity": "spraying"}'

# Bangalore
curl -X POST https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory \
  -H 'Content-Type: application/json' \
  -d '{"lat": 12.9716, "lon": 77.5946, "activity": "spraying"}'
```

---

## Rate Limits

- **Current:** No rate limits enforced
- **Recommended:** Cache responses for 10-15 minutes
- **Future:** May implement rate limiting based on usage

---

## Performance

- **Response Time:** < 2 seconds (typical: 500-800ms)
- **Availability:** 99.9% uptime
- **Region:** ap-south-1 (Mumbai, India)

---

## Versioning

**Current Version:** 1.0.0

**Version Format:** Major.Minor.Patch

**Breaking Changes:** Will be announced with major version bump

---

## Error Handling Best Practices

### 1. Network Errors

```javascript
try {
  const response = await axios.post(url, data);
  return response.data;
} catch (error) {
  if (error.code === 'ECONNABORTED') {
    // Timeout
    return { error: 'Request timeout. Please try again.' };
  } else if (!error.response) {
    // Network error
    return { error: 'Network error. Check your connection.' };
  }
  // Server error
  return { error: error.response.data.error };
}
```

### 2. Retry Logic

```javascript
async function getAdvisoryWithRetry(lat, lon, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getWeatherAdvisory(lat, lon);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. Validation

```javascript
function validateCoordinates(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    throw new Error('Coordinates must be numbers');
  }
  if (lat < -90 || lat > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  if (lon < -180 || lon > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
  return true;
}
```

---

## Changelog

### v1.0.0 (March 2026)

**Initial Release**
- POST /weather/advisory endpoint
- OpenWeather API integration
- AWS Bedrock (Amazon Nova Lite) for friendly messages
- Agriculture safety rules
- Support for Indian locations
- Sub-2 second response time

---

## Support

### Documentation
- Architecture: See `ARCHITECTURE.md`
- User Guide: See `USER_GUIDE.md`
- Specification: See `SPECIFICATION.md`

### Technical Support
- CloudWatch Logs: `/aws/lambda/weather-advisory`
- Region: ap-south-1 (Mumbai)
- Lambda Function: `weather-advisory`

### Contact
- Email: support@example.com
- Issues: Report via support channel

---

## License

Proprietary - AI Pest Scan + Farm Decision Engine

---

## Related Resources

- OpenWeather API: https://openweathermap.org/api
- AWS Bedrock: https://aws.amazon.com/bedrock/
- AWS Lambda: https://aws.amazon.com/lambda/
