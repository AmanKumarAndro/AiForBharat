const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const inspectTable = async (tableName) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 Inspecting: ${tableName}`);
  console.log('='.repeat(80));
  
  try {
    const command = new ScanCommand({
      TableName: tableName,
      Limit: 3, // Get first 3 items
    });
    
    const response = await docClient.send(command);
    
    console.log(`\n✅ Total items scanned: ${response.Count}`);
    console.log(`📊 Scanned count: ${response.ScannedCount}`);
    
    if (response.Items && response.Items.length > 0) {
      console.log(`\n📝 Sample item structure:\n`);
      response.Items.forEach((item, index) => {
        console.log(`Item ${index + 1}:`);
        console.log(JSON.stringify(item, null, 2));
        console.log('\nFields:', Object.keys(item).join(', '));
        console.log('');
      });
    } else {
      console.log('\n⚠️  No items found in table');
    }
    
  } catch (error) {
    console.error(`\n❌ Error inspecting ${tableName}:`, error.message);
  }
};

const main = async () => {
  console.log('🔍 Inspecting DynamoDB Tables\n');
  
  // Inspect key tables
  await inspectTable('kisanvoice-auth-api-dev-farmers');
  await inspectTable('HH_Requests');
  await inspectTable('farmer-voice-ai-dev-sessions');
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Inspection complete\n');
};

main();
