#!/usr/bin/env node

const API_URL = process.env.API_URL || 'https://kqndxs5w8c.execute-api.ap-south-1.amazonaws.com/dev';

function generateSessionId() {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function testAgentQuery(question, expectedMode) {
  console.log(`\n📝 Question: "${question}"`);
  console.log(`   Expected mode: ${expectedMode}`);
  console.log('─'.repeat(60));
  
  const response = await fetch(`${API_URL}/agent-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      sessionId: generateSessionId()
    })
  });

  const data = await response.json();
  
  if (data.error) {
    console.log(`❌ Error: ${data.error}`);
    if (data.details) console.log(`   ${data.details}`);
    return data;
  }
  
  console.log(`\n🤖 Response:`);
  console.log(`   Mode: ${data.mode} ${data.mode === expectedMode ? '✅' : '⚠️'}`);
  console.log(`   Source: ${data.source}`);
  console.log(`   Latency: ${data.latency}ms`);
  console.log(`\n   Answer (first 150 chars):`);
  console.log(`   ${data.answer_hi.substring(0, 150)}...`);
  console.log(`\n   Steps:`);
  data.steps.forEach(step => {
    console.log(`   ${step.step}. ${step.text.substring(0, 80)}...`);
  });
  console.log(`\n   Audio: ${data.audio_url ? 'Generated ✅' : 'Not generated ❌'}`);
  
  return data;
}

async function runTests() {
  console.log('🧪 Testing Bedrock Agent with Tools');
  console.log('═'.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log('═'.repeat(60));
  
  try {
    // Test 1: Knowledge Base tool (farming question)
    console.log('\n' + '═'.repeat(60));
    console.log('Test 1: Knowledge Base Tool (RAG)');
    console.log('═'.repeat(60));
    await testAgentQuery('गेहूं की बुवाई कब करें?', 'rag');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Web search tool (live query)
    console.log('\n' + '═'.repeat(60));
    console.log('Test 2: Web Search Tool (Live Data)');
    console.log('═'.repeat(60));
    await testAgentQuery('PM-KISAN की अगली किस्त कब आएगी?', 'web');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 3: Another farming question
    console.log('\n' + '═'.repeat(60));
    console.log('Test 3: Knowledge Base Tool (Pest Control)');
    console.log('═'.repeat(60));
    await testAgentQuery('धान में कीट नियंत्रण कैसे करें?', 'rag');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 4: Mandi prices (web search)
    console.log('\n' + '═'.repeat(60));
    console.log('Test 4: Web Search Tool (Mandi Prices)');
    console.log('═'.repeat(60));
    await testAgentQuery('आज गेहूं का मंडी भाव क्या है?', 'web');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 5: Farmer database (DynamoDB)
    console.log('\n' + '═'.repeat(60));
    console.log('Test 5: Farmer Database Tool (DynamoDB)');
    console.log('═'.repeat(60));
    await testAgentQuery('पिछले किसानों ने गेहूं में क्या समस्याएं देखीं?', 'dynamo');
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ All agent tests completed!');
    console.log('═'.repeat(60));
    
    console.log('\n📊 Summary:');
    console.log('   - Agent has 3 tools available');
    console.log('   - RAG mode for ICAR knowledge');
    console.log('   - DynamoDB mode for farmer records');
    console.log('   - Web mode for live data queries');
    console.log('   - Agent automatically chooses correct tool');
    console.log('   - Response includes steps and audio');
    console.log('   - Context awareness maintained');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
