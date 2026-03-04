const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { 
  addConversationTurn, 
  getConversationHistory 
} = require('../utils/contextManager');

const agentClient = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const pollyClient = new PollyClient({ region: process.env.AWS_REGION || 'ap-south-1' });

async function invokeAgentWithTools(question, sessionId) {
  const agentId = process.env.AGENT_ID;
  const agentAliasId = process.env.AGENT_ALIAS_ID;
  
  if (!agentId || !agentAliasId) {
    throw new Error('AGENT_ID and AGENT_ALIAS_ID must be configured');
  }

  try {
    const response = await agentClient.send(new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId,
      inputText: question,
      enableTrace: true // Enable to see which tool was used
    }));

    let answer = '';
    let toolUsed = 'unknown';
    let source = '';
    const traces = [];

    // Process streaming response
    for await (const event of response.completion) {
      if (event.chunk) {
        const chunk = new TextDecoder().decode(event.chunk.bytes);
        answer += chunk;
      }
      
      // Capture trace to determine which tool was used
      if (event.trace) {
        traces.push(event.trace);
        
        // Check if Knowledge Base was used
        if (event.trace.orchestrationTrace?.modelInvocationInput?.traceId) {
          const trace = event.trace.orchestrationTrace;
          if (trace.observation?.knowledgeBaseLookupOutput) {
            toolUsed = 'rag';
            source = 'ICAR Knowledge Base';
          }
        }
        
        // Check if Lambda tools were used
        if (event.trace.orchestrationTrace?.observation?.actionGroupInvocationOutput) {
          const output = event.trace.orchestrationTrace.observation.actionGroupInvocationOutput;
          if (output.text && output.text.includes('web_search')) {
            toolUsed = 'web';
            source = 'Live Web Search';
          } else if (output.text && output.text.includes('query_farmer_database')) {
            toolUsed = 'dynamo';
            source = 'Farmer Database';
          } else if (output.text && output.text.includes('search_youtube_videos')) {
            toolUsed = 'youtube';
            source = 'YouTube Videos';
          }
        }
      }
    }

    // Determine mode based on tool used
    let mode = 'agent';
    if (toolUsed === 'rag') {
      mode = 'rag';
    } else if (toolUsed === 'web') {
      mode = 'web';
    } else if (toolUsed === 'dynamo') {
      mode = 'dynamo';
    } else if (toolUsed === 'youtube') {
      mode = 'youtube';
    }

    return {
      answer: answer.trim(),
      mode,
      source,
      traces
    };

  } catch (error) {
    console.error('Agent invocation error:', error);
    throw error;
  }
}

async function synthesizeSpeech(text) {
  try {
    const response = await pollyClient.send(new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: 'Kajal',
      Engine: 'neural',
      LanguageCode: 'hi-IN'
    }));

    const chunks = [];
    for await (const chunk of response.AudioStream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('base64');
  } catch (error) {
    console.error('TTS error:', error);
    return null;
  }
}

// Extract numbered steps from answer
function extractSteps(answer) {
  const steps = [];
  const lines = answer.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(\d+)[.)]\s*(.+)/);
    if (match) {
      steps.push({
        step: parseInt(match[1]),
        text: match[2].trim()
      });
    }
  }
  
  return steps.length > 0 ? steps : [{ step: 1, text: answer }];
}

exports.handler = async (event) => {
  const startTime = Date.now();
  
  try {
    const body = JSON.parse(event.body);
    const { transcript, question, sessionId } = body;

    // Use transcript if provided (from voice), otherwise use question (from text)
    const queryText = transcript || question;

    if (!queryText || !sessionId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'transcript/question and sessionId are required' 
        })
      };
    }

    // Get conversation history for context
    const history = await getConversationHistory(sessionId, 3);

    // Invoke Bedrock Agent (agent decides which tool to use)
    const { answer, mode, source, traces } = await invokeAgentWithTools(queryText, sessionId);

    // Extract numbered steps
    const steps = extractSteps(answer);

    // Generate audio
    const audioBase64 = await synthesizeSpeech(answer);

    const latency = Date.now() - startTime;

    // Store conversation turn
    await addConversationTurn(sessionId, queryText, answer, {
      source,
      mode,
      latency
    });

    // Return response in the specified format
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        transcript: queryText,
        answer_hi: answer,
        steps,
        audio_url: audioBase64 ? `data:audio/mp3;base64,${audioBase64}` : null,
        source,
        mode, // 'rag' or 'web' based on which tool agent used
        sessionId,
        conversationTurns: history.length + 1,
        latency
      })
    };

  } catch (error) {
    console.error('Agent query error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: error.message,
        details: 'Make sure AGENT_ID and AGENT_ALIAS_ID are configured'
      })
    };
  }
};
