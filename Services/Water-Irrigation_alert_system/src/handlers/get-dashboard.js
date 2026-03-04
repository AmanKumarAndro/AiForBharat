const { getItem, query } = require('../lib/dynamo');
const { getCurrentWeather, getForecast } = require('../lib/weather');
const { getMonsoonPhase } = require('../lib/monsoon-phase');

/**
 * Dashboard API - Get comprehensive farmer dashboard data
 * 
 * Returns:
 * - Current weather conditions
 * - 5-day forecast
 * - Monsoon status
 * - Soil moisture and crop status
 * - Irrigation recommendations
 * - Statistics (water saved, alerts, etc.)
 * 
 * Path: GET /irrigation/dashboard/{farmerId}
 */
exports.handler = async (event) => {
  try {
    const { farmerId } = event.pathParameters;
    
    if (!farmerId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'farmerId is required' 
        })
      };
    }

    const pk = `farmer#${farmerId}`;
    
    // 1. Get farmer profile
    const farmerResult = await getItem(
      process.env.FARMERS_TABLE,
      { pk, sk: 'profile' }
    );

    if (!farmerResult) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Farmer not found',
          farmerId 
        })
      };
    }

    const farmer = farmerResult;
    
    // 2. Get current weather
    const currentWeather = await getCurrentWeather(farmer.lat, farmer.lon);
    
    // 3. Get forecast summary
    const forecastSummary = await getForecast(farmer.lat, farmer.lon);
    
    // 4. Get soil state
    const soilState = await getItem(
      process.env.SOIL_STATE_TABLE,
      { pk, sk: 'state' }
    );
    
    // 5. Get monsoon phase
    const monsoonCalendar = await getItem(
      process.env.MONSOON_TABLE,
      { pk: 'district', sk: farmer.district }
    );
    
    let monsoonInfo = {
      phase: 'unknown',
      phaseHindi: 'अज्ञात',
      description: 'Monsoon data not available',
      descriptionHindi: 'मानसून डेटा उपलब्ध नहीं'
    };
    
    if (monsoonCalendar) {
      const currentDate = new Date().toISOString().split('T')[0];
      const phase = getMonsoonPhase(
        currentDate,
        monsoonCalendar.onsetDate,
        monsoonCalendar.retreatDate
      );
      
      const phaseNames = {
        pre_monsoon: { en: 'Pre-Monsoon', hi: 'मानसून-पूर्व' },
        monsoon_active: { en: 'Monsoon Active', hi: 'मानसून सक्रिय' },
        post_monsoon: { en: 'Post-Monsoon', hi: 'मानसून-पश्चात' }
      };
      
      const phaseDescriptions = {
        pre_monsoon: { 
          en: 'Monsoon has not arrived yet. Prepare for sowing.',
          hi: 'मानसून अभी नहीं आया है। बुवाई की तैयारी करें।'
        },
        monsoon_active: { 
          en: 'Monsoon is active. Good time for rain-fed crops.',
          hi: 'मानसून सक्रिय है। वर्षा आधारित फसलों के लिए अच्छा समय।'
        },
        post_monsoon: { 
          en: 'Monsoon has retreated. Focus on irrigation management.',
          hi: 'मानसून वापस चला गया है। सिंचाई प्रबंधन पर ध्यान दें।'
        }
      };
      
      monsoonInfo = {
        phase,
        phaseHindi: phaseNames[phase]?.hi || 'अज्ञात',
        phaseName: phaseNames[phase]?.en || 'Unknown',
        description: phaseDescriptions[phase]?.en || '',
        descriptionHindi: phaseDescriptions[phase]?.hi || '',
        onsetDate: monsoonCalendar.onsetDate,
        retreatDate: monsoonCalendar.retreatDate,
        district: farmer.district
      };
    }
    
    // 6. Get recent alerts (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const alerts = await query(
      process.env.SMS_LOG_TABLE,
      'pk = :pk AND sk >= :sk',
      {
        ':pk': pk,
        ':sk': `sms#${sevenDaysAgo}`
      }
    );
    
    // 7. Get savings (last 7 days and season total)
    const savings = await query(
      process.env.SAVINGS_TABLE,
      'pk = :pk',
      { ':pk': pk }
    );
    
    const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weeklySavings = savings.filter(s => s.sk.replace('saving#', '') >= sevenDaysAgoDate);
    
    // Calculate statistics
    const weeklyLitresSaved = weeklySavings.reduce((sum, s) => sum + (s.litresSaved || 0), 0);
    const weeklyMoneySaved = weeklySavings.reduce((sum, s) => sum + (s.moneySavedRs || 0), 0);
    const seasonLitresSaved = savings.reduce((sum, s) => sum + (s.litresSaved || 0), 0);
    const seasonMoneySaved = savings.reduce((sum, s) => sum + (s.moneySavedRs || 0), 0);
    
    const irrigationAlerts = alerts.filter(a => a.messageType === 'irrigate').length;
    const skipAlerts = alerts.filter(a => a.messageType === 'skip').length;
    const weatherAlerts = alerts.filter(a => a.messageType?.startsWith('weather_')).length;
    
    // 8. Calculate crop progress
    const sowingDate = new Date(farmer.sowingDate);
    const today = new Date();
    const daysSinceSowing = Math.floor((today - sowingDate) / (1000 * 60 * 60 * 24));
    
    // Get crop duration from crop data
    const cropDurations = {
      wheat: 120,
      rice: 120,
      cotton: 180,
      sugarcane: 365,
      maize: 90,
      mustard: 120
    };
    const totalDuration = cropDurations[farmer.crop] || 120;
    const cropProgress = Math.min(Math.round((daysSinceSowing / totalDuration) * 100), 100);
    
    // 9. Determine next irrigation
    let nextIrrigation = 'Check soil moisture';
    if (soilState) {
      const soilMoisturePercent = Math.round((soilState.soilMoistureMm / 100) * 100);
      if (soilMoisturePercent < 40) {
        nextIrrigation = 'Irrigate soon';
      } else if (soilMoisturePercent < 50) {
        nextIrrigation = 'Monitor daily';
      } else {
        nextIrrigation = 'No irrigation needed';
      }
    }
    
    // 10. Calculate rainfall totals
    const todayRainfall = currentWeather.rainfallMm || 0;
    const forecast48hrRainfall = forecastSummary.rain48hrMm || 0;
    
    // 11. Check for active weather warnings
    const activeWarnings = [];
    if (currentWeather.temp > 40) {
      activeWarnings.push({ type: 'heatwave', severity: 'high', message: 'Extreme heat warning' });
    }
    if (currentWeather.temp < 5) {
      activeWarnings.push({ type: 'frost', severity: 'high', message: 'Frost warning' });
    }
    if (currentWeather.condition === 'Thunderstorm') {
      activeWarnings.push({ type: 'thunderstorm', severity: 'high', message: 'Thunderstorm alert' });
    }
    if (currentWeather.windSpeed > 40) {
      activeWarnings.push({ type: 'wind', severity: 'medium', message: 'High wind alert' });
    }
    if (todayRainfall > 50) {
      activeWarnings.push({ type: 'heavy_rain', severity: 'high', message: 'Heavy rainfall alert' });
    }
    
    // Build dashboard response
    const dashboard = {
      farmer: {
        farmerId,
        name: farmer.name,
        phone: farmer.phone,
        crop: farmer.crop,
        district: farmer.district,
        areaAcres: farmer.areaAcres,
        language: farmer.language
      },
      
      weather: {
        current: {
          temperature: currentWeather.temp,
          humidity: currentWeather.humidity,
          windSpeed: Math.round(currentWeather.windSpeed),
          pressure: currentWeather.pressure,
          condition: currentWeather.condition,
          conditionHindi: currentWeather.conditionHindi,
          description: currentWeather.description
        },
        rainfall: {
          today: Math.round(todayRainfall),
          next48Hours: Math.round(forecast48hrRainfall),
          probability: Math.round(forecastSummary.rainProbability * 100)
        },
        forecast: {
          rain48hr: Math.round(forecastSummary.rain48hrMm),
          rainProbability: Math.round(forecastSummary.rainProbability * 100),
          maxWindSpeed: Math.round(forecastSummary.maxWindSpeed)
        },
        warnings: activeWarnings
      },
      
      monsoon: {
        phase: monsoonInfo.phase,
        phaseName: monsoonInfo.phaseName,
        phaseHindi: monsoonInfo.phaseHindi,
        description: monsoonInfo.description,
        descriptionHindi: monsoonInfo.descriptionHindi,
        onsetDate: monsoonInfo.onsetDate,
        retreatDate: monsoonInfo.retreatDate,
        district: monsoonInfo.district
      },
      
      farm: {
        crop: {
          name: farmer.crop,
          stage: soilState?.currentStage || 'Unknown',
          daysSinceSowing,
          totalDuration,
          progress: cropProgress,
          daysRemaining: totalDuration - daysSinceSowing
        },
        soil: {
          moistureMm: soilState?.soilMoistureMm || 0,
          moisturePercent: soilState ? Math.round((soilState.soilMoistureMm / 100) * 100) : 0,
          status: soilState?.soilMoistureMm > 60 ? 'Good' : soilState?.soilMoistureMm > 40 ? 'Moderate' : 'Low',
          lastUpdated: soilState?.updatedAt
        },
        irrigation: {
          nextRecommendation: nextIrrigation,
          lastDecision: soilState?.lastDecision || 'none',
          daysSinceLastSms: soilState?.daysSinceLastSms || 0,
          consecutiveDryDays: soilState?.consecutiveDryDays || 0
        }
      },
      
      statistics: {
        weekly: {
          litresSaved: Math.round(weeklyLitresSaved),
          moneySaved: Math.round(weeklyMoneySaved),
          irrigationAlerts,
          skipAlerts,
          weatherAlerts,
          totalAlerts: alerts.length
        },
        season: {
          litresSaved: Math.round(seasonLitresSaved),
          moneySaved: Math.round(seasonMoneySaved),
          totalAlerts: savings.length,
          daysActive: daysSinceSowing
        },
        alerts: {
          last7Days: alerts.length,
          irrigate: irrigationAlerts,
          skip: skipAlerts,
          weather: weatherAlerts
        }
      },
      
      recentAlerts: alerts.slice(0, 5).map(alert => ({
        timestamp: alert.updatedAt,
        type: alert.messageType,
        message: alert.messageBody?.substring(0, 100) + '...',
        status: alert.deliveryStatus
      })),
      
      lastUpdated: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(dashboard)
    };

  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch dashboard',
        message: error.message 
      })
    };
  }
};
