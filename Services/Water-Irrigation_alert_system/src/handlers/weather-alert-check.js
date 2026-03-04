const { scan } = require('../lib/dynamo');
const { getCurrentWeather, getForecast } = require('../lib/weather');
const { sendSMS } = require('../lib/twilio');
const { putItem, getItem } = require('../lib/dynamo');

/**
 * Weather Alert Check Lambda
 * Runs every 3 hours to check for critical weather conditions
 * Sends immediate alerts for extreme weather
 */

function buildWeatherAlertMessage(farmerName, crop, alertType, weatherData, language = 'hi') {
  const alerts = {
    heatwave: {
      en: `[KisanVoice] ⚠️ HEATWAVE ALERT\n${crop} at risk! Temp: ${weatherData.temp}°C\nIrrigate early morning/evening\nAvoid midday work\nReply STOP`,
      hi: `[KisanVoice] ⚠️ गर्मी की चेतावनी\n${crop} खतरे में! तापमान: ${weatherData.temp}°C\nसुबह/शाम सिंचाई करें\nदोपहर में काम न करें\nSTOP भेजें`
    },
    frost: {
      en: `[KisanVoice] ❄️ FROST ALERT\n${crop} at risk! Temp: ${weatherData.temp}°C\nCover crops if possible\nLight irrigation may help\nReply STOP`,
      hi: `[KisanVoice] ❄️ पाला चेतावनी\n${crop} खतरे में! तापमान: ${weatherData.temp}°C\nफसल ढकें\nहल्की सिंचाई मदद कर सकती है\nSTOP भेजें`
    },
    storm: {
      en: `[KisanVoice] 🌪️ STORM ALERT\nThunderstorm expected\nWind: ${weatherData.windSpeed}km/h\nSecure equipment\nStay safe indoors\nReply STOP`,
      hi: `[KisanVoice] 🌪️ तूफान चेतावनी\nआंधी-तूफान आने वाला है\nहवा: ${weatherData.windSpeed}km/h\nउपकरण सुरक्षित करें\nघर के अंदर रहें\nSTOP भेजें`
    },
    heavyRain: {
      en: `[KisanVoice] 🌧️ HEAVY RAIN ALERT\n${weatherData.rainForecast}mm rain expected\nCheck drainage\nPostpone spraying\nSkip irrigation\nReply STOP`,
      hi: `[KisanVoice] 🌧️ भारी बारिश चेतावनी\n${weatherData.rainForecast}mm बारिश संभावित\nजल निकासी जांचें\nछिड़काव टालें\nसिंचाई छोड़ें\nSTOP भेजें`
    },
    highWind: {
      en: `[KisanVoice] 💨 HIGH WIND ALERT\nWind speed: ${weatherData.windSpeed}km/h\nSecure loose items\nPostpone spraying\nCheck crop support\nReply STOP`,
      hi: `[KisanVoice] 💨 तेज़ हवा चेतावनी\nहवा की गति: ${weatherData.windSpeed}km/h\nसामान बांधें\nछिड़काव टालें\nफसल सहारा जांचें\nSTOP भेजें`
    },
    drought: {
      en: `[KisanVoice] 🏜️ DROUGHT ALERT\n${weatherData.dryDays} days without rain\n${crop} needs water urgently\nIrrigate immediately\nReply STOP`,
      hi: `[KisanVoice] 🏜️ सूखा चेतावनी\n${weatherData.dryDays} दिन बिना बारिश\n${crop} को तुरंत पानी चाहिए\nअभी सिंचाई करें\nSTOP भेजें`
    }
  };

  return alerts[alertType]?.[language] || alerts[alertType]?.en;
}

function checkCriticalWeather(weatherData, crop, consecutiveDryDays) {
  const alerts = [];

  // 1. Heatwave (> 40°C)
  if (weatherData.temp >= 40) {
    alerts.push({
      type: 'heatwave',
      severity: 'high',
      data: weatherData
    });
  }

  // 2. Extreme Heat (> 45°C)
  if (weatherData.temp >= 45) {
    alerts.push({
      type: 'heatwave',
      severity: 'critical',
      data: weatherData
    });
  }

  // 3. Frost Risk (< 5°C)
  if (weatherData.temp <= 5) {
    alerts.push({
      type: 'frost',
      severity: 'high',
      data: weatherData
    });
  }

  // 4. Severe Frost (< 0°C)
  if (weatherData.temp <= 0) {
    alerts.push({
      type: 'frost',
      severity: 'critical',
      data: weatherData
    });
  }

  // 5. Thunderstorm
  if (weatherData.condition === 'Thunderstorm') {
    alerts.push({
      type: 'storm',
      severity: 'high',
      data: weatherData
    });
  }

  // 6. Heavy Rain (> 50mm expected)
  if (weatherData.rainForecast >= 50) {
    alerts.push({
      type: 'heavyRain',
      severity: 'medium',
      data: { ...weatherData, rainForecast: weatherData.rainForecast }
    });
  }

  // 7. High Wind (> 40 km/h)
  if (weatherData.windSpeed >= 40) {
    alerts.push({
      type: 'highWind',
      severity: 'medium',
      data: weatherData
    });
  }

  // 8. Extreme Wind (> 60 km/h)
  if (weatherData.windSpeed >= 60) {
    alerts.push({
      type: 'highWind',
      severity: 'high',
      data: weatherData
    });
  }

  // 9. Drought (10+ days without rain)
  if (consecutiveDryDays >= 10) {
    alerts.push({
      type: 'drought',
      severity: 'high',
      data: { ...weatherData, dryDays: consecutiveDryDays }
    });
  }

  // 10. Severe Drought (15+ days)
  if (consecutiveDryDays >= 15) {
    alerts.push({
      type: 'drought',
      severity: 'critical',
      data: { ...weatherData, dryDays: consecutiveDryDays }
    });
  }

  return alerts;
}

