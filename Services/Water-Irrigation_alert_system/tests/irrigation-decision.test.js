const { makeIrrigationDecision } = require('../src/lib/irrigation-decision');

describe('Irrigation Decision Tree', () => {
  test('irrigate when deficit exceeds threshold and no rain', () => {
    const decision = makeIrrigationDecision({
      deficit: 45,
      stressThreshold: 40,
      rain48hrMm: 2,
      rainProbability: 0.3,
      monsoonPhase: 'pre_monsoon',
      consecutiveDryDays: 2,
      isCriticalStage: false,
      daysSinceLastSms: 1,
      lastDecision: 'none',
      actualRainfall: 0
    });
    
    expect(decision.decision).toBe('irrigate');
  });

  test('skip when rain expected', () => {
    const decision = makeIrrigationDecision({
      deficit: 45,
      stressThreshold: 40,
      rain48hrMm: 8,
      rainProbability: 0.8,
      monsoonPhase: 'pre_monsoon',
      consecutiveDryDays: 2,
      isCriticalStage: false,
      daysSinceLastSms: 1,
      lastDecision: 'none',
      actualRainfall: 0
    });
    
    expect(decision.decision).toBe('skip');
  });

  test('recovery when predicted rain did not arrive', () => {
    const decision = makeIrrigationDecision({
      deficit: 45,
      stressThreshold: 40,
      rain48hrMm: 2,
      rainProbability: 0.3,
      monsoonPhase: 'pre_monsoon',
      consecutiveDryDays: 3,
      isCriticalStage: false,
      daysSinceLastSms: 1,
      lastDecision: 'skip',
      actualRainfall: 1
    });
    
    expect(decision.decision).toBe('recovery');
  });

  test('critical monsoon alert during dry spell', () => {
    const decision = makeIrrigationDecision({
      deficit: 30,
      stressThreshold: 40,
      rain48hrMm: 0,
      rainProbability: 0.1,
      monsoonPhase: 'monsoon_active',
      consecutiveDryDays: 6,
      isCriticalStage: true,
      daysSinceLastSms: 2,
      lastDecision: 'none',
      actualRainfall: 0
    });
    
    expect(decision.decision).toBe('critical_monsoon');
  });

  test('reassurance after 7 days', () => {
    const decision = makeIrrigationDecision({
      deficit: 20,
      stressThreshold: 40,
      rain48hrMm: 0,
      rainProbability: 0.1,
      monsoonPhase: 'pre_monsoon',
      consecutiveDryDays: 1,
      isCriticalStage: false,
      daysSinceLastSms: 7,
      lastDecision: 'none',
      actualRainfall: 0
    });
    
    expect(decision.decision).toBe('reassurance');
  });

  test('none when soil moisture adequate', () => {
    const decision = makeIrrigationDecision({
      deficit: 20,
      stressThreshold: 40,
      rain48hrMm: 0,
      rainProbability: 0.1,
      monsoonPhase: 'pre_monsoon',
      consecutiveDryDays: 1,
      isCriticalStage: false,
      daysSinceLastSms: 2,
      lastDecision: 'none',
      actualRainfall: 0
    });
    
    expect(decision.decision).toBe('none');
  });
});
