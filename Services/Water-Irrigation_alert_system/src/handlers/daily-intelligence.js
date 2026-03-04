const { getItem, putItem, updateItem } = require('../lib/dynamo');
const { getCurrentWeather, getForecast } = require('../lib/weather');
const { calculateET0, calculateETc, updateSoilMoisture, calculateDeficit } = require('../lib/soil-water-balance');
const { getMonsoonPhase, shouldSuppressAlert } = require('../lib/monsoon-phase');
const { makeIrrigationDecision } = require('../lib/irrigation-decision');
const { sendSMS } = require('../lib/twilio');
const {
  buildIrrigateMessage,
  buildSkipMessage,
  buildCriticalMonsoonMessage,
  buildRecoveryMessage,
  buildReassuranceMessage
} = require('../lib/sms-templates');

exports.handler = async (event) => {
  const { farmerId } = event;
  
  try {
    // 1. Fetch farmer profile and soil state
    const farmer = await getItem(process.env.FARMERS_TABLE, { pk: `farmer#${farmerId}`, sk: 'profile' });
    const soilState = await getItem(process.env.SOIL_STATE_TABLE, { pk: `farmer#${farmerId}`, sk: 'state' });
    
    if (!farmer || !farmer.active) {
      return { statusCode: 200, body: 'Farmer inactive or not found' };
    }

    // 2. Get current weather
    const weather = await getCurrentWeather(farmer.lat, farmer.lon);
    
    // 3. Get forecast
    const forecast = await getForecast(farmer.lat, farmer.lon);
    
    // 4. Get monsoon calendar
    const monsoonData = await getItem(process.env.MONSOON_TABLE, { 
      pk: `district#${farmer.district}`, 
      sk: 'monsoon' 
    });
    
    const today = new Date().toISOString().split('T')[0];
    const monsoonPhase = monsoonData 
      ? getMonsoonPhase(today, monsoonData.onset, monsoonData.retreat)
      : 'pre_monsoon';
    
    // 5. Get crop data for current stage
    const cropData = await getItem(process.env.CROP_DATA_TABLE, {
      pk: `crop#${farmer.crop}`,
      sk: `stage#${soilState.currentStage}`
    });
    
    if (!cropData) {
      throw new Error(`Crop data not found for ${farmer.crop} stage ${soilState.currentStage}`);
    }

    // 6. Calculate ET0 and ETc
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const ET0 = calculateET0(weather.tempMax, weather.tempMin, farmer.lat, dayOfYear);
    const ETc = calculateETc(ET0, cropData.kc);
    
    // 7. Update soil moisture
    const newSoilMoisture = updateSoilMoisture(
      soilState.soilMoistureMm,
      weather.rainfallMm,
      ETc
    );
    
    const deficit = calculateDeficit(newSoilMoisture);
    const stressThreshold = 80 * cropData.stressFraction;
    
    // 8. Update consecutive dry days
    const consecutiveDryDays = weather.rainfallMm < 1 
      ? (soilState.consecutiveDryDays || 0) + 1 
      : 0;
    
    // 9. Make irrigation decision
    const decision = makeIrrigationDecision({
      deficit,
      stressThreshold,
      rain48hrMm: forecast.rain48hrMm,
      rainProbability: forecast.rainProbability,
      monsoonPhase,
      consecutiveDryDays,
      isCriticalStage: cropData.critical,
      daysSinceLastSms: soilState.daysSinceLastSms || 0,
      lastDecision: soilState.lastDecision,
      actualRainfall: weather.rainfallMm
    });
    
    // 10. Send SMS if needed
    let messageSent = null;
    const litresNeeded = cropData.waterLitresPerAcre * farmer.areaAcres;
    const efficiencyMultiplier = { flood: 1.0, sprinkler: 0.75, drip: 0.55 }[farmer.irrMethod] || 1.0;
    const adjustedLitres = Math.round(litresNeeded * efficiencyMultiplier);
    
    // Get language preference (default to Hindi for Indian numbers, English for others)
    const language = farmer.language || (farmer.phone.startsWith('+91') ? 'hi' : 'en');
    
    // Weather summary for SMS
    const weatherSummary = {
      temp: weather.temp,
      condition: language === 'hi' ? weather.conditionHindi : weather.condition
    };
    
    if (decision.decision !== 'none') {
      let messageBody;
      
      switch (decision.decision) {
        case 'irrigate':
          messageBody = buildIrrigateMessage(
            farmer.crop,
            soilState.currentStage,
            Math.round(deficit),
            adjustedLitres,
            2,
            weatherSummary,
            language
          );
          break;
          
        case 'skip':
          const litresSaved = adjustedLitres;
          const moneySaved = Math.round(litresSaved * 0.06);
          messageBody = buildSkipMessage(
            farmer.crop,
            soilState.currentStage,
            Math.round(forecast.rain48hrMm),
            litresSaved,
            moneySaved,
            weatherSummary,
            language
          );
          
          // Log savings
          await putItem(process.env.SAVINGS_TABLE, {
            pk: `farmer#${farmerId}`,
            sk: `saving#${today}`,
            litresSaved,
            moneySavedRs: moneySaved,
            co2SavedKg: litresSaved * 0.0003,
            reason: `rain ${forecast.rain48hrMm.toFixed(1)}mm`
          });
          break;
          
        case 'critical_monsoon':
          messageBody = buildCriticalMonsoonMessage(
            farmer.crop,
            soilState.currentStage,
            consecutiveDryDays,
            adjustedLitres,
            weatherSummary,
            language
          );
          break;
          
        case 'recovery':
          messageBody = buildRecoveryMessage(
            farmer.crop,
            soilState.currentStage,
            adjustedLitres,
            weatherSummary,
            language
          );
          break;
          
        case 'reassurance':
          messageBody = buildReassuranceMessage(
            farmer.crop,
            Math.round(newSoilMoisture),
            Math.round(soilState.lastRainfallMm || 0)
          );
          break;
      }
      
      if (messageBody) {
        const smsResult = await sendSMS(farmer.phone, messageBody);
        messageSent = smsResult;
        
        // Log SMS
        await putItem(process.env.SMS_LOG_TABLE, {
          pk: `farmer#${farmerId}`,
          sk: `sms#${new Date().toISOString()}`,
          messageType: decision.decision,
          messageBody,
          twilioSid: smsResult.sid,
          deliveryStatus: smsResult.status,
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    // 11. Update soil state
    await putItem(process.env.SOIL_STATE_TABLE, {
      pk: `farmer#${farmerId}`,
      sk: 'state',
      soilMoistureMm: newSoilMoisture,
      currentStage: soilState.currentStage,
      daysSinceSowing: soilState.daysSinceSowing + 1,
      lastRainfallMm: weather.rainfallMm,
      lastDecision: decision.decision,
      consecutiveDryDays,
      daysSinceLastSms: messageSent ? 0 : (soilState.daysSinceLastSms || 0) + 1,
      updatedAt: new Date().toISOString()
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        farmerId,
        decision: decision.decision,
        reason: decision.reason,
        soilMoisture: newSoilMoisture,
        deficit,
        messageSent: !!messageSent
      })
    };
    
  } catch (error) {
    console.error('Error in daily-intelligence:', error);
    throw error;
  }
};
