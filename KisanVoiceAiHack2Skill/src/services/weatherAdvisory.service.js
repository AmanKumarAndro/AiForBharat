import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

class WeatherAdvisoryService {
    constructor() {
        this.api = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Get weather advisory for a location
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {string} activity - Activity type (default: 'spraying')
     * @returns {Promise<Object>} Weather advisory data
     */
    async getAdvisory(lat, lon, activity = 'spraying') {
        try {
            const response = await this.api.post(API_CONFIG.ENDPOINTS.WEATHER_ADVISORY, {
                lat,
                lon,
                activity,
            });
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            return {
                success: false,
                error: this.handleError(error),
            };
        }
    }

    handleError(error) {
        if (error.response) {
            // Server responded with error
            return {
                message: error.response.data?.error || 'Server error occurred',
                status: error.response.status,
            };
        } else if (error.request) {
            // Request made but no response
            return {
                message: 'Network error. Please check your internet connection.',
                status: 0,
            };
        } else {
            // Something else happened
            return {
                message: error.message || 'An unexpected error occurred',
                status: -1,
            };
        }
    }
}

export default new WeatherAdvisoryService();
