const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { BedrockAgentRuntimeClient, RetrieveCommand, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
const { 
  addConversationTurn, 
  getConversationHistory, 
  buildContextPrompt,
  isFollowUpQuestion 
} = require('../utils/contextManager');
const { SmartChunker } = require('../utils/smartChunker');
const { ToolManager } = require('../utils/toolManager');

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const agentClient = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const chunker = new SmartChunker({ chunkSize: 500, chunkOverlap: 100 });
const toolManager = new ToolManager();

const SYSTEM_PROMPT = `तुम एक कृषि सलाहकार हो। सिर्फ हिंदी में जवाब दो।

नियम:
- केवल हिंदी में बोलो
- सरल, छोटे वाक्य
- कोई अंग्रेजी नहीं
- कोई नोट या टिप्पणी नहीं
- सिर्फ जवाब दो

फॉर्मेट:
1. सीधा जवाब (1-2 लाइन)
2. विस्तार से समझाओ
3. जरूरत हो तो स्टेप बताओ
4. एक टिप

बस इतना ही। कुछ और नहीं।`;

async function retrieveFromKnowledgeBase(query) {
  const kbId = process.env.KNOWLEDGE_BASE_ID;
  if (!kbId) return [];

  try {
    const response = await agentClient.send(new RetrieveCommand({
      knowledgeBaseId: kbId,
      retrievalQuery: { text: query },
      retrievalConfiguration: {
        vectorSearchConfiguration: {
          numberOfResults: 5, // Increased for better context
          overrideSearchType: 'HYBRID' // Combines semantic + keyword search
        }
      }
    }));

    return response.retrievalResults || [];
  } catch (error) {
    console.error('KB retrieval error:', error);
    return [];
  }
}

async function invokeAgent(query, sessionId) {
  const agentId = process.env.AGENT_ID;
  const agentAliasId = process.env.AGENT_ALIAS_ID;
  
  if (!agentId || !agentAliasId) return null;

  try {
    const response = await agentClient.send(new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId,
      inputText: query
    }));

    let completion = '';
    for await (const event of response.completion) {
      if (event.chunk) {
        completion += new TextDecoder().decode(event.chunk.bytes);
      }
    }

    return completion;
  } catch (error) {
    console.error('Agent invocation error:', error);
    return null;
  }
}

function detectLiveQuery(query) {
  const liveKeywords = ['pm-kisan', 'किस्त', 'subsidy', 'सब्सिडी', 'scheme', 'योजना', 'mandi', 'मंडी', 'price', 'कीमत'];
  return liveKeywords.some(keyword => query.toLowerCase().includes(keyword));
}

