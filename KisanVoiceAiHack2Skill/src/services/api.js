import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev';

class KisanVoiceAPI {
  // Send OTP
  async sendOTP(phoneNumber) {
    try {
      const response = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error('Failed to send OTP: ' + error.message);
    }
  }

  // Verify OTP
  async verifyOTP(phoneNumber, otp) {
    try {
      const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber, otp }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('isProfileComplete', data.isProfileComplete.toString());
        // Cache phone for irrigation pre-fill
        await this.savePhone(phoneNumber);
        // Cache initial location if available in response (some APIs return it)
        if (data.latitude && data.longitude) {
          await this.saveLocation(data.latitude, data.longitude);
        }
      }

      return data;
    } catch (error) {
      throw new Error('Failed to verify OTP: ' + error.message);
    }
  }

  // Onboard User
  async onboardUser(profileData) {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

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
        // Cache name for irrigation pre-fill
        if (profileData.name) {
          await this.saveName(profileData.name);
        }
        // Cache location/district for irrigation pre-fill
        if (profileData.latitude && profileData.longitude) {
          await this.saveLocation(profileData.latitude, profileData.longitude);
        }
        if (profileData.city) {
          await this.saveDistrict(profileData.city);
        }
        if (profileData.userType) {
          await this.saveUserType(profileData.userType);
        }
        if (profileData.totalLandArea) {
          await this.saveLandArea(profileData.totalLandArea);
        }
        if (profileData.state) {
          await this.saveState(profileData.state);
        }
        if (profileData.language) {
          await this.saveLanguage(profileData.language);
        }
      }

      return data;
    } catch (error) {
      throw new Error('Failed to onboard user: ' + error.message);
    }
  }

  // Get Profile
  async getProfile() {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${BASE_URL}/farmer/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        const farmer = data;
        // Populate cache for irrigation pre-fill and profile screen
        if (farmer.name) await this.saveName(farmer.name);
        if (farmer.phone) await this.savePhone(farmer.phone);
        if (farmer.city) await this.saveDistrict(farmer.city);
        if (farmer.state) await this.saveState(farmer.state);
        if (farmer.userType) await this.saveUserType(farmer.userType);
        if (farmer.totalLandArea) await this.saveLandArea(farmer.totalLandArea);
        if (farmer.language) await this.saveLanguage(farmer.language);
        if (farmer.latitude && farmer.longitude) {
          await this.saveLocation(farmer.latitude, farmer.longitude);
        }
        return { success: true, farmer: data };
      }

      return { success: false, ...data };
    } catch (error) {
      throw new Error('Failed to get profile: ' + error.message);
    }
  }

  // Logout
  async logout() {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('isProfileComplete');
      await AsyncStorage.removeItem('userPhone');
      await AsyncStorage.removeItem('userName');
      await AsyncStorage.removeItem('userLat');
      await AsyncStorage.removeItem('userLon');
      await AsyncStorage.removeItem('userDistrict');
      await AsyncStorage.removeItem('userType');
      await AsyncStorage.removeItem('userLandArea');
      await AsyncStorage.removeItem('userState');
      await AsyncStorage.removeItem('userLanguage');
    } catch (error) {
      throw new Error('Failed to logout: ' + error.message);
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Check if profile is complete
  async isProfileComplete() {
    try {
      const isComplete = await AsyncStorage.getItem('isProfileComplete');
      return isComplete === 'true';
    } catch (error) {
      return false;
    }
  }

  // Helper methods for irrigation pre-fill
  async savePhone(phone) {
    try {
      await AsyncStorage.setItem('userPhone', phone);
    } catch (e) {
      console.error('Error saving phone', e);
    }
  }

  async saveName(name) {
    try {
      await AsyncStorage.setItem('userName', name);
    } catch (e) {
      console.error('Error saving name', e);
    }
  }

  async saveLocation(lat, lon) {
    try {
      await AsyncStorage.setItem('userLat', lat.toString());
      await AsyncStorage.setItem('userLon', lon.toString());
    } catch (e) {
      console.error('Error saving location', e);
    }
  }

  async saveDistrict(district) {
    try {
      await AsyncStorage.setItem('userDistrict', district);
    } catch (e) {
      console.error('Error saving district', e);
    }
  }

  async saveUserType(type) {
    try {
      await AsyncStorage.setItem('userType', type);
    } catch (e) {
      console.error('Error saving user type', e);
    }
  }

  async saveLandArea(area) {
    try {
      await AsyncStorage.setItem('userLandArea', area.toString());
    } catch (e) {
      console.error('Error saving land area', e);
    }
  }

  async saveState(state) {
    try {
      await AsyncStorage.setItem('userState', state);
    } catch (e) {
      console.error('Error saving state', e);
    }
  }

  async saveLanguage(lang) {
    try {
      await AsyncStorage.setItem('userLanguage', lang);
    } catch (e) {
      console.error('Error saving language', e);
    }
  }

  async getUserData() {
    try {
      const phone = await AsyncStorage.getItem('userPhone');
      const name = await AsyncStorage.getItem('userName');
      const lat = await AsyncStorage.getItem('userLat');
      const lon = await AsyncStorage.getItem('userLon');
      const district = await AsyncStorage.getItem('userDistrict');
      const userType = await AsyncStorage.getItem('userType');
      const landArea = await AsyncStorage.getItem('userLandArea');
      const state = await AsyncStorage.getItem('userState');
      const language = await AsyncStorage.getItem('userLanguage');

      return {
        phone,
        name,
        lat: lat ? parseFloat(lat) : null,
        lon: lon ? parseFloat(lon) : null,
        district,
        userType,
        landArea: landArea ? parseFloat(landArea) : null,
        state,
        language
      };
    } catch (e) {
      return {
        phone: null, name: null, lat: null, lon: null,
        district: null, userType: null, landArea: null, state: null,
        language: null
      };
    }
  }
}

export default new KisanVoiceAPI();
