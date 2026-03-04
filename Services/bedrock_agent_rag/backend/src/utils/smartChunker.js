/**
 * Smart Chunking Strategy for Natural Human-like Answers
 * 
 * This chunker preserves semantic meaning and context for better RAG results
 */

class SmartChunker {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 500; // tokens
    this.chunkOverlap = options.chunkOverlap || 100; // overlap for context
    this.minChunkSize = options.minChunkSize || 100;
  }

  /**
   * Semantic chunking - splits on natural boundaries
   */
  chunkBySemanticBoundaries(text) {
    // Split on major boundaries (paragraphs, sections)
    const sections = text.split(/\n\n+/);
    const chunks = [];
    let currentChunk = '';

    for (const section of sections) {
      const sectionLength = this.estimateTokens(section);
      const currentLength = this.estimateTokens(currentChunk);

      if (currentLength + sectionLength > this.chunkSize && currentChunk) {
        // Save current chunk
        chunks.push(this.cleanChunk(currentChunk));
        
        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk);
        currentChunk = overlapText + '\n\n' + section;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + section;
      }
    }

    if (currentChunk) {
      chunks.push(this.cleanChunk(currentChunk));
    }

    return chunks;
  }

  /**
   * Sentence-aware chunking - never breaks mid-sentence
   */
  chunkBySentences(text) {
    const sentences = text.match(/[^।.!?]+[।.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const sentenceLength = this.estimateTokens(sentence);
      const currentLength = this.estimateTokens(currentChunk);

      if (currentLength + sentenceLength > this.chunkSize && currentChunk) {
        chunks.push(this.cleanChunk(currentChunk));
        
        // Add overlap
        const lastSentences = this.getLastSentences(currentChunk, 2);
        currentChunk = lastSentences + ' ' + sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(this.cleanChunk(currentChunk));
    }

    return chunks;
  }

  /**
   * Topic-based chunking - keeps related content together
   */
  chunkByTopics(text) {
    // Detect topic boundaries (headers, numbered lists, etc.)
    const topicPattern = /(?:^|\n)(?:\d+\.|[#]+\s|[A-Z][^।.\n]{10,}:)/gm;
    const topics = [];
    let lastIndex = 0;
    let match;

    while ((match = topicPattern.exec(text)) !== null) {
      if (lastIndex < match.index) {
        topics.push(text.slice(lastIndex, match.index));
      }
      lastIndex = match.index;
    }
    
    if (lastIndex < text.length) {
      topics.push(text.slice(lastIndex));
    }

    // Combine small topics, split large ones
    const chunks = [];
    let currentChunk = '';

    for (const topic of topics) {
      const topicLength = this.estimateTokens(topic);
      const currentLength = this.estimateTokens(currentChunk);

      if (topicLength > this.chunkSize) {
        // Topic too large, split by sentences
        if (currentChunk) {
          chunks.push(this.cleanChunk(currentChunk));
          currentChunk = '';
        }
        chunks.push(...this.chunkBySentences(topic));
      } else if (currentLength + topicLength > this.chunkSize && currentChunk) {
        chunks.push(this.cleanChunk(currentChunk));
        currentChunk = topic;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + topic;
      }
    }

    if (currentChunk) {
      chunks.push(this.cleanChunk(currentChunk));
    }

    return chunks;
  }

  /**
   * Hybrid chunking - combines all strategies
   */
  smartChunk(text, metadata = {}) {
    // Choose strategy based on content type
    let chunks;

    if (this.hasStructuredContent(text)) {
      chunks = this.chunkByTopics(text);
    } else if (this.hasLongParagraphs(text)) {
      chunks = this.chunkBySemanticBoundaries(text);
    } else {
      chunks = this.chunkBySentences(text);
    }

    // Add metadata to each chunk
    return chunks.map((chunk, index) => ({
      text: chunk,
      index,
      total: chunks.length,
      metadata: {
        ...metadata,
        chunkId: `${metadata.documentId || 'doc'}_chunk_${index}`,
        tokens: this.estimateTokens(chunk)
      }
    }));
  }

  /**
   * Merge retrieved chunks intelligently
   */
  mergeChunks(chunks, maxTokens = 2000) {
    if (!chunks || chunks.length === 0) return '';

    // Sort by relevance score if available
    const sortedChunks = chunks.sort((a, b) => 
      (b.score || 0) - (a.score || 0)
    );

    let merged = '';
    let tokenCount = 0;

    for (const chunk of sortedChunks) {
      const chunkText = chunk.content?.text || chunk.text || '';
      const chunkTokens = this.estimateTokens(chunkText);

      if (tokenCount + chunkTokens > maxTokens) break;

      merged += (merged ? '\n\n' : '') + chunkText;
      tokenCount += chunkTokens;
    }

    return merged;
  }

  // Helper methods

  estimateTokens(text) {
    // Rough estimate: 1 token ≈ 4 characters for English, 2 for Hindi
    const hasHindi = /[\u0900-\u097F]/.test(text);
    return Math.ceil(text.length / (hasHindi ? 2 : 4));
  }

  cleanChunk(text) {
    return text.trim().replace(/\n{3,}/g, '\n\n');
  }

  getOverlapText(text) {
    const sentences = text.match(/[^।.!?]+[।.!?]+/g) || [];
    const overlapSentences = sentences.slice(-2); // Last 2 sentences
    return overlapSentences.join(' ').slice(-this.chunkOverlap * 4);
  }

  getLastSentences(text, count) {
    const sentences = text.match(/[^।.!?]+[।.!?]+/g) || [];
    return sentences.slice(-count).join(' ');
  }

  hasStructuredContent(text) {
    // Check for headers, numbered lists, etc.
    return /(?:^|\n)(?:\d+\.|[#]+\s|[A-Z][^।.\n]{10,}:)/m.test(text);
  }

  hasLongParagraphs(text) {
    const paragraphs = text.split(/\n\n+/);
    return paragraphs.some(p => this.estimateTokens(p) > 200);
  }
}

module.exports = { SmartChunker };
