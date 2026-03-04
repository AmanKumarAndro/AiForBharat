const axios = require('axios');
const { getSecrets } = require('./secrets');

async function getCurrentWeather(lat, lon) {
  const secrets = await getSecrets();
  const baseUrl = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
  
  const response = await axios.get(`${baseUrl}/weather`, {
    params: {
      lat,
      lon,
      units: 'metric',
      appid: secrets.OPENWEATHER_API_KEY
    }
  });

  const data = response.data;
  return {
    tempMax: data.main.temp_max,
    tempMin: data.main.temp_min,
    tempMean: data.main.temp,
    temp: Math.round(data.main.temp),
    humidity: data.main.humidity,
    rainfallMm: (data.rain?.['1h'] || data.rain?.['3h'] || 0),
    condition: data.weather?.[0]?.main || 'Clear',
    conditionHindi: getWeatherConditionHindi(data.weather?.[0]?.main),
    description: data.weather?.[0]?.description || '',
    windSpeed: data.wind?.speed || 0,
    pressure: data.main.pressure
  };
}

function getWeatherConditionHindi(condition) {
  const conditions = {
    'Clear': 'साफ',
    'Clouds': 'बादल',
    'Rain': 'बारिश',
    'Drizzle': 'बूंदाबांदी',
    'Thunderstorm': 'आंधी',
    'Snow': 'बर्फ',
    'Mist': 'कोहरा',
    'Fog': 'धुंध',
    'Haze': 'धुंध'
  };
  return conditions[condition] || condition;
}

async function getForecast(lat, lon) {
  const secrets = await getSecrets();
  const baseUrl = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
  
  const response = await axios.get(`${baseUrl}/forecast`, {
    params: {
      lat,
      lon,
      cnt: 4,
      units: 'metric',
      appid: secrets.OPENWEATHER_API_KEY
    }
  });

  let totalRain48hr = 0;
  let maxProbability = 0;
  let maxWindSpeed = 0;

  response.data.list.forEach(item => {
    totalRain48hr += (item.rain?.['3h'] || 0);
    maxProbability = Math.max(maxProbability, item.pop || 0);
    maxWindSpeed = Math.max(maxWindSpeed, item.wind?.speed || 0);
  });

  return {
    rain48hrMm: totalRain48hr,
    rainProbability: maxProbability,
    maxWindSpeed: maxWindSpeed * 3.6 // Convert m/s to km/h
  };
}

module.exports = { getCurrentWeather, getForecast };
