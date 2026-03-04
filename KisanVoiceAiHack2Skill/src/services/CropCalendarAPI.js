import { apiClient } from '../config/api';

const CropCalendarAPI = {
    /**
     * ENDPOINT 4: Get Crop Calendar
     * GET /irrigation/crop-calendar/{crop}
     */
    getCropCalendar: async (crop, options = {}) => {
        try {
            const params = new URLSearchParams();

            if (options.language) {
                params.append('language', options.language);
            }

            if (options.currentDay !== undefined) {
                params.append('currentDay', options.currentDay.toString());
            }

            const url = `/irrigation/crop-calendar/${crop}${params.toString() ? '?' + params.toString() : ''}`;
            const response = await apiClient.get(url);

            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch crop calendar');
        }
    },

    // Helper: Calculate days since sowing
    calculateCurrentDay: (sowingDate) => {
        if (!sowingDate) return 1;
        const now = new Date();
        const sowing = new Date(sowingDate);
        const diffDays = Math.ceil((now - sowing) / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1;
    }
};

export default CropCalendarAPI;
