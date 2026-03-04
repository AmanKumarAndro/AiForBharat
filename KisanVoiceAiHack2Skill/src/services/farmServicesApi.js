import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod';

/**
 * Convert phone number to Provider ID.
 * Server stores as PRV_+919910890180 (PRV_ + full phone including +91)
 */
const toProviderId = (phone = '') => `PRV_${phone}`;

/** Save the real provider_id returned by the server after registration */
const saveProviderId = async (id) => {
    try { await AsyncStorage.setItem('helpingHandProviderId', id); } catch (e) { }
};

/** Load the stored provider_id (saved after registration) */
const getStoredProviderId = async (phone = '') => {
    try {
        const stored = await AsyncStorage.getItem('helpingHandProviderId');
        if (stored) return stored;
    } catch (e) { }
    // fallback: derive from phone
    return toProviderId(phone);
};

const farmServicesApi = {
    // ── Utility ──────────────────────────────────────────────────────────
    toProviderId,
    saveProviderId,
    getStoredProviderId,

    // ── Map / Discovery ──────────────────────────────────────────────────
    /** GET /providers-map */
    getProviders: async (pincode, serviceType = null) => {
        try {
            let url = `${BASE_URL}/providers-map`;
            const params = [];
            if (pincode) params.push(`pincode=${pincode}`);
            if (serviceType) params.push(`service_type=${serviceType}`);
            if (params.length) url += '?' + params.join('&');
            const response = await axios.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Failed to fetch providers' };
        }
    },

    // ── Farmer Flow ───────────────────────────────────────────────────────
    /** POST /request — farmer books a service */
    createRequest: async (farmerId, farmerName, serviceType, pincode, estimatedPrice = 500) => {
        try {
            const response = await axios.post(`${BASE_URL}/request`, {
                farmer_id: farmerId,
                farmer_name: farmerName,
                service_type: serviceType,
                farmer_pincode: pincode,
                estimated_price: estimatedPrice,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Failed to create request' };
        }
    },

    /** GET /status/:requestId — poll single request */
    getRequestStatus: async (requestId) => {
        try {
            const response = await axios.get(`${BASE_URL}/status/${requestId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Failed to fetch status' };
        }
    },

    /** GET /farmer-requests/:farmerId — all requests with summary */
    getFarmerRequests: async (farmerId, status = null) => {
        try {
            let url = `${BASE_URL}/farmer-requests/${farmerId}`;
            if (status) url += `?status=${status}`;
            const response = await axios.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Failed to fetch requests' };
        }
    },

    /** POST /complete — farmer rates & completes service */
    completeAndRate: async (requestId, rating, feedback = '') => {
        try {
            const response = await axios.post(`${BASE_URL}/complete`, {
                request_id: requestId,
                rating,
                ...(feedback ? { feedback } : {}),
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Failed to complete request' };
        }
    },

    /** POST /provider — register as provider */
    registerProvider: async ({ phone, name, serviceType, pincode, pricePerHour, latitude, longitude }) => {
        try {
            const response = await axios.post(`${BASE_URL}/provider`, {
                phone,
                name,
                service_type: serviceType,
                pincode,
                price_per_hour: pricePerHour,
                latitude: latitude || 18.5204,
                longitude: longitude || 73.8567,
            });
            // Save the server-assigned provider_id so dashboard uses exact ID
            if (response.data?.provider_id) {
                await saveProviderId(response.data.provider_id);
            }
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Failed to register provider' };
        }
    },

    /** POST /accept — provider accepts via app */
    acceptRequest: async (requestId, providerId) => {
        try {
            const response = await axios.post(`${BASE_URL}/accept`, {
                request_id: requestId,
                provider_id: providerId,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                alreadyTaken: error.response?.status === 409,
                error: error.response?.data?.error || 'Failed to accept request',
            };
        }
    },

    /** POST /test-accept — accept without SMS reply (for testing/demo) */
    testAccept: async (providerPhone) => {
        try {
            const response = await axios.post(`${BASE_URL}/test-accept`, {
                provider_phone: providerPhone,
            });
            return { success: true, data: response.data };
        } catch (error) {
            const status = error.response?.status;
            return {
                success: false,
                noRequests: status === 404,
                alreadyTaken: status === 409,
                error: error.response?.data?.error || 'Failed to test-accept',
            };
        }
    },

    /** GET /provider-jobs/:providerId — all jobs for this provider */
    getProviderJobs: async (providerId, status = null) => {
        try {
            // Do NOT encode providerId — server expects raw + in PRV_+919910890180
            let url = `${BASE_URL}/provider-jobs/${providerId}`;
            if (status) url += `?status=${status}`;
            const response = await axios.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Failed to fetch jobs' };
        }
    },
};

export default farmServicesApi;