exports.handler = async (event) => {
  const startTime = Date.now();
  
  try {
    const body = JSON.parse(event.body);
    const { question, sessionId, useAgent = false, includeHistory = true } = body;

    if (!question || !sessionId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'question and sessionId are required' })
      };
    }

    // Get conversation history for context
    const history = includeHistory ? await getConversationHistory(sessionId, 3) : [];
    const isFollowUp = isFollowUpQuestion(question);

    let answer = '';
    let source = '';
    let isLiveAnswer = false;
    let toolsUsed = [];
    let additionalData = {};

    // Check if YouTube videos needed
    if (toolManager.needsYouTube(question)) {
      console.log('YouTube search triggered');
      const youtubeResult = await toolManager.searchYouTube(question, 3);
      if (youtubeResult.success) {
        toolsUsed.push('youtube');
        additionalData.videos = youtubeResult.videos;
        source = 'YouTube Videos';
      }
    }

    // Check if web search needed
    if (toolManager.needsWebSearch(question)) {
      console.log('Web search triggered');
      const webResult = await toolManager.searchWeb(question);
      if (webResult.success) {
        toolsUsed.push('web');
        additionalData.webLinks = webResult.suggestions;
        source = source ? source + ' + Web Search' : 'Web Search';
        isLiveAnswer = true;
      }
    }

    // Check if live query (fallback to agent if available)
    if (detectLiveQuery(question) || useAgent) {
      const agentResponse = await invokeAgent(question, sessionId);
      if (agentResponse) {
        answer = agentResponse;
        source = 'Live Web Answer';
        isLiveAnswer = true;
      }
    }

    // Fallback to RAG
    if (!answer) {
      const retrievedDocs = await retrieveFromKnowledgeBase(question);
      
      // Use smart chunker to merge retrieved docs intelligently
      const mergedContext = chunker.mergeChunks(retrievedDocs, 2000);
      
      let context = '';
      if (mergedContext) {
        context = mergedContext;
        source = source || retrievedDocs[0]?.location?.s3Location?.uri || 'ICAR Knowledge Base';
      }

      // Add tool results to context
      let toolContext = '';
      if (additionalData.videos) {
        toolContext += toolManager.formatYouTubeForPrompt({ success: true, videos: additionalData.videos });
      }
      if (additionalData.webLinks) {
        toolContext += toolManager.formatWebSearchForPrompt({ success: true, suggestions: additionalData.webLinks });
      }

      // Build conversational, human-style prompt
      const contextSection = context 
        ? `\n\nजानकारी:\n${context}`
        : '';

      const conversationContext = history.length > 0
        ? `\n\nपिछली बातचीत:\n${history.slice(-2).map(h => `किसान: ${h.question}\nतुम: ${h.answer}`).join('\n')}\n`
        : '';

      const fullPrompt = `${SYSTEM_PROMPT}${contextSection}${toolContext}${conversationContext}

सवाल: ${question}

जवाब:`;

      // Using Meta Llama 3 8B (free, no payment required)
      const payload = {
        prompt: fullPrompt,
        max_gen_len: 600,
        temperature: 0.7,
        top_p: 0.9,
        stop: [
          '\n\nसवाल:', 
          '\n\nकिसान:', 
          'Translation',
          'Example',
          'Script',
          'As a',
          'This script',
          '**'
        ]
      };

      const response = await bedrockClient.send(new InvokeModelCommand({
        modelId: 'meta.llama3-8b-instruct-v1:0',
        body: JSON.stringify(payload),
        contentType: 'application/json',
        accept: 'application/json'
      }));

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      answer = responseBody.generation.trim();
      
      // Clean up any artifacts and extra content
      answer = answer
        .replace(/^(जवाब|तुम्हारा जवाब|Answer):?\s*/i, '')
        .replace(/\n\n(Note|नोट|Tips|टिप्स|Translation|Example|Script|Format|Remember|याद रखो):.*/gs, '')
        .replace(/\(Translation\).*/gs, '')
        .replace(/As a seasoned.*/gs, '')
        .replace(/Let's go over.*/gs, '')
        .replace(/This script.*/gs, '')
        .replace(/I hope this helps.*/gs, '')
        .replace(/Please note.*/gs, '')
        .replace(/\*\*.*?\*\*/g, '')
        .replace(/###.*/g, '')
        .replace(/##.*/g, '')
        .replace(/#.*/g, '')  // Remove lines starting with #
        .replace(/print.*/gi, '')  // Remove print statements
        .replace(/response.*/gi, '')  // Remove response references
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // Remove any remaining English paragraphs and code-like content
      const lines = answer.split('\n');
      const cleanedLines = lines.filter(line => {
        const trimmed = line.trim();
        
        // Skip empty lines
        if (!trimmed) return true;
        
        // Skip lines that look like code or comments
        if (trimmed.startsWith('#') || 
            trimmed.startsWith('//') || 
            trimmed.startsWith('print') ||
            trimmed.includes('response') ||
            trimmed.includes('extra') ||
            trimmed.includes('text')) {
          return false;
        }
        
        // Keep Hindi lines
        const hasHindi = /[\u0900-\u097F]/.test(trimmed);
        if (hasHindi) return true;
        
        // Skip English-only lines
        const isEnglishOnly = /^[a-zA-Z\s\.,!?;:'"()\-]+$/.test(trimmed);
        return !isEnglishOnly;
      });
      
      answer = cleanedLines.join('\n').trim();
      
      // Final cleanup - remove any remaining artifacts
      answer = answer
        .replace(/\n\s*\n\s*\n/g, '\n\n')  // Multiple newlines to double
        .trim();
    }

    const latency = Date.now() - startTime;

    // Store conversation turn
    await addConversationTurn(sessionId, question, answer, {
      source,
      isLiveAnswer,
      latency,
      toolsUsed
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        answer,
        source,
        isLiveAnswer,
        sessionId,
        isFollowUp,
        conversationTurns: history.length + 1,
        latency,
        toolsUsed,
        videos: additionalData.videos || [],
        webLinks: additionalData.webLinks || []
      })
    };

  } catch (error) {
    console.error('Query error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
