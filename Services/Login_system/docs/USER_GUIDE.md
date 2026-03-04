# User Guide

## Introduction

This guide helps developers integrate the KisanVoice Authentication API into their applications. Whether you're building a React Native mobile app, web application, or another service, this guide provides step-by-step instructions.

## Getting Started

### Base URL

All API requests should be made to:
```
https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev
```

For production, replace `dev` with `prod`.

### Prerequisites

- Basic understanding of REST APIs
- HTTP client library (fetch, axios, etc.)
- Secure storage for JWT tokens

## Authentication Flow

### Step 1: Send OTP

Request an OTP to be sent to the user's phone number.

```javascript
const sendOTP = async (phoneNumber) => {
  const response = await fetch(
    'https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev/auth/send-otp',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phoneNumber, // e.g., "+919876543210"
      }),
    }
  );
  
  return await response.json();
};

// Usage
const result = await sendOTP('+919876543210');
if (result.success) {
  console.log('OTP sent successfully');
}
```

**Important**: Phone numbers must include the country code (e.g., +91 for India).

### Step 2: Verify OTP

Once the user receives the OTP, verify it and obtain a JWT token.

```javascript
const verifyOTP = async (phoneNumber, otp) => {
  const response = await fetch(
    'https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev/auth/verify-otp',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phoneNumber,
        otp: otp,
      }),
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    // Store token securely
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('isProfileComplete', data.isProfileComplete);
    return data;
  }
  
  throw new Error(data.message);
};

// Usage
try {
  const result = await verifyOTP('+919876543210', '123456');
  console.log('Token:', result.token);
  console.log('Profile Complete:', result.isProfileComplete);
} catch (error) {
  console.error('Verification failed:', error.message);
}
```

### Step 3: Check Profile Status

After successful authentication, check if the user needs to complete their profile.

```javascript
const isProfileComplete = localStorage.getItem('isProfileComplete') === 'true';

if (!isProfileComplete) {
  // Redirect to onboarding screen
  navigateToOnboarding();
} else {
  // Redirect to main app
  navigateToHome();
}
```

## Profile Management

### Complete User Profile

If the user hasn't completed their profile, collect the required information and submit it.

```javascript
const onboardUser = async (profileData) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(
    'https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev/farmer/onboard',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: profileData.name,
        userType: profileData.userType,        // "farmer" or "provider"
        totalLandArea: profileData.totalLandArea,  // number in acres
        latitude: profileData.latitude,
        longitude: profileData.longitude,
        city: profileData.city,
        state: profileData.state,
      }),
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('isProfileComplete', 'true');
    return data;
  }
  
  throw new Error(data.message);
};

// Usage
try {
  await onboardUser({
    name: 'Ramesh Kumar',
    userType: 'farmer',
    totalLandArea: 5.5,
    latitude: 28.4595,
    longitude: 77.0266,
    city: 'Gurgaon',
    state: 'Haryana',
  });
  console.log('Profile completed successfully');
} catch (error) {
  console.error('Onboarding failed:', error.message);
}
```

### Get User Profile

Retrieve the authenticated user's profile information.

```javascript
const getUserProfile = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(
    'https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev/farmer/profile',
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  if (response.ok) {
    return await response.json();
  }
  
  throw new Error('Failed to fetch profile');
};

// Usage
try {
  const profile = await getUserProfile();
  console.log('User:', profile.name);
  console.log('Type:', profile.userType);
  console.log('Location:', profile.city, profile.state);
} catch (error) {
  console.error('Failed to get profile:', error.message);
}
```

## React Native Integration

### Installation

Install required dependencies:

```bash
npm install @react-native-async-storage/async-storage
```

### API Service Class

Create a reusable API service:

