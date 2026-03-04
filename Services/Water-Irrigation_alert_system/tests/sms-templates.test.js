const {
  buildIrrigateMessage,
  buildSkipMessage,
  buildCriticalMonsoonMessage,
  buildRecoveryMessage,
  buildStageAdvisoryMessage,
  buildReassuranceMessage,
  buildWeeklySummaryMessage,
  buildConfirmationMessage
} = require('../src/lib/sms-templates');

describe('SMS Templates', () => {
  test('irrigate message is under 160 characters', () => {
    const msg = buildIrrigateMessage('Wheat', 'Jointing', 42, 6200, 2);
    expect(msg.length).toBeLessThanOrEqual(160);
    expect(msg).toContain('Water your Wheat');
  });

  test('skip message is under 160 characters', () => {
    const msg = buildSkipMessage('Wheat', 'Jointing', 12, 6200, 372);
    expect(msg.length).toBeLessThanOrEqual(160);
    expect(msg).toContain('Skip irrigation');
  });

  test('critical monsoon message is under 160 characters', () => {
    const msg = buildCriticalMonsoonMessage('Rice', 'Flowering', 6, 10000);
    expect(msg.length).toBeLessThanOrEqual(160);
    expect(msg).toContain('CRITICAL');
  });

  test('recovery message is under 160 characters', () => {
    const msg = buildRecoveryMessage('Maize', 'Silking', 5800);
    expect(msg.length).toBeLessThanOrEqual(160);
    expect(msg).toContain('Rain did not arrive');
  });

  test('stage advisory message is under 160 characters', () => {
    const msg = buildStageAdvisoryMessage('Cotton', 'Flowering', 60, true);
    expect(msg.length).toBeLessThanOrEqual(160);
    expect(msg).toContain('entered Flowering');
  });

  test('reassurance message is under 160 characters', () => {
    const msg = buildReassuranceMessage('Sugarcane', 65, 15);
    expect(msg.length).toBeLessThanOrEqual(160);
    expect(msg).toContain('No irrigation needed');
  });

  test('weekly summary message is under 160 characters', () => {
    const msg = buildWeeklySummaryMessage(12000, 720, 2, 1, 45000);
    expect(msg.length).toBeLessThanOrEqual(160);
    expect(msg).toContain('This week');
  });

  test('confirmation message is under 160 characters', () => {
    const msg = buildConfirmationMessage('Mustard');
    expect(msg.length).toBeLessThanOrEqual(160);
    expect(msg).toContain('Welcome to AquaAlert');
  });
});
