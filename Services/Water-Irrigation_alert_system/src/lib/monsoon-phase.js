/**
 * Monsoon Phase Detection
 */

function getMonsoonPhase(currentDate, onsetDate, retreatDate) {
  const current = new Date(currentDate);
  const currentYear = current.getFullYear();
  
  // Parse MM-DD format
  const [onsetMonth, onsetDay] = onsetDate.split('-').map(Number);
  const [retreatMonth, retreatDay] = retreatDate.split('-').map(Number);
  
  const onset = new Date(currentYear, onsetMonth - 1, onsetDay);
  const retreat = new Date(currentYear, retreatMonth - 1, retreatDay);
  
  if (current >= onset && current <= retreat) {
    return 'monsoon_active';
  } else if (current < onset) {
    return 'pre_monsoon';
  } else {
    return 'post_monsoon';
  }
}

function shouldSuppressAlert(phase, consecutiveDryDays, isCriticalStage) {
  if (phase !== 'monsoon_active') return false;
  
  // Suppress during active monsoon unless 5+ dry days AND critical stage
  if (consecutiveDryDays >= 5 && isCriticalStage) {
    return false; // Don't suppress - send critical alert
  }
  
  return true; // Suppress normal alerts during monsoon
}

module.exports = {
  getMonsoonPhase,
  shouldSuppressAlert
};
