# KisanVoice Irrigation API Documentation
## For React Native / Mobile App Integration

**Base URL:** `https://ys4xa8tu60.execute-api.ap-south-1.amazonaws.com/dev`

**Version:** 1.0.0  
**Region:** ap-south-1 (Mumbai)  
**Protocol:** HTTPS only

---

## Table of Contents
1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
   - [Register Farmer](#1-register-farmer)
   - [Get Farmer Profile](#2-get-farmer-profile)
   - [Get Soil State](#3-get-soil-state)
   - [Get SMS History](#4-get-sms-history)
   - [Get Savings Summary](#5-get-savings-summary)
   - [Trigger Manual Alert](#6-trigger-manual-alert)
   - [Get Alerts by Phone](#7-get-alerts-by-phone)
   - [Delete Alert](#8-delete-alert)
3. [Error Handling](#error-handling)
4. [React Native Examples](#react-native-examples)

---

## Authentication

Currently, the API uses **API Key authentication** (to be implemented) or **open access** for MVP.

**Future:** JWT tokens with user authentication.

---

## Endpoints

### 1. Register Farmer

Register a new farmer for irrigation alerts.

**Endpoint:** `POST /irrigation/register`

**Description:** Creates a farmer profile, initializes soil moisture tracking, sets up daily EventBridge schedule, and sends confirmation SMS.

#### Request

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "name": "Ramesh Kumar",
  "phone": "+919910890180",
  "district": "Karnal",
  "state": "Haryana",
  "crop": "wheat",
  "sowingDate": "2026-01-15",
  "areaAcres": 5.0,
  "irrMethod": "flood",
  "alertTime": "17:00",
  "language": "hi"
}
```

**Parameters:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `name` | string | Yes | Farmer's full name | "Ramesh Kumar" |
| `phone` | string | Yes | Phone number in E.164 format | "+919910890180" |
| `district` | string | Yes | District name | "Karnal" |
| `state` | string | Yes | State name | "Haryana" |
| `crop` | string | Yes | Crop type | "wheat", "rice", "maize", "sugarcane", "cotton", "mustard" |
| `sowingDate` | string | Yes | Sowing date (ISO format) | "2026-01-15" |
| `areaAcres` | number | Yes | Farm area in acres | 5.0 |
| `irrMethod` | string | No | Irrigation method (default: "flood") | "flood", "drip", "sprinkler" |
| `alertTime` | string | No | Alert time in IST (default: "17:00") | "17:00" |
| `language` | string | No | Language preference (default: "auto") | "en", "hi", "auto" |

**Supported Crops:**
- `wheat` - Wheat (120 days, 6 stages)
- `rice` - Rice (130 days, 6 stages)
- `maize` - Maize (90 days, 5 stages)
- `sugarcane` - Sugarcane (365 days, 4 stages)
- `cotton` - Cotton (180 days, 5 stages)
- `mustard` - Mustard (110 days, 5 stages)

**Supported Districts:**
Karnal, Ludhiana, Amritsar, Meerut, Varanasi, Nagpur, Pune, Guntur, Coimbatore, Thiruvananthapuram, Patna, Jaipur

#### Response

**Success (200 OK):**
```json
{
  "farmerId": "91761321-ff4a-4dd8-9e5c-b3c0a0f8103d",
  "crop": "wheat",
  "firstAlertDate": "2026-03-01",
  "soilMoistureInit": 50,
  "message": "Registration successful"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `farmerId` | string | Unique farmer ID (UUID) - save this! |
| `crop` | string | Registered crop |
| `firstAlertDate` | string | Date of first scheduled alert |
| `soilMoistureInit` | number | Initial soil moisture (mm) |
| `message` | string | Success message |

**Error (400 Bad Request):**
```json
{
  "error": "Missing required fields"
}
```

**Error (500 Internal Server Error):**
```json
{
  "error": "Failed to create EventBridge rule"
}
```

#### React Native Example

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://ys4xa8tu60.execute-api.ap-south-1.amazonaws.com/dev';

async function registerFarmer(farmerData) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/irrigation/register`,
      {
        name: farmerData.name,
        phone: farmerData.phone,
        district: farmerData.district,
        state: farmerData.state,
        crop: farmerData.crop,
        sowingDate: farmerData.sowingDate,
        areaAcres: parseFloat(farmerData.areaAcres),
        irrMethod: farmerData.irrMethod || 'flood',
        alertTime: farmerData.alertTime || '17:00',
        language: farmerData.language || 'auto'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Save farmerId to AsyncStorage
    await AsyncStorage.setItem('farmerId', response.data.farmerId);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || 'Registration failed'
    };
  }
}

// Usage in React Native component
const handleRegister = async () => {
  const result = await registerFarmer({
    name: 'Ramesh Kumar',
    phone: '+919910890180',
    district: 'Karnal',
    state: 'Haryana',
    crop: 'wheat',
    sowingDate: '2026-01-15',
    areaAcres: 5.0,
    irrMethod: 'flood',
    language: 'hi'
  });

  if (result.success) {
    Alert.alert('Success', 'Registration successful! Check your SMS.');
    navigation.navigate('Dashboard');
  } else {
    Alert.alert('Error', result.error);
  }
};
```

---

### 2. Get Farmer Profile

Retrieve farmer profile information.

**Endpoint:** `GET /irrigation/farmer/{farmerId}`

**Description:** Fetches farmer details including crop, location, and settings.

#### Request

**URL Parameters:**
- `farmerId` (string, required) - Farmer's unique ID

**Example:**
```
GET /irrigation/farmer/91761321-ff4a-4dd8-9e5c-b3c0a0f8103d
```

#### Response

**Success (200 OK):**
```json
{
  "farmerId": "91761321-ff4a-4dd8-9e5c-b3c0a0f8103d",
  "name": "Ramesh Kumar",
  "phone": "+919910890180",
  "district": "Karnal",
  "state": "Haryana",
  "lat": 29.6857,
  "lon": 76.9905,
  "crop": "wheat",
  "sowingDate": "2026-01-15",
  "areaAcres": 5.0,
  "irrMethod": "flood",
  "language": "hi",
  "active": true,
  "createdAt": "2026-02-28T12:00:00.000Z"
}
```

#### React Native Example

```javascript
async function getFarmerProfile(farmerId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/irrigation/farmer/${farmerId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}
```

---

### 3. Get Soil State

Get current soil moisture and crop stage information.

**Endpoint:** `GET /irrigation/soil-state/{farmerId}`

**Description:** Returns real-time soil moisture, current crop stage, and irrigation status.

#### Request

**URL Parameters:**
- `farmerId` (string, required)

#### Response

**Success (200 OK):**
```json
{
  "farmerId": "91761321-ff4a-4dd8-9e5c-b3c0a0f8103d",
  "soilMoistureMm": 45,
  "soilMoisturePercent": 56,
  "currentStage": "Crown Root",
  "daysSinceSowing": 44,
  "lastRainfallMm": 0,
  "lastDecision": "irrigate",
  "consecutiveDryDays": 3,
  "nextIrrigationDate": "2026-03-02",
  "updatedAt": "2026-02-28T12:44:15.992Z"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `soilMoistureMm` | number | Current soil moisture in mm |
| `soilMoisturePercent` | number | Soil moisture as percentage (0-100%) |
| `currentStage` | string | Current crop growth stage |
| `daysSinceSowing` | number | Days since sowing date |
| `lastRainfallMm` | number | Yesterday's rainfall in mm |
| `lastDecision` | string | Last irrigation decision |
| `consecutiveDryDays` | number | Number of consecutive dry days |
| `nextIrrigationDate` | string | Estimated next irrigation date |

#### React Native Example

```javascript
async function getSoilState(farmerId) {
  const response = await axios.get(
    `${API_BASE_URL}/irrigation/soil-state/${farmerId}`
  );
  return response.data;
}

// Usage in component
const [soilData, setSoilData] = useState(null);

useEffect(() => {
  const fetchSoilState = async () => {
    const farmerId = await AsyncStorage.getItem('farmerId');
    const data = await getSoilState(farmerId);
    setSoilData(data);
  };
  
  fetchSoilState();
  
  // Refresh every 5 minutes
  const interval = setInterval(fetchSoilState, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

---

### 4. Get SMS History

Retrieve SMS alert history for a farmer.

**Endpoint:** `GET /irrigation/sms-history/{farmerId}?limit=10`

**Description:** Returns list of SMS alerts sent to the farmer.

#### Request

**URL Parameters:**
- `farmerId` (string, required)

**Query Parameters:**
- `limit` (number, optional) - Number of records to return (default: 10, max: 50)

#### Response

**Success (200 OK):**
```json
{
  "farmerId": "91761321-ff4a-4dd8-9e5c-b3c0a0f8103d",
  "messages": [
    {
      "timestamp": "2026-02-28T12:49:06.911Z",
      "messageType": "irrigate",
      "messageBody": "[KisanVoice] कल सुबह 6-8 बजे wheat को पानी दें\nचरण: Crown Root | कमी: 60mm\nज़रूरत: 24,000L\nमौसम: 24°C, साफ\nSTOP भेजें रोकने के लिए",
      "deliveryStatus": "delivered",
      "twilioSid": "SMbc02dfff35f90b73c093100e3b88f036"
    },
    {
      "timestamp": "2026-02-27T12:45:00.000Z",
      "messageType": "skip",
      "messageBody": "[KisanVoice] सिंचाई छोड़ें - बारिश आने वाली है (12mm)\nwheat | Crown Root\nबचत: 24,000L - ₹1440\nमौसम: 28°C, बादल\nSTOP भेजें",
      "deliveryStatus": "delivered",
      "twilioSid": "SM1234567890abcdef"
    }
  ],
  "count": 2
}
```

**Message Types:**
- `irrigate` - Irrigation needed
- `skip` - Skip irrigation (rain expected)
- `recovery` - Rain didn't arrive, irrigate now
- `critical_monsoon` - Critical alert during monsoon
- `reassurance` - No irrigation needed
- `weekly` - Weekly summary
- `confirm` - Registration confirmation

#### React Native Example

```javascript
async function getSMSHistory(farmerId, limit = 10) {
  const response = await axios.get(
    `${API_BASE_URL}/irrigation/sms-history/${farmerId}?limit=${limit}`
  );
  return response.data;
}

// Display in FlatList
<FlatList
  data={smsHistory}
  keyExtractor={(item) => item.timestamp}
  renderItem={({ item }) => (
    <View style={styles.messageCard}>
      <Text style={styles.messageType}>{item.messageType.toUpperCase()}</Text>
      <Text style={styles.messageBody}>{item.messageBody}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleString('en-IN')}
      </Text>
      <View style={styles.statusBadge}>
        <Text>{item.deliveryStatus}</Text>
      </View>
    </View>
  )}
/>
```

---

### 5. Get Savings Summary

Get water and money savings summary.

**Endpoint:** `GET /irrigation/savings/{farmerId}?period=week`

**Description:** Returns water savings, money saved, and CO₂ reduction.

#### Request

**URL Parameters:**
- `farmerId` (string, required)

**Query Parameters:**
- `period` (string, optional) - Time period: "week", "month", "season" (default: "week")

#### Response

**Success (200 OK):**
```json
{
  "farmerId": "91761321-ff4a-4dd8-9e5c-b3c0a0f8103d",
  "period": "week",
  "startDate": "2026-02-22",
  "endDate": "2026-02-28",
  "summary": {
    "litresSaved": 48000,
    "moneySavedRs": 2880,
    "co2SavedKg": 14.4,
    "irrigationsDone": 2,
    "irrigationsSkipped": 2,
    "skipRate": 50
  },
  "seasonTotal": {
    "litresSaved": 120000,
    "moneySavedRs": 7200,
    "co2SavedKg": 36
  }
}
```

#### React Native Example

```javascript
async function getSavings(farmerId, period = 'week') {
  const response = await axios.get(
    `${API_BASE_URL}/irrigation/savings/${farmerId}?period=${period}`
  );
  return response.data;
}

// Display savings card
<View style={styles.savingsCard}>
  <Text style={styles.title}>This Week's Savings</Text>
  <View style={styles.stat}>
    <Icon name="water-drop" size={24} color="#2196F3" />
    <Text style={styles.value}>{savings.litresSaved.toLocaleString()}L</Text>
    <Text style={styles.label}>Water Saved</Text>
  </View>
  <View style={styles.stat}>
    <Icon name="currency-rupee" size={24} color="#4CAF50" />
    <Text style={styles.value}>₹{savings.moneySavedRs}</Text>
    <Text style={styles.label}>Money Saved</Text>
  </View>
  <View style={styles.stat}>
    <Icon name="leaf" size={24} color="#8BC34A" />
    <Text style={styles.value}>{savings.co2SavedKg}kg</Text>
    <Text style={styles.label}>CO₂ Reduced</Text>
  </View>
</View>
```

---

### 6. Trigger Manual Alert

Manually trigger irrigation intelligence check.

**Endpoint:** `POST /irrigation/trigger/{farmerId}`

**Description:** Immediately runs the daily intelligence Lambda to check if irrigation is needed and sends SMS if required.

#### Request

**URL Parameters:**
- `farmerId` (string, required)

**Body:** None required

#### Response

**Success (200 OK):**
```json
{
  "farmerId": "91761321-ff4a-4dd8-9e5c-b3c0a0f8103d",
  "decision": "irrigate",
  "reason": "Deficit 60.0mm exceeds threshold 44.0mm",
  "soilMoisture": 20,
  "deficit": 60,
  "messageSent": true,
  "timestamp": "2026-02-28T12:49:06.911Z"
}
```

**Possible Decisions:**
- `irrigate` - Irrigation needed
- `skip` - Skip irrigation (rain coming)
- `none` - Soil moisture adequate
- `critical_monsoon` - Critical alert
- `recovery` - Rain missed, irrigate now
- `reassurance` - Weekly status update

#### React Native Example

```javascript
async function triggerManualCheck(farmerId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/irrigation/trigger/${farmerId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error triggering check:', error);
    throw error;
  }
}

// Button handler
const handleManualCheck = async () => {
  setLoading(true);
  try {
    const result = await triggerManualCheck(farmerId);
    
    if (result.messageSent) {
      Alert.alert(
        'Alert Sent',
        `Decision: ${result.decision}\nReason: ${result.reason}\nCheck your SMS!`
      );
    } else {
      Alert.alert(
        'No Alert Needed',
        `Soil moisture is adequate (${result.soilMoisture}mm)`
      );
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to check irrigation status');
  } finally {
    setLoading(false);
  }
};
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters or missing required fields |
| 404 | Not Found | Farmer ID not found |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | External service (Twilio, OpenWeatherMap) unavailable |

### React Native Error Handler

```javascript
function handleAPIError(error) {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 404:
        return 'Farmer not found. Please register first.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable.';
      default:
        return data.error || 'An error occurred';
    }
  } else if (error.request) {
    // No response received
    return 'Network error. Please check your connection.';
  } else {
    // Request setup error
    return 'Request failed. Please try again.';
  }
}

// Usage
try {
  const result = await registerFarmer(data);
} catch (error) {
  const errorMessage = handleAPIError(error);
  Alert.alert('Error', errorMessage);
}
```

---

## React Native Complete Integration Example

### API Service Module

```javascript
// services/irrigationAPI.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://ys4xa8tu60.execute-api.ap-south-1.amazonaws.com/dev';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const IrrigationAPI = {
  // Register farmer
  registerFarmer: async (farmerData) => {
    const response = await api.post('/irrigation/register', farmerData);
    return response.data;
  },

  // Get farmer profile
  getFarmerProfile: async (farmerId) => {
    const response = await api.get(`/irrigation/farmer/${farmerId}`);
    return response.data;
  },

  // Get soil state
  getSoilState: async (farmerId) => {
    const response = await api.get(`/irrigation/soil-state/${farmerId}`);
    return response.data;
  },

  // Get SMS history
  getSMSHistory: async (farmerId, limit = 10) => {
    const response = await api.get(
      `/irrigation/sms-history/${farmerId}?limit=${limit}`
    );
    return response.data;
  },

  // Get savings
  getSavings: async (farmerId, period = 'week') => {
    const response = await api.get(
      `/irrigation/savings/${farmerId}?period=${period}`
    );
    return response.data;
  },

  // Trigger manual check
  triggerManualCheck: async (farmerId) => {
    const response = await api.post(`/irrigation/trigger/${farmerId}`);
    return response.data;
  }
};

export default IrrigationAPI;
```

### React Native Screen Example

```javascript
// screens/IrrigationDashboard.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IrrigationAPI from '../services/irrigationAPI';

export default function IrrigationDashboard() {
  const [farmerId, setFarmerId] = useState(null);
  const [soilState, setSoilState] = useState(null);
  const [savings, setSavings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFarmerId();
  }, []);

  useEffect(() => {
    if (farmerId) {
      fetchData();
    }
  }, [farmerId]);

  const loadFarmerId = async () => {
    const id = await AsyncStorage.getItem('farmerId');
    setFarmerId(id);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [soilData, savingsData] = await Promise.all([
        IrrigationAPI.getSoilState(farmerId),
        IrrigationAPI.getSavings(farmerId, 'week')
      ]);
      setSoilState(soilData);
      setSavings(savingsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleManualCheck = async () => {
    try {
      const result = await IrrigationAPI.triggerManualCheck(farmerId);
      Alert.alert(
        result.messageSent ? 'Alert Sent' : 'No Alert Needed',
        result.reason
      );
      await fetchData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to check irrigation status');
    }
  };

  if (!soilState || !savings) {
    return <Text>Loading...</Text>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Soil Moisture Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Soil Moisture</Text>
        <View style={styles.gaugeContainer}>
          <Text style={styles.gaugeValue}>
            {soilState.soilMoisturePercent}%
          </Text>
          <View style={styles.gauge}>
            <View
              style={[
                styles.gaugeFill,
                { width: `${soilState.soilMoisturePercent}%` }
              ]}
            />
          </View>
        </View>
        <Text style={styles.cardSubtext}>
          {soilState.soilMoistureMm}mm / 80mm
        </Text>
      </View>

      {/* Crop Stage Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Stage</Text>
        <Text style={styles.stageText}>{soilState.currentStage}</Text>
        <Text style={styles.cardSubtext}>
          Day {soilState.daysSinceSowing}
        </Text>
      </View>

      {/* Savings Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Week's Savings</Text>
        <View style={styles.savingsRow}>
          <View style={styles.savingsStat}>
            <Text style={styles.savingsValue}>
              {savings.summary.litresSaved.toLocaleString()}L
            </Text>
            <Text style={styles.savingsLabel}>Water</Text>
          </View>
          <View style={styles.savingsStat}>
            <Text style={styles.savingsValue}>
              ₹{savings.summary.moneySavedRs}
            </Text>
            <Text style={styles.savingsLabel}>Money</Text>
          </View>
          <View style={styles.savingsStat}>
            <Text style={styles.savingsValue}>
              {savings.summary.co2SavedKg}kg
            </Text>
            <Text style={styles.savingsLabel}>CO₂</Text>
          </View>
        </View>
      </View>

      {/* Manual Check Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleManualCheck}
      >
        <Text style={styles.buttonText}>Check Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  gaugeContainer: {
    alignItems: 'center'
  },
  gaugeValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  gauge: {
    width: '100%',
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: '#4CAF50'
  },
  stageText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333'
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  savingsStat: {
    alignItems: 'center'
  },
  savingsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  savingsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  cardSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8
  }
});
```

---

## Rate Limits

- **Registration:** 10 requests per minute per IP
- **Data fetching:** 100 requests per minute per farmer
- **Manual trigger:** 5 requests per hour per farmer

---

## Support

For API issues or questions:
- Email: support@kisanvoice.com
- GitHub: https://github.com/kisanvoice/irrigation-api
- Documentation: https://docs.kisanvoice.com

---

**Last Updated:** February 28, 2026  
**API Version:** 1.0.0


### 7. Get Alerts by Phone

Retrieve all SMS alerts for a farmer using their phone number.

**Endpoint:** `GET /irrigation/alerts/phone/{phone}`

**Description:** Fetches all SMS alerts sent to a farmer identified by their phone number. Useful for displaying alert history without needing farmerId.

#### Request

**URL Parameters:**
- `phone` (string, required) - Phone number in E.164 format (e.g., +919910890180)

**Example:**
```
GET /irrigation/alerts/phone/+919910890180
```

#### Response

**Success (200 OK):**
```json
{
  "phone": "+919910890180",
  "farmerId": "91761321-ff4a-4dd8-9e5c-b3c0a0f8103d",
  "farmerName": "Raj Kumar",
  "crop": "wheat",
  "totalAlerts": 2,
  "alerts": [
    {
      "alertId": "2026-02-28T12:49:06.911Z",
      "timestamp": "2026-02-28T12:49:06.911Z",
      "messageType": "irrigate",
      "messageBody": "[KisanVoice] कल सुबह 6-8 बजे wheat को पानी दें...",
      "deliveryStatus": "delivered",
      "twilioSid": "SMbc02dfff35f90b73c093100e3b88f036"
    }
  ]
}
```

#### React Native Example

```javascript
async function getAlertsByPhone(phone) {
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  const response = await axios.get(
    `${API_BASE_URL}/irrigation/alerts/phone/${encodeURIComponent(formattedPhone)}`
  );
  return response.data;
}
```

---

### 8. Delete Alert

Delete a specific SMS alert from history.

**Endpoint:** `DELETE /irrigation/alerts/delete/{farmerId}/{alertId}`

**Description:** Permanently deletes an alert from the SMS history.

#### Request

**URL Parameters:**
- `farmerId` (string, required) - Farmer's unique ID
- `alertId` (string, required) - Alert ID (timestamp)

**Example:**
```
DELETE /irrigation/alerts/delete/91761321-ff4a-4dd8-9e5c-b3c0a0f8103d/2026-02-28T12:44:15.992Z
```

#### Response

**Success (200 OK):**
```json
{
  "message": "Alert deleted successfully",
  "farmerId": "91761321-ff4a-4dd8-9e5c-b3c0a0f8103d",
  "alertId": "2026-02-28T12:44:15.992Z",
  "deletedAlert": {
    "messageType": "irrigate",
    "timestamp": "2026-02-28T12:44:15.992Z"
  }
}
```

#### React Native Example

```javascript
async function deleteAlert(farmerId, alertId) {
  const response = await axios.delete(
    `${API_BASE_URL}/irrigation/alerts/delete/${farmerId}/${encodeURIComponent(alertId)}`
  );
  return response.data;
}

// With confirmation
const handleDeleteAlert = (alertId) => {
  Alert.alert('Delete Alert', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        await deleteAlert(farmerId, alertId);
        setAlerts(alerts.filter(a => a.alertId !== alertId));
      }
    }
  ]);
};
```

---

## Complete API Service with New Endpoints

```javascript
// services/irrigationAPI.js - Updated
export const IrrigationAPI = {
  // ... existing methods ...

  // Get alerts by phone number
  getAlertsByPhone: async (phone) => {
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    const response = await api.get(
      `/irrigation/alerts/phone/${encodeURIComponent(formattedPhone)}`
    );
    return response.data;
  },

  // Delete specific alert
  deleteAlert: async (farmerId, alertId) => {
    const response = await api.delete(
      `/irrigation/alerts/delete/${farmerId}/${encodeURIComponent(alertId)}`
    );
    return response.data;
  },

  // Bulk delete alerts
  deleteMultipleAlerts: async (farmerId, alertIds) => {
    const deletePromises = alertIds.map(alertId =>
      api.delete(`/irrigation/alerts/delete/${farmerId}/${encodeURIComponent(alertId)}`)
    );
    const results = await Promise.allSettled(deletePromises);
    return {
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }
};
```

---

**Last Updated:** February 28, 2026  
**API Version:** 1.0.1 (Added alert management endpoints)


---

## Weather Alert System (Automatic)

### Overview

The system automatically monitors critical weather conditions 24/7 and sends immediate alerts to protect crops and farmers. **No API calls needed** - fully automatic based on GPS location.

### Monitoring Schedule

**Frequency:** Every 3 hours (24/7)
```
00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 UTC
(05:30, 08:30, 11:30, 14:30, 17:30, 20:30, 23:30, 02:30 IST)
```

**Smart Throttling:**
- Maximum 1 weather alert per 6 hours per farmer
- Prevents alert fatigue
- Only sends highest severity alert

### Alert Types

#### 1. Heatwave Alert (> 40°C)
- **Trigger:** Temperature exceeds 40°C
- **Critical:** > 45°C
- **Message Type:** `weather_heatwave`
- **Action:** Irrigate early morning/evening, avoid midday work

#### 2. Frost Alert (< 5°C)
- **Trigger:** Temperature drops below 5°C
- **Critical:** < 0°C (freezing)
- **Message Type:** `weather_frost`
- **Action:** Cover crops, light irrigation before frost

#### 3. Storm Alert (Thunderstorm)
- **Trigger:** Thunderstorm detected in current weather
- **Message Type:** `weather_storm`
- **Action:** Secure equipment, stay indoors

#### 4. Heavy Rain Alert (> 50mm)
- **Trigger:** Forecast shows > 50mm rain in 48 hours
- **Message Type:** `weather_heavyRain`
- **Action:** Check drainage, postpone spraying, skip irrigation

#### 5. High Wind Alert (> 40 km/h)
- **Trigger:** Wind speed exceeds 40 km/h
- **Extreme:** > 60 km/h
- **Message Type:** `weather_highWind`
- **Action:** Secure items, postpone spraying

#### 6. Drought Alert (10+ days no rain)
- **Trigger:** 10+ consecutive days without rain
- **Severe:** 15+ days
- **Message Type:** `weather_drought`
- **Action:** Irrigate immediately, mulch to conserve moisture

### Example Weather Alert SMS

**Hindi (Default for +91):**
```
[KisanVoice] ⚠️ गर्मी की चेतावनी
wheat खतरे में! तापमान: 42°C
सुबह/शाम सिंचाई करें
दोपहर में काम न करें
STOP भेजें
```

**English:**
```
[KisanVoice] ⚠️ HEATWAVE ALERT
wheat at risk! Temp: 42°C
Irrigate early morning/evening
Avoid midday work
Reply STOP
```

### React Native Integration

#### Filter Weather Alerts from Alert History

```javascript
// Get all alerts including weather alerts
const fetchWeatherAlerts = async (phoneNumber) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/irrigation/alerts/phone/${phoneNumber}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    
    if (response.ok) {
      // Filter only weather alerts
      const weatherAlerts = data.alerts.filter(alert => 
        alert.messageType.startsWith('weather_')
      );
      
      // Sort by timestamp (newest first)
      weatherAlerts.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      return weatherAlerts;
    }
  } catch (error) {
    console.error('Error fetching weather alerts:', error);
    throw error;
  }
};
```

#### Group Weather Alerts by Type

```javascript
const groupWeatherAlertsByType = (alerts) => {
  const weatherAlerts = alerts.filter(a => 
    a.messageType.startsWith('weather_')
  );
  
  return weatherAlerts.reduce((acc, alert) => {
    const type = alert.messageType.replace('weather_', '');
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(alert);
    return acc;
  }, {});
};

// Usage
const alertsByType = groupWeatherAlertsByType(allAlerts);
console.log('Heatwave alerts:', alertsByType.heatwave);
console.log('Storm alerts:', alertsByType.storm);
```

#### Display Weather Alert with Icon

```javascript
const WeatherAlertCard = ({ alert }) => {
  const getAlertIcon = (type) => {
    const icons = {
      weather_heatwave: '⚠️',
      weather_frost: '❄️',
      weather_storm: '🌪️',
      weather_heavyRain: '🌧️',
      weather_highWind: '💨',
      weather_drought: '🏜️'
    };
    return icons[type] || '⚠️';
  };

  const getAlertColor = (severity) => {
    const colors = {
      critical: '#DC2626', // Red
      high: '#F59E0B',     // Orange
      medium: '#FCD34D'    // Yellow
    };
    return colors[severity] || '#6B7280';
  };

  return (
    <View style={[
      styles.alertCard,
      { borderLeftColor: getAlertColor(alert.severity) }
    ]}>
      <Text style={styles.alertIcon}>
        {getAlertIcon(alert.messageType)}
      </Text>
      <View style={styles.alertContent}>
        <Text style={styles.alertType}>
          {alert.messageType.replace('weather_', '').toUpperCase()}
        </Text>
        <Text style={styles.alertMessage}>
          {alert.messageBody}
        </Text>
        <Text style={styles.alertTime}>
          {new Date(alert.timestamp).toLocaleString()}
        </Text>
      </View>
    </View>
  );
};
```

#### Weather Alert Statistics

```javascript
const getWeatherAlertStats = (alerts) => {
  const weatherAlerts = alerts.filter(a => 
    a.messageType.startsWith('weather_')
  );
  
  const stats = {
    total: weatherAlerts.length,
    byType: {},
    bySeverity: {
      critical: 0,
      high: 0,
      medium: 0
    },
    last24Hours: 0,
    lastWeek: 0
  };

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const week = 7 * day;

  weatherAlerts.forEach(alert => {
    // Count by type
    const type = alert.messageType.replace('weather_', '');
    stats.byType[type] = (stats.byType[type] || 0) + 1;
    
    // Count by severity
    if (alert.severity) {
      stats.bySeverity[alert.severity]++;
    }
    
    // Count by time
    const alertTime = new Date(alert.timestamp).getTime();
    if (now - alertTime < day) {
      stats.last24Hours++;
    }
    if (now - alertTime < week) {
      stats.lastWeek++;
    }
  });

  return stats;
};

// Usage
const stats = getWeatherAlertStats(allAlerts);
console.log(`Total weather alerts: ${stats.total}`);
console.log(`Critical alerts: ${stats.bySeverity.critical}`);
console.log(`Alerts in last 24h: ${stats.last24Hours}`);
```

### Alert Message Types Reference

| Message Type | Description | Severity Levels |
|--------------|-------------|-----------------|
| `weather_heatwave` | Temperature > 40°C | high, critical |
| `weather_frost` | Temperature < 5°C | high, critical |
| `weather_storm` | Thunderstorm detected | high |
| `weather_heavyRain` | Heavy rain forecast | medium |
| `weather_highWind` | High wind speed | medium, high |
| `weather_drought` | No rain for 10+ days | high, critical |

### GPS-Based Accuracy

Weather alerts use the farmer's exact GPS coordinates (if provided during registration) for maximum accuracy:

**With GPS:**
```javascript
// Registration with GPS
{
  "phone": "+919910890180",
  "name": "Rajesh Kumar",
  "crop": "wheat",
  "cropStage": "flowering",
  "district": "Karnal",
  "lat": 29.6857,  // Exact farm location
  "lon": 76.9905
}
```

**Benefits:**
- Micro-climate detection
- Farm-specific weather conditions
- More accurate alerts
- Better crop protection

### Complete Documentation

For detailed information about weather alerts, see:
- `WEATHER_ALERTS_GUIDE.md` - Complete weather alert documentation
- `NOTIFICATION_SCHEDULE.md` - Full notification timeline
- `MESSAGE_TYPES_EXPLAINED.md` - All message types explained

---

**Weather Alert System Status:** ✅ Live and Monitoring (24/7)  
**Last Updated:** February 28, 2026
