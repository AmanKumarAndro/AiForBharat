const { getMonsoonPhase, shouldSuppressAlert } = require('../src/lib/monsoon-phase');

describe('Monsoon Phase Detection', () => {
  test('detects pre-monsoon phase', () => {
    const phase = getMonsoonPhase('2025-05-15', '06-29', '09-25');
    expect(phase).toBe('pre_monsoon');
  });

  test('detects active monsoon phase', () => {
    const phase = getMonsoonPhase('2025-07-15', '06-29', '09-25');
    expect(phase).toBe('monsoon_active');
  });

  test('detects post-monsoon phase', () => {
    const phase = getMonsoonPhase('2025-10-15', '06-29', '09-25');
    expect(phase).toBe('post_monsoon');
  });

  test('onset boundary date', () => {
    const phase = getMonsoonPhase('2025-06-29', '06-29', '09-25');
    expect(phase).toBe('monsoon_active');
  });

  test('retreat boundary date', () => {
    const phase = getMonsoonPhase('2025-09-25', '06-29', '09-25');
    expect(phase).toBe('monsoon_active');
  });

  test('suppresses alert during active monsoon', () => {
    const suppress = shouldSuppressAlert('monsoon_active', 3, false);
    expect(suppress).toBe(true);
  });

  test('does not suppress during critical dry spell', () => {
    const suppress = shouldSuppressAlert('monsoon_active', 6, true);
    expect(suppress).toBe(false);
  });

  test('does not suppress outside monsoon', () => {
    const suppress = shouldSuppressAlert('pre_monsoon', 2, false);
    expect(suppress).toBe(false);
  });
});