async function shouldSendAlert(farmerId, alertType, lastAlertTime) {
  // Don't send same alert type within 6 hours
  if (lastAlertTime) {
    const hoursSinceLastAlert = (Date.now() - new Date(lastAlertTime).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastAlert < 6) {
      return false;
    }
  }
  return true;
}

exports.handler = async (event) => {
  try {
    console.log('Starting weather alert check...');

    // Get all active farmers
    const farmers = await scan(
      process.env.FARMERS_TABLE,
      'active = :active AND sk = :sk',
      { ':active': true, ':sk': 'profile' }
    );

    console.log(`Checking weather for ${farmers.length} farmers`);

    let alertsSent = 0;

    for (const farmer of farmers) {
      try {
        const farmerId = farmer.pk.replace('farmer#', '');

        // Get current weather for farmer's location
        const weather = await getCurrentWeather(farmer.lat, farmer.lon);
        
        // Get forecast for heavy rain/wind alerts
        const forecast = await getForecast(farmer.lat, farmer.lon);
        
        // Combine weather data
        const weatherData = {
          ...weather,
          rainForecast: forecast.rain48hrMm,
          windSpeed: Math.max(weather.windSpeed, forecast.maxWindSpeed)
        };

        // Get soil state for consecutive dry days
        const soilState = await getItem(
          process.env.SOIL_STATE_TABLE,
          { pk: `farmer#${farmerId}`, sk: 'state' }
        );

        const consecutiveDryDays = soilState?.consecutiveDryDays || 0;

        // Check for critical weather conditions
        const criticalAlerts = checkCriticalWeather(weatherData, farmer.crop, consecutiveDryDays);

        if (criticalAlerts.length === 0) {
          continue; // No alerts needed for this farmer
        }

        // Get last weather alert time
        const lastWeatherAlert = await getItem(
          process.env.SMS_LOG_TABLE,
          { pk: `farmer#${farmerId}`, sk: 'last-weather-alert' }
        );

        // Send alerts (highest severity first)
        const sortedAlerts = criticalAlerts.sort((a, b) => {
          const severityOrder = { critical: 3, high: 2, medium: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        });

        for (const alert of sortedAlerts) {
          const shouldSend = await shouldSendAlert(
            farmerId,
            alert.type,
            lastWeatherAlert?.updatedAt
          );

          if (!shouldSend) {
            console.log(`Skipping ${alert.type} alert for ${farmerId} (too soon)`);
            continue;
          }

          // Build and send alert message
          const language = farmer.language || 'hi';
          const messageBody = buildWeatherAlertMessage(
            farmer.name,
            farmer.crop,
            alert.type,
            alert.data,
            language
          );

          if (messageBody) {
            const smsResult = await sendSMS(farmer.phone, messageBody);

            // Log the alert
            await putItem(process.env.SMS_LOG_TABLE, {
              pk: `farmer#${farmerId}`,
              sk: `sms#${new Date().toISOString()}`,
              messageType: `weather_${alert.type}`,
              messageBody,
              twilioSid: smsResult.sid,
              deliveryStatus: smsResult.status,
              severity: alert.severity,
              updatedAt: new Date().toISOString()
            });

            // Update last weather alert time
            await putItem(process.env.SMS_LOG_TABLE, {
              pk: `farmer#${farmerId}`,
              sk: 'last-weather-alert',
              alertType: alert.type,
              severity: alert.severity,
              updatedAt: new Date().toISOString()
            });

            alertsSent++;
            console.log(`Sent ${alert.type} alert to ${farmer.name} (${farmer.phone})`);

            // Only send one alert per farmer per check
            break;
          }
        }
      } catch (farmerError) {
        console.error(`Error processing farmer ${farmer.pk}:`, farmerError);
        // Continue with next farmer
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Weather alert check complete',
        farmersChecked: farmers.length,
        alertsSent
      })
    };

  } catch (error) {
    console.error('Error in weather-alert-check:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to check weather alerts',
        message: error.message
      })
    };
  }
};
