/**
 * Irrigation Decision Tree
 */

function makeIrrigationDecision(params) {
  const {
    deficit,
    stressThreshold,
    rain48hrMm,
    rainProbability,
    monsoonPhase,
    consecutiveDryDays,
    isCriticalStage,
    daysSinceLastSms,
    lastDecision,
    actualRainfall
  } = params;

  // Recovery: rain was predicted but didn't arrive
  if (lastDecision === 'skip' && actualRainfall < 2) {
    return {
      decision: 'recovery',
      reason: 'Predicted rain did not arrive'
    };
  }

  // Check if deficit exceeds stress threshold
  if (deficit > stressThreshold) {
    // Check if rain is coming
    if (rain48hrMm >= 5 || rainProbability >= 0.70) {
      return {
        decision: 'skip',
        reason: `Rain expected: ${rain48hrMm.toFixed(1)}mm, probability: ${(rainProbability * 100).toFixed(0)}%`
      };
    } else {
      return {
        decision: 'irrigate',
        reason: `Deficit ${deficit.toFixed(1)}mm exceeds threshold ${stressThreshold.toFixed(1)}mm`
      };
    }
  }

  // Critical monsoon alert
  if (monsoonPhase === 'monsoon_active' && consecutiveDryDays >= 5 && isCriticalStage) {
    return {
      decision: 'critical_monsoon',
      reason: `${consecutiveDryDays} dry days during critical stage`
    };
  }

  // Weekly reassurance
  if (daysSinceLastSms >= 7) {
    return {
      decision: 'reassurance',
      reason: 'Weekly status update'
    };
  }

  return {
    decision: 'none',
    reason: 'Soil moisture adequate'
  };
}

module.exports = { makeIrrigationDecision };
