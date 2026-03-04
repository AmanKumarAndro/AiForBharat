const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const cropData = [
  // Wheat
  { crop: 'wheat', stage: 'Crown Root', daysStart: 0, daysEnd: 21, intervalDays: 21, waterLitresPerAcre: 4800, kc: 0.40, stressFraction: 0.55, critical: false },
  { crop: 'wheat', stage: 'Tillering', daysStart: 21, daysEnd: 42, intervalDays: 21, waterLitresPerAcre: 5500, kc: 0.70, stressFraction: 0.50, critical: true },
  { crop: 'wheat', stage: 'Jointing', daysStart: 42, daysEnd: 63, intervalDays: 18, waterLitresPerAcre: 6000, kc: 1.15, stressFraction: 0.45, critical: true },
  { crop: 'wheat', stage: 'Heading', daysStart: 63, daysEnd: 84, intervalDays: 14, waterLitresPerAcre: 6500, kc: 1.15, stressFraction: 0.40, critical: true },
  { crop: 'wheat', stage: 'Grain Filling', daysStart: 84, daysEnd: 105, intervalDays: 14, waterLitresPerAcre: 5000, kc: 0.90, stressFraction: 0.55, critical: false },
  { crop: 'wheat', stage: 'Maturity', daysStart: 105, daysEnd: 120, intervalDays: 20, waterLitresPerAcre: 3000, kc: 0.25, stressFraction: 0.70, critical: false },
  
  // Rice
  { crop: 'rice', stage: 'Transplanting', daysStart: 0, daysEnd: 20, intervalDays: 7, waterLitresPerAcre: 9000, kc: 1.05, stressFraction: 0.20, critical: false },
  { crop: 'rice', stage: 'Tillering', daysStart: 20, daysEnd: 50, intervalDays: 7, waterLitresPerAcre: 8500, kc: 1.10, stressFraction: 0.20, critical: false },
  { crop: 'rice', stage: 'Panicle Init.', daysStart: 50, daysEnd: 70, intervalDays: 5, waterLitresPerAcre: 9500, kc: 1.20, stressFraction: 0.15, critical: true },
  { crop: 'rice', stage: 'Flowering', daysStart: 70, daysEnd: 90, intervalDays: 5, waterLitresPerAcre: 10000, kc: 1.25, stressFraction: 0.10, critical: true },
  { crop: 'rice', stage: 'Grain Filling', daysStart: 90, daysEnd: 115, intervalDays: 7, waterLitresPerAcre: 7500, kc: 1.00, stressFraction: 0.25, critical: false },
  { crop: 'rice', stage: 'Maturity', daysStart: 115, daysEnd: 130, intervalDays: 14, waterLitresPerAcre: 4000, kc: 0.75, stressFraction: 0.50, critical: false },
  
  // Maize
  { crop: 'maize', stage: 'Germination', daysStart: 0, daysEnd: 15, intervalDays: 10, waterLitresPerAcre: 3500, kc: 0.40, stressFraction: 0.55, critical: false },
  { crop: 'maize', stage: 'Vegetative', daysStart: 15, daysEnd: 40, intervalDays: 10, waterLitresPerAcre: 4200, kc: 0.80, stressFraction: 0.50, critical: false },
  { crop: 'maize', stage: 'Tasseling', daysStart: 40, daysEnd: 55, intervalDays: 7, waterLitresPerAcre: 5500, kc: 1.15, stressFraction: 0.40, critical: true },
  { crop: 'maize', stage: 'Silking', daysStart: 55, daysEnd: 70, intervalDays: 7, waterLitresPerAcre: 5800, kc: 1.20, stressFraction: 0.40, critical: true },
  { crop: 'maize', stage: 'Grain Filling', daysStart: 70, daysEnd: 90, intervalDays: 10, waterLitresPerAcre: 4500, kc: 1.05, stressFraction: 0.50, critical: false },
  
  // Sugarcane
  { crop: 'sugarcane', stage: 'Germination', daysStart: 0, daysEnd: 30, intervalDays: 7, waterLitresPerAcre: 6000, kc: 0.55, stressFraction: 0.50, critical: false },
  { crop: 'sugarcane', stage: 'Tillering', daysStart: 30, daysEnd: 120, intervalDays: 10, waterLitresPerAcre: 7000, kc: 0.85, stressFraction: 0.45, critical: false },
  { crop: 'sugarcane', stage: 'Grand Growth', daysStart: 120, daysEnd: 270, intervalDays: 10, waterLitresPerAcre: 9000, kc: 1.25, stressFraction: 0.35, critical: true },
  { crop: 'sugarcane', stage: 'Maturation', daysStart: 270, daysEnd: 365, intervalDays: 15, waterLitresPerAcre: 5000, kc: 0.75, stressFraction: 0.55, critical: false },
  
  // Cotton
  { crop: 'cotton', stage: 'Emergence', daysStart: 0, daysEnd: 20, intervalDays: 15, waterLitresPerAcre: 3000, kc: 0.45, stressFraction: 0.65, critical: false },
  { crop: 'cotton', stage: 'Vegetative', daysStart: 20, daysEnd: 60, intervalDays: 12, waterLitresPerAcre: 4500, kc: 0.75, stressFraction: 0.50, critical: false },
  { crop: 'cotton', stage: 'Flowering', daysStart: 60, daysEnd: 90, intervalDays: 10, waterLitresPerAcre: 6000, kc: 1.15, stressFraction: 0.40, critical: true },
  { crop: 'cotton', stage: 'Boll Dev.', daysStart: 90, daysEnd: 130, intervalDays: 12, waterLitresPerAcre: 5500, kc: 1.10, stressFraction: 0.45, critical: true },
  { crop: 'cotton', stage: 'Boll Opening', daysStart: 130, daysEnd: 180, intervalDays: 20, waterLitresPerAcre: 3000, kc: 0.60, stressFraction: 0.65, critical: false },
  
  // Mustard
  { crop: 'mustard', stage: 'Seedling', daysStart: 0, daysEnd: 20, intervalDays: 25, waterLitresPerAcre: 3800, kc: 0.40, stressFraction: 0.60, critical: false },
  { crop: 'mustard', stage: 'Vegetative', daysStart: 20, daysEnd: 50, intervalDays: 20, waterLitresPerAcre: 4500, kc: 0.75, stressFraction: 0.50, critical: false },
  { crop: 'mustard', stage: 'Flowering', daysStart: 50, daysEnd: 75, intervalDays: 18, waterLitresPerAcre: 5000, kc: 1.10, stressFraction: 0.40, critical: true },
  { crop: 'mustard', stage: 'Pod Filling', daysStart: 75, daysEnd: 95, intervalDays: 20, waterLitresPerAcre: 4200, kc: 0.90, stressFraction: 0.50, critical: false },
  { crop: 'mustard', stage: 'Maturity', daysStart: 95, daysEnd: 110, intervalDays: 20, waterLitresPerAcre: 2500, kc: 0.40, stressFraction: 0.65, critical: false }
];

async function seedCropData() {
  const tableName = process.env.CROP_DATA_TABLE || 'crop-data';
  
  console.log(`Seeding ${cropData.length} crop stage records...`);
  
  for (const data of cropData) {
    const item = {
      pk: `crop#${data.crop}`,
      sk: `stage#${data.stage}`,
      stageName: data.stage,
      daysStart: data.daysStart,
      daysEnd: data.daysEnd,
      intervalDays: data.intervalDays,
      waterLitresPerAcre: data.waterLitresPerAcre,
      kc: data.kc,
      stressFraction: data.stressFraction,
      critical: data.critical
    };
    
    const command = new PutCommand({ TableName: tableName, Item: item });
    await docClient.send(command);
    console.log(`✓ ${data.crop} - ${data.stage}`);
  }
  
  console.log('Crop data seeding complete!');
}

seedCropData().catch(console.error);
