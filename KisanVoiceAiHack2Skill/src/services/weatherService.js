/**
 * Weather Service — fetches 7-day forecast from Open-Meteo (free, no API key needed).
 * Uses real location data passed from the screen.
 */

class WeatherService {
    constructor() {
        this.cachedForecast = null;
    }

    /**
     * Get 7-day precipitation forecast using Open-Meteo (free, no key needed).
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Array} Array of daily forecast objects
     */
    async get7DayForecast(lat = 28.6139, lon = 77.2090) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=7`;

            console.log('Weather API URL:', url);
            const response = await fetch(url);
            const data = await response.json();
            console.log('Weather Data:', JSON.stringify(data).substring(0, 300));

            if (!data.daily || !data.daily.time) {
                console.warn('Weather API: unexpected response format');
                return this.cachedForecast || [];
            }

            const forecast = data.daily.time.map((dateStr, idx) => ({
                date: new Date(dateStr),
                temp: Math.round((data.daily.temperature_2m_max[idx] + data.daily.temperature_2m_min[idx]) / 2),
                tempMax: Math.round(data.daily.temperature_2m_max[idx]),
                tempMin: Math.round(data.daily.temperature_2m_min[idx]),
                humidity: 0, // Open-Meteo daily doesn't include humidity in basic plan
                rainMm: Math.round((data.daily.precipitation_sum[idx] || 0) * 10) / 10,
                description: this._weatherCodeToDesc(data.daily.weathercode[idx]),
                icon: this._weatherCodeToEmoji(data.daily.weathercode[idx]),
            }));

            this.cachedForecast = forecast;
            return forecast;
        } catch (error) {
            console.error('Weather fetch error:', error);
            return this.cachedForecast || [];
        }
    }

    /**
     * Check if rain is expected on a specific date.
     * @param {Date} date
     * @param {Array} forecast
     * @returns {{ isRainy: boolean, rainMm: number }}
     */
    checkRainOnDate(date, forecast) {
        const dateStr = date.toISOString().split('T')[0];
        const match = forecast.find(f => f.date.toISOString().split('T')[0] === dateStr);
        if (match && match.rainMm >= 5) {
            return { isRainy: true, rainMm: match.rainMm };
        }
        return { isRainy: false, rainMm: match ? match.rainMm : 0 };
    }

    // WMO Weather Codes → emoji
    _weatherCodeToEmoji(code) {
        if (code === 0) return '☀️';
        if (code <= 3) return '⛅';
        if (code <= 49) return '🌫️';  // Fog
        if (code <= 59) return '🌦️';  // Drizzle
        if (code <= 69) return '🌧️';  // Rain
        if (code <= 79) return '❄️';   // Snow
        if (code <= 84) return '🌧️';  // Rain showers
        if (code <= 86) return '❄️';   // Snow showers
        if (code >= 95) return '⛈️';   // Thunderstorm
        return '🌍';
    }

    // WMO Weather Codes → description
    _weatherCodeToDesc(code) {
        if (code === 0) return 'Clear sky';
        if (code === 1) return 'Mainly clear';
        if (code === 2) return 'Partly cloudy';
        if (code === 3) return 'Overcast';
        if (code <= 49) return 'Fog';
        if (code <= 55) return 'Light drizzle';
        if (code <= 59) return 'Drizzle';
        if (code <= 63) return 'Light rain';
        if (code <= 67) return 'Heavy rain';
        if (code <= 75) return 'Snowfall';
        if (code <= 82) return 'Rain showers';
        if (code <= 86) return 'Snow showers';
        if (code >= 95) return 'Thunderstorm';
        return 'Unknown';
    }
}

export default new WeatherService();
