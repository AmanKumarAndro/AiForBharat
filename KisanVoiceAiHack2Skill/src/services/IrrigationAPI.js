import { apiClient } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IrrigationAPI = {
    /**
     * ENDPOINT 1: Register Farmer
     * POST /irrigation/register
     */
    registerFarmer: async (farmerData) => {
        try {
            console.log('Registering Farmer with payload:', JSON.stringify(farmerData, null, 2));
            const response = await apiClient.post('/irrigation/register', farmerData);

            // Save to local storage
            await AsyncStorage.multiSet([
                ['farmerId', response.data.farmerId ? String(response.data.farmerId) : ''],
                ['farmerPhone', response.data.phone || ''],
                ['farmerData', JSON.stringify(response.data)]
            ]);

            return response.data;
        } catch (error) {
            const responseData = error.response?.data;
            console.error('Registration API Error:', responseData || error.message);

            if (error.response?.status === 409) {
                throw new Error('Phone number already registered');
            }

            const apiError = responseData?.error || 'Registration failed';
            const details = responseData?.details;

            let message = apiError;
            if (details) {
                const detailedMsg = Object.entries(details)
                    .map(([field, msg]) => `• ${field}: ${msg}`)
                    .join('\n');
                message += `:\n${detailedMsg}`;
            } else if (responseData) {
                message += `\n\nRaw Response: ${JSON.stringify(responseData)}`;
            }

            throw new Error(message);
        }
    },

    /**
     * ENDPOINT 2: Get Alerts by Phone
     * GET /irrigation/alerts/phone/{phone}
     */
    getAlertsByPhone: async (phone) => {
        try {
            const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
            const encodedPhone = encodeURIComponent(formattedPhone);

            const response = await apiClient.get(`/irrigation/alerts/phone/${encodedPhone}`);

            // Safely sort by timestamp (newest first)
            const incomingAlerts = response.data?.alerts || [];
            const sortedAlerts = incomingAlerts.sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            );

            return {
                ...response.data,
                alerts: sortedAlerts
            };
        } catch (error) {
            if (error.response?.status === 404) {
                throw new Error('Farmer not registered');
            }
            throw new Error('Failed to fetch alerts');
        }
    },

    /**
     * ENDPOINT 3: Delete Alert
     * DELETE /irrigation/alerts/delete/{farmerId}/{alertId}
     */
    deleteAlert: async (farmerId, alertId) => {
        try {
            const cleanAlertId = alertId.replace('sms#', '');
            const encodedAlertId = encodeURIComponent(cleanAlertId);

            const response = await apiClient.delete(
                `/irrigation/alerts/delete/${farmerId}/${encodedAlertId}`
            );

            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                throw new Error('Alert not found');
            }
            throw new Error('Failed to delete alert');
        }
    },

    /**
     * ENDPOINT 6: Unregister Farmer
     * DELETE /irrigation/unregister/{farmerId}?deleteLogs=true
     */
    unregisterFarmer: async (farmerId) => {
        try {
            const response = await apiClient.delete(
                `/irrigation/unregister/${farmerId}?deleteLogs=true`
            );
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                throw new Error('Farmer profile not found');
            }
            throw new Error('Failed to unregister farmer');
        }
    },

    /**
     * ENDPOINT 7: Get Dashboard Data
     * GET /irrigation/dashboard/{farmerId}
     */
    getDashboard: async (farmerId) => {
        try {
            const response = await apiClient.get(`/irrigation/dashboard/${farmerId}`);
            return response.data;
        } catch (error) {
            console.error('Dashboard API Error:', error);
            throw new Error('Failed to fetch dashboard data');
        }
    },

    // Helper methods
    getStoredFarmerData: async () => {
        const data = await AsyncStorage.getItem('farmerData');
        return data ? JSON.parse(data) : null;
    },

    clearFarmerData: async () => {
        await AsyncStorage.multiRemove(['farmerId', 'farmerPhone', 'farmerData']);
    }
};

export default IrrigationAPI;
