/**
 * Soil Water Balance Calculations
 * Based on FAO-56 methodology
 */

function calculateExtraterrestrialRadiation(lat, dayOfYear) {
  const latRad = (Math.PI / 180) * lat;
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * dayOfYear);
  const delta = 0.409 * Math.sin((2 * Math.PI / 365) * dayOfYear - 1.39);
  const ws = Math.acos(-Math.tan(latRad) * Math.tan(delta));
  
  const Gsc = 0.0820; // MJ/m²/min
  const Ra = (24 * 60 / Math.PI) * Gsc * dr * 
    (ws * Math.sin(latRad) * Math.sin(delta) + 
     Math.cos(latRad) * Math.cos(delta) * Math.sin(ws));
  
  return Ra;
}

function calculateET0(tempMax, tempMin, lat, dayOfYear) {
  const tempMean = (tempMax + tempMin) / 2;
  const Ra = calculateExtraterrestrialRadiation(lat, dayOfYear);
  
  // Hargreaves equation
  const ET0 = 0.0023 * (tempMean + 17.8) * Math.pow(tempMax - tempMin, 0.5) * Ra;
  
  return Math.max(0, ET0);
}

function calculateETc(ET0, kc) {
  return ET0 * kc;
}

function updateSoilMoisture(currentMoisture, rainfall, ETc, fieldCapacity = 80) {
  let newMoisture = currentMoisture + rainfall - ETc;
  return Math.max(0, Math.min(newMoisture, fieldCapacity));
}

function calculateDeficit(soilMoisture, fieldCapacity = 80) {
  return Math.max(0, fieldCapacity - soilMoisture);
}

module.exports = {
  calculateET0,
  calculateETc,
  updateSoilMoisture,
  calculateDeficit,
  calculateExtraterrestrialRadiation
};
