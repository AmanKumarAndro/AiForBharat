const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });

async function testAgent() {
  try {
    console.log('Testing Bedrock Agent invocation...');
    console.log('Agent ID:', 'WXNUIKEH7R');
    console.log('Alias ID:', 'KSNVLZJ1KA');
    
    const response = await client.send(new InvokeAgentCommand({
      agentId: 'WXNUIKEH7R',
      agentAliasId: 'KSNVLZJ1KA',
      sessionId: 'test-direct-' + Date.now(),
      inputText: 'गेहूं की बुवाई कब करें?',
      enableTrace: true
    }));

    console.log('\n✅ SUCCESS! Agent responded.');
    
    let answer = '';
    for await (const event of response.completion) {
      if (event.chunk) {
        const chunk = new TextDecoder().decode(event.chunk.bytes);
        answer += chunk;
      }
    }
    
    console.log('\nAnswer:', answer);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Error code:', error.name);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

testAgent();