```javascript
// services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev';

class KisanVoiceAPI {
  async sendOTP(phoneNumber) {
    const response = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneNumber }),
    });
    return await response.json();
  }

  async verifyOTP(phoneNumber, otp) {
    const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneNumber, otp }),
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('isProfileComplete', data.isProfileComplete.toString());
    }
    
    return data;
  }

  async onboardUser(profileData) {
    const token = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(`${BASE_URL}/farmer/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    
    const data = await response.json();
    
    if (data.success) {
      await AsyncStorage.setItem('isProfileComplete', 'true');
    }
    
    return data;
  }

  async getProfile() {
    const token = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(`${BASE_URL}/farmer/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    return await response.json();
  }

  async logout() {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('isProfileComplete');
  }

  async isAuthenticated() {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  }
}

export default new KisanVoiceAPI();
```

### Login Screen Example

```javascript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import api from './services/api';

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async () => {
    try {
      const result = await api.sendOTP(phone);
      if (result.success) {
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent to your phone');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const result = await api.verifyOTP(phone, otp);
      if (result.success) {
        if (result.isProfileComplete) {
          navigation.replace('Home');
        } else {
          navigation.replace('Onboarding');
        }
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify OTP');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Phone Number (+919876543210)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      
      {!otpSent ? (
        <Button title="Send OTP" onPress={handleSendOTP} />
      ) : (
        <>
          <TextInput
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Button title="Verify OTP" onPress={handleVerifyOTP} />
        </>
      )}
    </View>
  );
};

export default LoginScreen;
```

## Web Application Integration

### Using Fetch API

```javascript
// utils/auth.js
export const auth = {
  async sendOTP(phone) {
    const response = await fetch(
      'https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev/auth/send-otp',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      }
    );
    return await response.json();
  },

  async verifyOTP(phone, otp) {
    const response = await fetch(
      'https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev/auth/verify-otp',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      }
    );
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('isProfileComplete', data.isProfileComplete);
    }
    
    return data;
  },

  getToken() {
    return localStorage.getItem('authToken');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isProfileComplete');
  },
};
```

### Using Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev',
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## Best Practices

### 1. Token Storage

**React Native**: Use `@react-native-async-storage/async-storage`
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('authToken', token);
```

**Web**: Use `localStorage` or secure cookies
```javascript
localStorage.setItem('authToken', token);
```

**Never**: Store tokens in plain text files or expose them in URLs

### 2. Error Handling

Always wrap API calls in try-catch blocks:

```javascript
try {
  const result = await api.sendOTP(phone);
  // Handle success
} catch (error) {
  // Handle error
  console.error('API Error:', error.message);
  showErrorToUser(error.message);
}
```

### 3. Token Expiration

Tokens expire after 7 days. Handle 401 errors by redirecting to login:

```javascript
if (response.status === 401) {
  // Token expired or invalid
  clearAuthToken();
  redirectToLogin();
}
```

### 4. Phone Number Validation

Validate phone numbers before sending to API:

```javascript
const isValidPhone = (phone) => {
  return /^\+\d{10,15}$/.test(phone);
};

if (!isValidPhone(phoneNumber)) {
  alert('Please enter a valid phone number with country code');
  return;
}
```

### 5. Loading States

Show loading indicators during API calls:

```javascript
const [loading, setLoading] = useState(false);

const handleLogin = async () => {
  setLoading(true);
  try {
    await api.verifyOTP(phone, otp);
  } finally {
    setLoading(false);
  }
};
```

## Common Issues

### Issue: "Invalid phone number format"

**Solution**: Ensure phone number includes country code
```javascript
// ❌ Wrong
const phone = "9876543210";

// ✅ Correct
const phone = "+919876543210";
```

### Issue: "Invalid OTP"

**Possible causes**:
- OTP expired (10-minute validity)
- Incorrect OTP entered
- Maximum attempts exceeded (3 per 5 minutes)

**Solution**: Request a new OTP

### Issue: "Missing or invalid authorization header"

**Solution**: Include Bearer token in Authorization header
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Issue: "totalLandArea must be a positive number"

**Solution**: Ensure value is a number, not a string
```javascript
// ❌ Wrong
totalLandArea: "5.5"

// ✅ Correct
totalLandArea: 5.5
```

## Testing

### Test Phone Numbers

For development, use Twilio test credentials to avoid SMS charges.

### Postman Collection

Import the provided Postman collection for testing:
1. Open Postman
2. Import `KisanVoice_API.postman_collection.json`
3. Update environment variables if needed
4. Run requests in sequence

### Test Flow

1. Send OTP to your phone number
2. Receive OTP via SMS
3. Verify OTP and save token
4. Complete onboarding with test data
5. Retrieve profile to verify

## Support

For issues or questions:
- Check the [API Documentation](./API.md)
- Review [Architecture](./ARCHITECTURE.md)
- Contact the development team

## Next Steps

- Implement refresh token mechanism
- Add profile update endpoint
- Implement user deletion (GDPR compliance)
- Add multi-language support
- Implement push notifications
