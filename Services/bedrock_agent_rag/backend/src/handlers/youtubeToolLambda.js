const https = require('https');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

/**
 * Lambda handler for search_youtube_videos tool
 * Searches YouTube for farming tutorial videos
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Extract parameters from Bedrock Agent event
    const parameters = event.parameters || [];
    let query = '';
    let maxResults = 5;

    for (const param of parameters) {
      if (param.name === 'query') {
        query = param.value;
      } else if (param.name === 'max_results') {
        maxResults = parseInt(param.value) || 5;
      }
    }

    if (!query) {
      return formatAgentResponse(event, {
        error: 'query parameter is required',
        videos: []
      });
    }

    console.log(`Searching YouTube: query="${query}", maxResults=${maxResults}`);

    // Search YouTube
    const videos = await searchYouTube(query, maxResults);

    return formatAgentResponse(event, {
      query,
      count: videos.length,
      videos
    });

  } catch (error) {
    console.error('YouTube search error:', error);
    return formatAgentResponse(event, {
      error: error.message,
      videos: []
    });
  }
};

/**
 * Search YouTube using Data API v3
 */
async function searchYouTube(query, maxResults) {
  if (!YOUTUBE_API_KEY) {
    // Return mock data for demo if no API key
    console.log('No YouTube API key, returning mock data');
    return getMockVideos(query);
  }

  return new Promise((resolve, reject) => {
    // Add farming-related keywords to improve results
    const searchQuery = encodeURIComponent(`${query} farming tutorial hindi`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}&relevanceLanguage=hi&regionCode=IN`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (response.error) {
            console.error('YouTube API error:', response.error);
            resolve(getMockVideos(query));
            return;
          }

          const videos = (response.items || []).map(item => ({
            video_id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            channel: item.snippet.channelTitle,
            published_at: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
          }));

          resolve(videos);
        } catch (error) {
          console.error('Parse error:', error);
          resolve(getMockVideos(query));
        }
      });
    }).on('error', (error) => {
      console.error('Request error:', error);
      resolve(getMockVideos(query));
    });
  });
}

/**
 * Mock videos for demo (when no API key)
 */
function getMockVideos(query) {
  const mockVideos = [
    {
      video_id: 'demo1',
      title: `${query} - खेती की पूरी जानकारी | Complete Farming Guide`,
      description: `${query} के बारे में विस्तृत जानकारी। इस वीडियो में आप सीखेंगे कि कैसे ${query} करें।`,
      thumbnail: 'https://i.ytimg.com/vi/demo/mqdefault.jpg',
      channel: 'Kisan Helpline',
      published_at: new Date().toISOString(),
      url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query + ' farming hindi')
    },
    {
      video_id: 'demo2',
      title: `${query} की आधुनिक तकनीक | Modern Techniques`,
      description: `${query} के लिए नई और आधुनिक तकनीकें। किसानों के लिए उपयोगी जानकारी।`,
      thumbnail: 'https://i.ytimg.com/vi/demo/mqdefault.jpg',
      channel: 'Agriculture India',
      published_at: new Date().toISOString(),
      url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query + ' modern farming')
    },
    {
      video_id: 'demo3',
      title: `${query} - किसान की सफलता की कहानी | Success Story`,
      description: `एक सफल किसान की कहानी जिसने ${query} में सफलता पाई।`,
      thumbnail: 'https://i.ytimg.com/vi/demo/mqdefault.jpg',
      channel: 'Farmer Success Stories',
      published_at: new Date().toISOString(),
      url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query + ' success story')
    }
  ];

  return mockVideos.slice(0, 3);
}

/**
 * Format response for Bedrock Agent
 */
function formatAgentResponse(event, data) {
  return {
    messageVersion: '1.0',
    response: {
      actionGroup: event.actionGroup,
      function: event.function,
      functionResponse: {
        responseBody: {
          TEXT: {
            body: JSON.stringify(data)
          }
        }
      }
    }
  };
}
