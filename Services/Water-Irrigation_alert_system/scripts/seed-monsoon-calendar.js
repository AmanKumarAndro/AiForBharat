const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const monsoonData = [
  { district: 'Karnal', state: 'Haryana', onset: '06-29', retreat: '09-25', annualMm: 780, zone: 'Northwest India' },
  { district: 'Ludhiana', state: 'Punjab', onset: '06-27', retreat: '09-23', annualMm: 720, zone: 'Northwest India' },
  { district: 'Amritsar', state: 'Punjab', onset: '06-26', retreat: '09-22', annualMm: 680, zone: 'Northwest India' },
  { district: 'Meerut', state: 'Uttar Pradesh', onset: '06-25', retreat: '09-28', annualMm: 890, zone: 'Central India' },
  { district: 'Varanasi', state: 'Uttar Pradesh', onset: '06-18', retreat: '10-01', annualMm: 1020, zone: 'Central India' },
  { district: 'Nagpur', state: 'Maharashtra', onset: '06-10', retreat: '10-05', annualMm: 1050, zone: 'Central India' },
  { district: 'Pune', state: 'Maharashtra', onset: '06-07', retreat: '10-10', annualMm: 722, zone: 'Central India' },
  { district: 'Guntur', state: 'Andhra Pradesh', onset: '06-05', retreat: '10-20', annualMm: 980, zone: 'South India' },
  { district: 'Coimbatore', state: 'Tamil Nadu', onset: '06-01', retreat: '10-25', annualMm: 695, zone: 'South India' },
  { district: 'Thiruvananthapuram', state: 'Kerala', onset: '06-01', retreat: '11-01', annualMm: 1700, zone: 'South India' },
  { district: 'Patna', state: 'Bihar', onset: '06-13', retreat: '10-10', annualMm: 1150, zone: 'East India' },
  { district: 'Jaipur', state: 'Rajasthan', onset: '07-01', retreat: '09-15', annualMm: 530, zone: 'Northwest India' }
];

async function seedMonsoonCalendar() {
  const tableName = process.env.MONSOON_TABLE || 'monsoon-calendar';
  
  console.log(`Seeding ${monsoonData.length} monsoon calendar records...`);
  
  for (const data of monsoonData) {
    const item = {
      pk: `district#${data.district}`,
      sk: 'monsoon',
      state: data.state,
      onset: data.onset,
      retreat: data.retreat,
      annualRainfallMm: data.annualMm,
      zone: data.zone
    };
    
    const command = new PutCommand({ TableName: tableName, Item: item });
    await docClient.send(command);
    console.log(`✓ ${data.district}, ${data.state}`);
  }
  
  console.log('Monsoon calendar seeding complete!');
}

seedMonsoonCalendar().catch(console.error);
