const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const getAllUsers = async () => {
  console.log('🔍 Fetching all users from all tables...\n');
  
  const tables = [
    'kisanvoice-auth-api-dev-farmers',
    'kisanvoice-irrigation-dev-farmers',
  ];
  
  for (const tableName of tables) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 Table: ${tableName}`);
    console.log('='.repeat(80));
    
    try {
      const response = await docClient.send(new ScanCommand({
        TableName: tableName,
      }));
      
      console.log(`\n✅ Total users: ${response.Count}`);
      
      if (response.Items && response.Items.length > 0) {
        console.log('\n📝 Users:\n');
        response.Items.forEach((item, index) => {
          console.log(`User ${index + 1}:`);
          console.log(`  Name: ${item.name || item.farmer_name || 'N/A'}`);
          console.log(`  Phone: ${item.phone || item.farmer_id || item.pk || 'N/A'}`);
          console.log(`  Location: ${item.city || item.state || item.location || 'N/A'}`);
          console.log(`  Created: ${item.createdAt || item.created_at || 'N/A'}`);
          console.log('');
        });
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  // Also check service requests for unique farmers
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 Unique Farmers from Service Requests`);
  console.log('='.repeat(80));
  
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'HH_Requests',
    }));
    
    const uniqueFarmers = {};
    response.Items?.forEach(item => {
      const farmerId = item.farmer_id;
      if (farmerId && !uniqueFarmers[farmerId]) {
        uniqueFarmers[farmerId] = {
          name: item.farmer_name,
          phone: farmerId,
          pincode: item.farmer_pincode,
        };
      }
    });
    
    console.log(`\n✅ Total unique farmers: ${Object.keys(uniqueFarmers).length}\n`);
    
    Object.values(uniqueFarmers).forEach((farmer, index) => {
      console.log(`Farmer ${index + 1}:`);
      console.log(`  Name: ${farmer.name}`);
      console.log(`  Phone: ${farmer.phone}`);
      console.log(`  Pincode: ${farmer.pincode}`);
      console.log('');
    });
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
};

getAllUsers();
