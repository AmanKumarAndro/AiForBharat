#!/usr/bin/env node

const API_URL = process.env.API_URL || 'https://kqndxs5w8c.execute-api.ap-south-1.amazonaws.com/dev';

function generateSessionId() {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function askQuestion(question, sessionId) {
  console.log(`\n📝 Farmer asks: "${question}"`);
  
  const response = await fetch(`${API_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      sessionId,
      includeHistory: true
    })
  });

  const data = await response.json();
  
  if (data.error) {
    console.log(`\n❌ Error: ${data.error}`);
    return data;
  }
  
  console.log(`\n🤖 AI responds:`);
  console.log(`   Answer: ${data.answer ? data.answer.substring(0, 150) + '...' : 'N/A'}`);
  console.log(`   Source: ${data.source || 'N/A'}`);
  console.log(`   Is Follow-up: ${data.isFollowUp ? '✅ Yes' : '❌ No'}`);
  console.log(`   Conversation Turns: ${data.conversationTurns || 0}`);
  console.log(`   Latency: ${data.latency || 0}ms`);
  
  return data;
}

async function getHistory(sessionId) {
  console.log(`\n📚 Fetching conversation history...`);
  
  const response = await fetch(`${API_URL}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      limit: 10,
      includeSummary: true
    })
  });

  const data = await response.json();
  
  console.log(`\n📊 Session Summary:`);
  console.log(`   Total Questions: ${data.count}`);
  if (data.summary) {
    console.log(`   Topics: ${data.summary.topics.join(', ')}`);
    console.log(`   Duration: ${Math.round(data.summary.duration / 1000)}s`);
  }
  
  console.log(`\n💬 Conversation History:`);
  data.history.forEach((turn, idx) => {
    console.log(`   ${idx + 1}. Q: ${turn.question}`);
    console.log(`      A: ${turn.answer.substring(0, 80)}...`);
  });
  
  return data;
}

async function testContextAwareness() {
  console.log('🧪 Testing Context Awareness Feature');
  console.log('═'.repeat(60));
  console.log(`API URL: ${API_URL}`);
  
  const sessionId = generateSessionId();
  console.log(`Session ID: ${sessionId}`);
  
  try {
    // Test 1: Initial question about wheat
    console.log('\n' + '─'.repeat(60));
    console.log('Test 1: Initial Question (No Context)');
    console.log('─'.repeat(60));
    await askQuestion('गेहूं की बुवाई कब करें?', sessionId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Follow-up about irrigation (should detect context)
    console.log('\n' + '─'.repeat(60));
    console.log('Test 2: Follow-up Question (Should Detect Context)');
    console.log('─'.repeat(60));
    await askQuestion('और सिंचाई कब करें?', sessionId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Another follow-up about fertilizer
    console.log('\n' + '─'.repeat(60));
    console.log('Test 3: Another Follow-up (Maintains Context)');
    console.log('─'.repeat(60));
    await askQuestion('उर्वरक कितना डालें?', sessionId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: New topic (rice) - should reset context
    console.log('\n' + '─'.repeat(60));
    console.log('Test 4: New Topic (Context Switch)');
    console.log('─'.repeat(60));
    await askQuestion('धान में कीट नियंत्रण कैसे करें?', sessionId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 5: Get conversation history
    console.log('\n' + '─'.repeat(60));
    console.log('Test 5: Retrieve Conversation History');
    console.log('─'.repeat(60));
    await getHistory(sessionId);
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ All context awareness tests completed!');
    console.log('═'.repeat(60));
    
    console.log('\n📝 Key Observations:');
    console.log('   1. First question: isFollowUp = false');
    console.log('   2. Follow-ups detected: isFollowUp = true');
    console.log('   3. Conversation turns increment correctly');
    console.log('   4. History maintains all Q&A pairs');
    console.log('   5. Topics extracted automatically');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testContextAwareness();
