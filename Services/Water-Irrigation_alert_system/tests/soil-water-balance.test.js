const {
  calculateET0,
  calculateETc,
  updateSoilMoisture,
  calculateDeficit
} = require('../src/lib/soil-water-balance');

describe('Soil Water Balance', () => {
  test('calculateET0 returns positive value', () => {
    const ET0 = calculateET0(35, 20, 28.7041, 180);
    expect(ET0).toBeGreaterThan(0);
    expect(ET0).toBeLessThan(20); // Reasonable upper bound
  });

  test('calculateETc applies crop coefficient', () => {
    const ET0 = 5;
    const kc = 1.15;
    const ETc = calculateETc(ET0, kc);
    expect(ETc).toBe(5.75);
  });

  test('updateSoilMoisture handles rainfall and ET', () => {
    const current = 50;
    const rainfall = 10;
    const ETc = 5;
    const newMoisture = updateSoilMoisture(current, rainfall, ETc);
    expect(newMoisture).toBe(55);
  });

  test('updateSoilMoisture respects field capacity', () => {
    const current = 75;
    const rainfall = 20;
    const ETc = 2;
    const newMoisture = updateSoilMoisture(current, rainfall, ETc, 80);
    expect(newMoisture).toBe(80); // Capped at field capacity
  });

  test('updateSoilMoisture prevents negative values', () => {
    const current = 5;
    const rainfall = 0;
    const ETc = 10;
    const newMoisture = updateSoilMoisture(current, rainfall, ETc);
    expect(newMoisture).toBe(0);
  });

  test('calculateDeficit returns correct value', () => {
    const soilMoisture = 45;
    const deficit = calculateDeficit(soilMoisture, 80);
    expect(deficit).toBe(35);
  });
});
