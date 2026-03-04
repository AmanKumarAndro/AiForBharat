/**
 * Tool Manager - Integrates web search and YouTube tools
 * Automatically decides which tool to use based on user query
 */

const https = require('https');

class ToolManager {
  constructor() {
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  }

  /**
   * Detect if query needs YouTube videos
   */
  needsYouTube(query) {
    const youtubeKeywords = [
      'video', 'वीडियो', 'देखना', 'tutorial', 'ट्यूटोरियल',
      'कैसे', 'how to', 'सीखना', 'learn', 'youtube', 'यूट्यूब',
      'दिखाओ', 'show me', 'guide', 'गाइड'
    ];
    
    const lowerQuery = query.toLowerCase();
    return youtubeKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  /**
   * Detect if query needs live web search
   */
  needsWebSearch(query) {
    const webKeywords = [
      'price', 'कीमत', 'mandi', 'मंडी', 'rate', 'रेट',
      'latest', 'ताज़ा', 'current', 'वर्तमान', 'today', 'आज',
      'scheme', 'योजना', 'subsidy', 'सब्सिडी', 'pm-kisan', 'किस्त',
      'news', 'समाचार', 'update', 'अपडेट'
    ];
    
    const lowerQuery = query.toLowerCase();
    return webKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  /**
   * Search YouTube for farming videos
   */
  async searchYouTube(query, maxResults = 3) {
    try {
      // Add farming context to query
      const searchQuery = `${query} खेती farming hindi`;
      
      if (!this.youtubeApiKey) {
        const mockVideos = this.getMockYouTubeResults(query);
        return {
          success: true,
          source: 'YouTube',
          videos: mockVideos,
          count: mockVideos.length
        };
      }

      const videos = await this.callYouTubeAPI(searchQuery, maxResults);
      return {
        success: true,
        source: 'YouTube',
        videos,
        count: videos.length
      };
    } catch (error) {
      console.error('YouTube search error:', error);
      const mockVideos = this.getMockYouTubeResults(query);
      return {
        success: true,
        source: 'YouTube',
        videos: mockVideos,
        count: mockVideos.length
      };
    }
  }

  /**
   * Call YouTube Data API
   */
  async callYouTubeAPI(query, maxResults) {
    return new Promise((resolve, reject) => {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&type=video&maxResults=${maxResults}&key=${this.youtubeApiKey}&relevanceLanguage=hi&regionCode=IN`;

      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.error) {
              resolve(this.getMockYouTubeResults(query));
              return;
            }

            const videos = (response.items || []).map(item => ({
              title: item.snippet.title,
              description: item.snippet.description.slice(0, 150) + '...',
              channel: item.snippet.channelTitle,
              url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              thumbnail: item.snippet.thumbnails.medium.url
            }));

            resolve(videos);
          } catch (error) {
            resolve(this.getMockYouTubeResults(query));
          }
        });
      }).on('error', () => {
        resolve(this.getMockYouTubeResults(query));
      });
    });
  }

  /**
   * Mock YouTube results - Returns YouTube search link
   * Note: Without YouTube API key, we return a search link instead of specific videos
   */
  getMockYouTubeResults(query) {
    // Create YouTube search URL for the query
    const searchQuery = encodeURIComponent(`${query} खेती farming hindi tutorial`);
    const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    
    return [
      {
        title: `${query} - YouTube पर खोजें`,
        description: `${query} से संबंधित वीडियो देखने के लिए YouTube पर खोजें`,
        channel: 'YouTube Search',
        url: searchUrl,
        thumbnail: 'https://www.youtube.com/img/desktop/yt_1200.png',
        videoId: 'search'
      }
    ];
  }

  /**
   * Search web for live information
   */
  async searchWeb(query) {
    try {
      // For now, return structured response indicating web search needed
      // In production, integrate with a web search API (Serper, Brave, etc.)
      
      return {
        success: true,
        source: 'Web Search',
        message: 'लाइव जानकारी के लिए कृपया सरकारी वेबसाइट देखें',
        suggestions: [
          {
            title: 'PM-KISAN Portal',
            url: 'https://pmkisan.gov.in/',
            description: 'किसान सम्मान निधि योजना की जानकारी'
          },
          {
            title: 'eNAM Mandi Prices',
            url: 'https://enam.gov.in/web/',
            description: 'मंडी भाव और कीमतें'
          },
          {
            title: 'Kisan Call Centre',
            url: 'https://mkisan.gov.in/',
            description: 'किसान कॉल सेंटर - 1800-180-1551'
          }
        ]
      };
    } catch (error) {
      console.error('Web search error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format tool results for natural language response
   */
  formatYouTubeForPrompt(youtubeResult) {
    if (!youtubeResult.success || !youtubeResult.videos.length) {
      return '';
    }

    const videoList = youtubeResult.videos.map((video, idx) => 
      `${idx + 1}. ${video.title}\n   ${video.channel}\n   देखें: ${video.url}`
    ).join('\n\n');

    return `\n\nयूट्यूब पर खोजें:\n${videoList}\n\nइस लिंक पर क्लिक करके आप संबंधित वीडियो देख सकते हैं।`;
  }

  formatWebSearchForPrompt(webResult) {
    if (!webResult.success) {
      return '';
    }

    if (webResult.suggestions) {
      const suggestionList = webResult.suggestions.map((s, idx) =>
        `${idx + 1}. ${s.title}: ${s.url}\n   ${s.description}`
      ).join('\n\n');

      return `\n\nउपयोगी लिंक:\n${suggestionList}`;
    }

    return '';
  }
}

module.exports = { ToolManager };
