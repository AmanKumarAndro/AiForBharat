/**
 * SMS Message Templates
 * All messages must be ≤ 160 characters
 * Supports English and Hindi
 */

function buildIrrigateMessage(crop, stage, deficitMm, litresNeeded, hours, weather, language = 'en') {
  if (language === 'hi') {
    return `[KisanVoice] कल सुबह 6-8 बजे ${crop} को पानी दें\nचरण: ${stage} | कमी: ${deficitMm}mm\nज़रूरत: ${litresNeeded.toLocaleString()}L\nमौसम: ${weather.temp}°C, ${weather.condition}\nSTOP भेजें रोकने के लिए`;
  }
  return `[KisanVoice] Water your ${crop} tomorrow 6-8 AM\nStage: ${stage} | Deficit: ${deficitMm}mm\nNeeded: ${litresNeeded.toLocaleString()}L\nWeather: ${weather.temp}°C, ${weather.condition}\nReply STOP to opt out`;
}

function buildSkipMessage(crop, stage, rainMm, litresSaved, moneySaved, weather, language = 'en') {
  if (language === 'hi') {
    return `[KisanVoice] सिंचाई छोड़ें - बारिश आने वाली है (${rainMm}mm)\n${crop} | ${stage}\nबचत: ${litresSaved.toLocaleString()}L - ₹${moneySaved}\nमौसम: ${weather.temp}°C, ${weather.condition}\nSTOP भेजें`;
  }
  return `[KisanVoice] Skip irrigation - rain expected (${rainMm}mm)\n${crop} | ${stage}\nSaved: ${litresSaved.toLocaleString()}L - Rs.${moneySaved}\nWeather: ${weather.temp}°C, ${weather.condition}\nReply STOP`;
}

function buildCriticalMonsoonMessage(crop, stage, dryDays, litresNeeded, weather, language = 'en') {
  if (language === 'hi') {
    return `[KisanVoice] ${dryDays} सूखे दिन - महत्वपूर्ण ${stage} चरण\nअगर 10 बजे तक बारिश नहीं तो सिंचाई करें\n${crop} | ${litresNeeded.toLocaleString()}L\nमौसम: ${weather.temp}°C\nSTOP भेजें`;
  }
  return `[KisanVoice] ${dryDays} dry days - CRITICAL ${stage} stage\nIrrigate today if no rain by 10 AM\n${crop} | ${litresNeeded.toLocaleString()}L\nWeather: ${weather.temp}°C, ${weather.condition}\nReply STOP`;
}

function buildRecoveryMessage(crop, stage, litresNeeded, weather, language = 'en') {
  if (language === 'hi') {
    return `[KisanVoice] बारिश नहीं हुई - आज सिंचाई करें\n${crop} ${stage} | ${litresNeeded.toLocaleString()}L सुबह 10 बजे से पहले\nमौसम: ${weather.temp}°C\nSTOP भेजें`;
  }
  return `[KisanVoice] Rain did not arrive - irrigate today\n${crop} ${stage} | ${litresNeeded.toLocaleString()}L before 10 AM\nWeather: ${weather.temp}°C, ${weather.condition}\nReply STOP`;
}

function buildStageAdvisoryMessage(crop, stage, dayNumber, isCritical) {
  const criticalNote = isCritical ? 'CRITICAL STAGE - do not miss water' : 'Non-critical stage';
  return `[KisanVoice] Your ${crop} entered ${stage} (Day ${dayNumber})\n${criticalNote}\nMonitoring continues. -KisanVoice`;
}

function buildReassuranceMessage(crop, soilMoistureMm, recentRainMm) {
  return `[KisanVoice] No irrigation needed this week\n${crop} soil moisture: good | ${recentRainMm}mm rain received\nMonitoring daily. -KisanVoice`;
}

function buildWeeklySummaryMessage(litresSaved, moneySaved, irrigationsDone, irrigationsSkipped, seasonLitresSaved) {
  return `[KisanVoice] This week: saved ${litresSaved.toLocaleString()}L - Rs.${moneySaved}\n${irrigationsDone} irrigations done | ${irrigationsSkipped} skipped (rain)\nSeason: ${seasonLitresSaved.toLocaleString()}L saved. -KisanVoice`;
}

function buildConfirmationMessage(crop, language = 'en') {
  if (language === 'hi') {
    return `AquaAlert में स्वागत है! ${crop} के लिए स्मार्ट सिंचाई अलर्ट सक्रिय।\nरोज़ाना मिट्टी की नमी की निगरानी। सेंसर की ज़रूरत नहीं।\nSTOP भेजें रोकने के लिए। -KisanVoice`;
  }
  return `Welcome to AquaAlert! Smart irrigation alerts active for ${crop}.\nMonitoring soil moisture daily. No sensors needed.\nReply STOP to unsubscribe. -KisanVoice`;
}

module.exports = {
  buildIrrigateMessage,
  buildSkipMessage,
  buildCriticalMonsoonMessage,
  buildRecoveryMessage,
  buildStageAdvisoryMessage,
  buildReassuranceMessage,
  buildWeeklySummaryMessage,
  buildConfirmationMessage
};
