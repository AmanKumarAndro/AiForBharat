/**
 * Language Service — persists user language preference.
 * Uses a simple in-memory store + optional AsyncStorage when available.
 * Other screens can import and use getLang() to get current language.
 */

let currentLang = 'hi'; // default to Hindi

// Bilingual text helper
const LABELS = {
    hi: {
        // HomeScreen
        greeting: 'नमस्ते, किसान भाई',
        greetingSub: 'आज हम आपकी क्या मदद करें?',
        weather: 'मौसम / Weather',
        pestScan: 'कीट पहचान / Pest Scan',
        cropGuide: 'फसल गाइड / Crop Guide',
        irrigation: 'सिंचाई / Irrigation',
        services: 'सेवाएं / Services',
        market: 'मंडी भाव / Market',
        tapToSpeak: 'बोलकर पूछें / Tap to Speak',
        servicesTitle: 'सेवाएं / Services',
        temp: 'तापमान',
        humidity: 'नमी',
        crop: 'फसल',
        // WeatherScreen
        weatherTitle: 'मौसम / Weather',
        forecast7Day: '7-दिन का पूर्वानुमान / 7-Day Forecast',
        todayDetail: 'आज का विवरण / Today\'s Detail',
        farmingTip: 'खेती सलाह / Farming Tip',
        lastUpdated: 'अंतिम अपडेट / Last updated',
        loading: 'लोड हो रहा है...',
        locationDetect: 'स्थान पता लगा रहे हैं...',
        sprayWindow: 'छिड़काव का समय / Spray Window',
        irrigationReminder: 'सिंचाई अनुस्मारक / Irrigation',
        rainExpected: 'बारिश की संभावना',
        noRain: 'बारिश नहीं',
        wind: 'हवा',
        uvIndex: 'UV इंडेक्स',
        feelsLike: 'महसूस',
    },
    en: {
        // HomeScreen
        greeting: 'Hello, Farmer!',
        greetingSub: 'How can I help you today?',
        weather: 'Weather Forecast',
        pestScan: 'Pest Scanner',
        cropGuide: 'Crop Guide',
        irrigation: 'Irrigation',
        services: 'Services',
        market: 'Market Prices',
        tapToSpeak: 'Tap to Speak',
        servicesTitle: 'Services',
        temp: 'Temp',
        humidity: 'Humidity',
        crop: 'Crop',
        // WeatherScreen
        weatherTitle: 'Weather',
        forecast7Day: '7-Day Forecast',
        todayDetail: 'Today\'s Detail',
        farmingTip: 'Farming Tip',
        lastUpdated: 'Last updated',
        loading: 'Loading...',
        locationDetect: 'Detecting location...',
        sprayWindow: 'Spray Window',
        irrigationReminder: 'Irrigation',
        rainExpected: 'Rain expected',
        noRain: 'No rain',
        wind: 'Wind',
        uvIndex: 'UV Index',
        feelsLike: 'Feels like',
    },
};

export const setLang = (lang) => {
    currentLang = lang;
};

export const getLang = () => currentLang;

export const getLabels = () => LABELS[currentLang] || LABELS.hi;

export default { setLang, getLang, getLabels };
