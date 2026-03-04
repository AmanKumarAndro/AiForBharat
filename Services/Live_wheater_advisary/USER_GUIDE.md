# User Guide

## AI Agri Weather Intelligence Module

---

## For Farmers

### What is this?

This system helps you decide when it's safe to spray pesticides on your crops by checking the weather conditions. It gives you simple advice in easy-to-understand language.

### How does it work?

1. The system checks the weather at your farm location
2. It looks at rain, wind, humidity, and temperature
3. It tells you if it's safe to spray or not
4. You get a friendly message explaining why

### When should I use it?

- Before spraying pesticides
- When planning farm work
- To check weather conditions
- To avoid wasting pesticides

### What do I need?

- A smartphone or computer
- Internet connection
- Your farm's location (GPS coordinates)

---

## For App Developers

### Integration Steps

#### 1. Get the API Endpoint

```
https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory
```

#### 2. Make a Request

**Method:** POST

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "lat": 28.4595,
  "lon": 77.0266,
  "activity": "spraying"
}
```

#### 3. Handle the Response

**Success (200 OK):**
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
  "friendly_message": "Dear Farmer, Great news! Weather conditions are perfect for spraying..."
}
```

**Error (400/500):**
```json
{
  "error": "Missing lat or lon parameters"
}
```

#### 4. Display to User

Show the `friendly_message` prominently with a visual indicator:
- ✅ Green if `spray_safe: true`
- ❌ Red if `spray_safe: false`

---

## Understanding the Response

### Key Fields

**spray_safe** (boolean)
- `true` = Safe to spray pesticides
- `false` = Not safe, wait for better conditions

**rain_probability_next_6h** (0-100)
- Chance of rain in next 6 hours
- > 60% = High risk, don't spray

**wind_speed** (km/h)
- Current wind speed
- > 15 km/h = Spray drift risk

**humidity** (0-100%)
- Moisture in air
- > 80% = Fungus risk

**temperature** (°C)
- Current temperature
- Affects pesticide effectiveness

**uv_index** (0-11+)
- Sun intensity
- > 8 = Avoid mid-day spraying

**friendly_message** (text)
- AI-generated advice in simple language
- Show this to farmers

---

## Example Use Cases

### Use Case 1: Morning Spray Check

**Scenario:** Farmer wants to spray at 7 AM

**Request:**
```bash
curl -X POST https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory \
  -H 'Content-Type: application/json' \
  -d '{"lat": 28.4595, "lon": 77.0266, "activity": "spraying"}'
```

**Response:**
```json
{
  "spray_safe": true,
  "friendly_message": "Good morning! Weather is perfect for spraying. Low wind, no rain expected. You can proceed safely."
}
```

**Action:** ✅ Proceed with spraying

---

### Use Case 2: Rainy Day Check

**Scenario:** Cloudy weather, farmer unsure

**Response:**
```json
{
  "spray_safe": false,
  "rain_probability_next_6h": 75,
  "friendly_message": "Please wait! Rain is expected in the next few hours. Spraying now will waste your pesticides. Try again tomorrow morning."
}
```

**Action:** ❌ Wait for better weather

---

### Use Case 3: Windy Conditions

**Scenario:** Breezy afternoon

**Response:**
```json
{
  "spray_safe": false,
  "wind_speed": 18.5,
  "friendly_message": "Wind is too strong right now. The spray will drift away from your crops. Wait for calmer conditions, maybe early morning."
}
```

**Action:** ❌ Wait for calm weather

---

## Mobile App Integration

### React Native Example

```javascript
import axios from 'axios';

async function checkSpraySafety(latitude, longitude) {
  try {
    const response = await axios.post(
      'https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory',
      {
        lat: latitude,
        lon: longitude,
        activity: 'spraying'
      }
    );
    
    const { spray_safe, friendly_message } = response.data;
    
    // Show to user
    if (spray_safe) {
      showSuccessAlert('Safe to Spray', friendly_message);
    } else {
      showWarningAlert('Not Safe', friendly_message);
    }
    
    return response.data;
  } catch (error) {
    showErrorAlert('Error', 'Could not get weather advisory');
  }
}
```

