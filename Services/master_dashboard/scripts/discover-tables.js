const { DynamoDBClient, ListTablesCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});

// Keywords to identify table types
const TABLE_PATTERNS = {
  farmers: ['farmer', 'user', 'account'],
  voiceQueries: ['voice', 'query', 'question', 'chat', 'conversation'],
  weatherAlerts: ['weather', 'alert', 'advisory', 'forecast'],
  irrigationAlerts: ['irrigation', 'water', 'schedule'],
  serviceRequests: ['service', 'request', 'helping', 'hand', 'support'],
  marketQueries: ['market', 'price', 'commodity', 'mandi'],
};

const matchTableType = (tableName) => {
  const lowerName = tableName.toLowerCase();
  
  for (const [type, keywords] of Object.entries(TABLE_PATTERNS)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return type;
    }
  }
  
  return 'unknown';
};

const getTableInfo = async (tableName) => {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await client.send(command);
    
    return {
      name: tableName,
      itemCount: response.Table.ItemCount || 0,
      sizeBytes: response.Table.TableSizeBytes || 0,
      status: response.Table.TableStatus,
      createdAt: response.Table.CreationDateTime,
    };
  } catch (error) {
    return {
      name: tableName,
      error: error.message,
    };
  }
};

const discoverTables = async () => {
  console.log('🔍 Discovering DynamoDB tables...\n');
  
  try {
    // List all tables
    const listCommand = new ListTablesCommand({});
    const { TableNames } = await client.send(listCommand);
    
    if (!TableNames || TableNames.length === 0) {
      console.log('❌ No DynamoDB tables found in this region.');
      console.log('💡 Make sure your AWS credentials are configured and you have the right region set.\n');
      return;
    }
    
    console.log(`✅ Found ${TableNames.length} DynamoDB tables\n`);
    
    // Get detailed info for each table
    const tableInfoPromises = TableNames.map(getTableInfo);
    const tables = await Promise.all(tableInfoPromises);
    
    // Categorize tables
    const categorized = {
      farmers: [],
      voiceQueries: [],
      weatherAlerts: [],
      irrigationAlerts: [],
      serviceRequests: [],
      marketQueries: [],
      unknown: [],
    };
    
    tables.forEach(table => {
      const type = matchTableType(table.name);
      categorized[type].push(table);
    });
    
    // Display results
    console.log('📊 TABLE CATEGORIZATION\n');
    console.log('=' .repeat(80));
    
    Object.entries(categorized).forEach(([category, tables]) => {
      if (tables.length > 0) {
        console.log(`\n${category.toUpperCase()}:`);
        tables.forEach(table => {
          const items = table.itemCount !== undefined ? `${table.itemCount} items` : 'N/A';
          const size = table.sizeBytes !== undefined ? `${(table.sizeBytes / 1024).toFixed(2)} KB` : 'N/A';
          console.log(`  • ${table.name}`);
          console.log(`    Items: ${items} | Size: ${size} | Status: ${table.status || 'Unknown'}`);
        });
      }
    });
    
    // Generate serverless.yml config
    console.log('\n\n' + '='.repeat(80));
    console.log('📝 SUGGESTED SERVERLESS.YML CONFIGURATION\n');
    console.log('Copy this into your serverless.yml under "custom.tables":\n');
    console.log('custom:');
    console.log('  tables:');
    
    Object.entries(categorized).forEach(([category, tables]) => {
      if (category !== 'unknown' && tables.length > 0) {
        const suggestedTable = tables[0].name; // Pick first match
        console.log(`    ${category}: ${suggestedTable}`);
      } else if (category !== 'unknown') {
        console.log(`    ${category}: ${category}_table  # ⚠️  No match found - update manually`);
      }
    });
    
    if (categorized.unknown.length > 0) {
      console.log('\n\n⚠️  UNMATCHED TABLES (review manually):');
      categorized.unknown.forEach(table => {
        console.log(`  • ${table.name}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 TIP: Review the suggestions above and update serverless.yml accordingly.\n');
    
  } catch (error) {
    console.error('❌ Error discovering tables:', error.message);
    console.log('\n💡 Common issues:');
    console.log('  • AWS credentials not configured (run: aws configure)');
    console.log('  • Wrong region selected (check AWS_REGION environment variable)');
    console.log('  • Insufficient IAM permissions (need dynamodb:ListTables and dynamodb:DescribeTable)\n');
  }
};

// Run discovery
discoverTables();
