/**
 * Crop Irrigation Map — ICAR-recommended watering schedule for major Indian crops.
 * Each crop has a list of named growth stages with the days-from-sowing range
 * at which irrigation is recommended and the approximate water need (mm).
 *
 * Sources: ICAR crop handbooks / agri extension literature.
 */

const CROP_IRRIGATION_MAP = {
    wheat: {
        nameHi: 'गेहूं',
        nameEn: 'Wheat',
        icon: '🌾',
        totalDuration: 140, // days from sowing to harvest
        stages: [
            { name: 'CRI (Crown Root Initiation)', nameHi: 'ताज जड़ आरंभ', dayStart: 20, dayEnd: 25, waterMm: 60 },
            { name: 'Tillering', nameHi: 'कल्ले निकलना', dayStart: 40, dayEnd: 45, waterMm: 50 },
            { name: 'Jointing', nameHi: 'गांठ बनना', dayStart: 60, dayEnd: 65, waterMm: 50 },
            { name: 'Flowering', nameHi: 'फूल आना', dayStart: 80, dayEnd: 85, waterMm: 50 },
            { name: 'Milking', nameHi: 'दूधिया अवस्था', dayStart: 100, dayEnd: 105, waterMm: 50 },
            { name: 'Dough', nameHi: 'आटा अवस्था', dayStart: 115, dayEnd: 120, waterMm: 40 },
        ],
    },
    rice: {
        nameHi: 'धान',
        nameEn: 'Rice (Paddy)',
        icon: '🍚',
        totalDuration: 130,
        stages: [
            { name: 'Nursery flood', nameHi: 'नर्सरी सिंचाई', dayStart: 0, dayEnd: 5, waterMm: 50 },
            { name: 'Transplanting', nameHi: 'रोपाई', dayStart: 20, dayEnd: 25, waterMm: 80 },
            { name: 'Tillering', nameHi: 'कल्ले निकलना', dayStart: 35, dayEnd: 40, waterMm: 60 },
            { name: 'Panicle Initiation', nameHi: 'बालियां बनना', dayStart: 55, dayEnd: 60, waterMm: 70 },
            { name: 'Flowering', nameHi: 'फूल आना', dayStart: 75, dayEnd: 80, waterMm: 70 },
            { name: 'Grain Filling', nameHi: 'दाना भरना', dayStart: 95, dayEnd: 100, waterMm: 60 },
        ],
    },
    maize: {
        nameHi: 'मक्का',
        nameEn: 'Maize',
        icon: '🌽',
        totalDuration: 110,
        stages: [
            { name: 'Seedling', nameHi: 'अंकुरण', dayStart: 10, dayEnd: 15, waterMm: 40 },
            { name: 'Knee Height', nameHi: 'घुटने तक ऊंचाई', dayStart: 30, dayEnd: 35, waterMm: 50 },
            { name: 'Tasseling', nameHi: 'नर फूल आना', dayStart: 50, dayEnd: 55, waterMm: 60 },
            { name: 'Silking', nameHi: 'मादा फूल आना', dayStart: 60, dayEnd: 65, waterMm: 70 },
            { name: 'Grain Filling', nameHi: 'दाना भरना', dayStart: 75, dayEnd: 80, waterMm: 60 },
        ],
    },
    sugarcane: {
        nameHi: 'गन्ना',
        nameEn: 'Sugarcane',
        icon: '🎋',
        totalDuration: 365,
        stages: [
            { name: 'Germination', nameHi: 'अंकुरण', dayStart: 7, dayEnd: 14, waterMm: 40 },
            { name: 'Tillering', nameHi: 'कल्ले निकलना', dayStart: 45, dayEnd: 50, waterMm: 50 },
            { name: 'Grand Growth 1', nameHi: 'तेज बढ़वार 1', dayStart: 90, dayEnd: 95, waterMm: 70 },
            { name: 'Grand Growth 2', nameHi: 'तेज बढ़वार 2', dayStart: 130, dayEnd: 135, waterMm: 70 },
            { name: 'Grand Growth 3', nameHi: 'तेज बढ़वार 3', dayStart: 170, dayEnd: 175, waterMm: 70 },
            { name: 'Maturity', nameHi: 'पकाव अवस्था', dayStart: 270, dayEnd: 275, waterMm: 50 },
        ],
    },
    mustard: {
        nameHi: 'सरसों',
        nameEn: 'Mustard',
        icon: '🌻',
        totalDuration: 120,
        stages: [
            { name: 'Seedling', nameHi: 'अंकुरण', dayStart: 20, dayEnd: 25, waterMm: 40 },
            { name: 'Flowering', nameHi: 'फूल आना', dayStart: 55, dayEnd: 60, waterMm: 50 },
            { name: 'Pod Formation', nameHi: 'फली बनना', dayStart: 80, dayEnd: 85, waterMm: 50 },
        ],
    },
};

export default CROP_IRRIGATION_MAP;