### Flutter Example

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<Map<String, dynamic>> checkSpraySafety(double lat, double lon) async {
  final url = Uri.parse(
    'https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory'
  );
  
  final response = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'lat': lat,
      'lon': lon,
      'activity': 'spraying',
    }),
  );
  
  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to get advisory');
  }
}
```

---

## Best Practices

### For Farmers

1. **Check Before Every Spray**
   - Weather changes quickly
   - Always check before starting

2. **Follow the Advice**
   - If system says "don't spray", wait
   - Saves money and protects crops

3. **Check Multiple Times**
   - Morning check
   - Before starting work
   - If weather looks different

4. **Understand the Reasons**
   - Read the friendly message
   - Learn about weather effects

### For Developers

1. **Cache Responses**
   - Cache for 10-15 minutes
   - Reduce API calls
   - Faster for users

2. **Handle Errors Gracefully**
   - Show user-friendly error messages
   - Provide retry option
   - Don't crash the app

3. **Use Location Services**
   - Get accurate GPS coordinates
   - Request location permission
   - Handle permission denial

4. **Show Visual Indicators**
   - Green = Safe
   - Red = Not safe
   - Yellow = Warning
   - Use icons and colors

5. **Offline Support**
   - Cache last advisory
   - Show "data may be outdated" warning
   - Retry when online

---

## Troubleshooting

### Common Issues

**Issue:** "Missing lat or lon parameters"
- **Cause:** Location not provided
- **Solution:** Ensure GPS coordinates are sent in request

**Issue:** "Network error"
- **Cause:** No internet connection
- **Solution:** Check internet, retry when online

**Issue:** "Internal error"
- **Cause:** Server problem
- **Solution:** Wait a few minutes and retry

**Issue:** Wrong location shown
- **Cause:** Incorrect GPS coordinates
- **Solution:** Verify lat/lon values are correct

---

## Safety Rules Explained

### Rain Probability > 60%

**Why it matters:**
- Rain washes away pesticides
- Wastes money and chemicals
- Reduces effectiveness

**What to do:**
- Wait for dry weather
- Check again in a few hours

### Wind Speed > 15 km/h

**Why it matters:**
- Wind carries spray away
- Affects neighboring crops
- Reduces coverage

**What to do:**
- Spray early morning (calm)
- Wait for wind to reduce

### Humidity > 80%

**Why it matters:**
- Promotes fungal growth
- Affects pesticide drying
- May cause crop disease

**What to do:**
- Monitor crop health
- Consider fungicide if needed

### UV Index > 8

**Why it matters:**
- Strong sun affects chemicals
- Health risk for farmer
- Reduces pesticide effectiveness

**What to do:**
- Spray early morning or evening
- Wear protective gear
- Stay hydrated

---

## Frequently Asked Questions

**Q: Is this free to use?**
A: Yes, the API is free for farmers and agricultural apps.

**Q: How accurate is the weather data?**
A: We use OpenWeather API, which is reliable and updated frequently.

**Q: Can I use this for other activities?**
A: Yes, you can check weather for irrigation, harvesting, etc.

**Q: What if I don't have GPS?**
A: You can use your village/town coordinates from Google Maps.

**Q: How often should I check?**
A: Check before every spray session, ideally 30 minutes before.

**Q: Does it work offline?**
A: No, internet connection is required for real-time data.

**Q: What languages are supported?**
A: Currently English. More languages coming soon.

**Q: Can I get historical data?**
A: Not yet. This feature is planned for future versions.

---

## Support

### For Technical Issues

- Check API status
- Review error messages
- Contact support team

### For Feature Requests

- Submit feedback
- Suggest improvements
- Request new features

### Contact

- Email: support@example.com
- Documentation: See API_DOCUMENTATION.md
- Technical: See ARCHITECTURE.md

---

## Quick Reference

### API Endpoint
```
POST https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory
```

### Request Format
```json
{"lat": 28.4595, "lon": 77.0266, "activity": "spraying"}
```

### Response Fields
- `spray_safe`: true/false
- `friendly_message`: User-friendly advice
- `rain_probability_next_6h`: 0-100%
- `wind_speed`: km/h
- `humidity`: 0-100%
- `temperature`: °C

### Safety Thresholds
- Rain: > 60% = Don't spray
- Wind: > 15 km/h = Don't spray
- Humidity: > 80% = Warning
- UV: > 8 = Warning

---

## Version

1.0.0 (March 2026)
