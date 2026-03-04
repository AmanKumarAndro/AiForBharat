#!/usr/bin/env node

const { BedrockAgentRuntimeClient, RetrieveCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

require('dotenv').config();

const agentClient = new BedrockAgentRuntimeClient({ region: 'ap-south-1' });
const bedrockClient = new BedrockRuntimeClient({ region: 'ap-south-1' });

const KNOWLEDGE_BASE_ID = process.env.KNOWLEDGE_BASE_ID;

if (!KNOWLEDGE_BASE_ID) {
  console.error('❌ KNOWLEDGE_BASE_ID not found in .env');
  process.exit(1);
}

async function testRetrieve(query) {
  console.log(`\n🔍 Testing Retrieve: "${query}"`);
  console.log('─'.repeat(60));

  try {
    const response = await agentClient.send(new RetrieveCommand({
      knowledgeBaseId: KNOWLEDGE_BASE_ID,
      retrievalQuery: { text: query },
      retrievalConfiguration: {
        vectorSearchConfiguration: {
          numberOfResults: 3
        }
      }
    }));

    console.log(`✅ Retrieved ${response.retrievalResults?.length || 0} documents\n`);

    response.retrievalResults?.forEach((doc, idx) => {
      console.log(`Document ${idx + 1}:`);
      console.log(`Score: ${doc.score?.toFixed(4)}`);
      console.log(`Content: ${doc.content.text.substring(0, 200)}...`);
      console.log(`Source: ${doc.location?.s3Location?.uri || 'N/A'}`);
      console.log('');
    });

    return response.retrievalResults;
  } catch (error) {
    console.error('❌ Retrieve failed:', error.message);
    throw error;
  }
}

async function testRAGWithClaude(query) {
  console.log(`\n🤖 Testing RAG + Claude: "${query}"`);
  console.log('─'.repeat(60));

  try {
    // Step 1: Retrieve
    const docs = await agentClient.send(new RetrieveCommand({
      knowledgeBaseId: KNOWLEDGE_BASE_ID,
      retrievalQuery: { text: query },
      retrievalConfiguration: {
        vectorSearchConfiguration: { numberOfResults: 3 }
      }
    }));

    const context = docs.retrievalResults?.map((doc, idx) => 
      `[${idx + 1}] ${doc.content.text}`
    ).join('\n\n') || 'कोई संदर्भ नहीं मिला।';

    // Step 2: Generate with Claude
    const prompt = `आप एक कृषि सलाहकार हैं। नीचे दिए गए संदर्भ के आधार पर जवाब दें।

संदर्भ:
${context}

प्रश्न: ${query}

कृपया क्रमांकित चरणों में जवाब दें:`;

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    };

    const response = await bedrockClient.send(new InvokeModelCommand({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      body: JSON.stringify(payload),
      contentType: 'application/json',
      accept: 'application/json'
    }));

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const answer = responseBody.content[0].text;

    console.log('✅ Generated Answer:\n');
    console.log(answer);
    console.log('');

    return answer;
  } catch (error) {
    console.error('❌ RAG failed:', error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🧪 Testing Bedrock Knowledge Base');
  console.log('Knowledge Base ID:', KNOWLEDGE_BASE_ID);
  console.log('═'.repeat(60));

  const testQueries = [
    'गेहूं की बुवाई कब करें?',
    'धान में कीट नियंत्रण कैसे करें?',
    'PM-KISAN योजना क्या है?',
    'मिट्टी की जांच कैसे करें?'
  ];

  for (const query of testQueries) {
    try {
      await testRetrieve(query);
      await testRAGWithClaude(query);
      console.log('═'.repeat(60));
    } catch (error) {
      console.error(`Failed for query: ${query}`);
    }
  }

  console.log('\n✅ All tests completed!');
}

runTests().catch(console.error);
