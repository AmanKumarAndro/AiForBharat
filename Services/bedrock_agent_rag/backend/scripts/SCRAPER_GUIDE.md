# 🌾 Knowledge Base Scraper Guide

Complete guide to scraping farming knowledge and videos in Hindi for training your AI system.

---

## 🎯 What It Does

The scraper collects:
1. **Farming Articles** in Hindi from agricultural websites
2. **YouTube Videos** with Hindi farming tutorials
3. **Government Schemes** information (PM-KISAN, PMFBY, etc.)
4. **Structured Data** ready for knowledge base training

---

## 📦 Installation

### Step 1: Install Python Dependencies

```bash
cd backend/scripts

# Install required packages
pip install -r scraper-requirements.txt

# Or install individually
pip install beautifulsoup4 lxml requests google-api-python-client
```

### Step 2: Get YouTube API Key (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Create credentials (API Key)
5. Copy the API key

```bash
# Set API key as environment variable
export YOUTUBE_API_KEY='your-api-key-here'

# Or add to .env file
echo "YOUTUBE_API_KEY=your-api-key-here" >> ../.env
```

---

## 🚀 Usage

### Basic Usage

```bash
# Run the basic scraper
python3 knowledge-scraper.py

# Run the advanced scraper (recommended)
python3 advanced-scraper.py
```

### With YouTube API

```bash
# Set API key and run
export YOUTUBE_API_KEY='your-key'
python3 advanced-scraper.py
```

### Without YouTube API

The scraper will still work but will create search URLs instead of fetching video details:

```bash
python3 advanced-scraper.py
# Will create YouTube search URLs for manual review
```

---

## 📁 Output Structure

```
scraped-knowledge/
├── documents/
│   ├── krishijagran_wheat_cultivation.json
│   ├── krishijagran_rice_cultivation.json
│   ├── government_schemes.json
│   └── ...
├── videos/
│   ├── wheat_cultivation_videos.json
│   ├── rice_cultivation_videos.json
│   └── ...
├── metadata/
│   ├── scraping_report.json
│   └── scraping_summary.json
├── raw_html/
│   └── (cached HTML for debugging)
└── training_dataset.json  # Combined dataset
```

---

## 📊 Data Format

### Document Format

```json
{
  "source": "Krishi Jagran",
  "topic_hi": "गेहूं की खेती",
  "topic_en": "wheat cultivation",
  "category": "crops",
  "scraped_at": "2026-03-03T10:30:00",
  "articles": [
    {
      "title": "गेहूं की उन्नत खेती कैसे करें",
      "content": "गेहूं की खेती के लिए...",
      "url": "https://hindi.krishijagran.com/article/...",
      "scraped_at": "2026-03-03T10:30:00"
    }
  ],
  "language": "hi"
}
```

### Video Format

```json
{
  "video_id": "abc123xyz",
  "title": "गेहूं की खेती की पूरी जानकारी",
  "description": "इस वीडियो में गेहूं की खेती के बारे में...",
  "channel": "Krishi Gyan",
  "published_at": "2025-11-15T08:00:00Z",
  "thumbnail_high": "https://i.ytimg.com/vi/abc123xyz/hqdefault.jpg",
  "url": "https://www.youtube.com/watch?v=abc123xyz",
  "embed_url": "https://www.youtube.com/embed/abc123xyz",
  "duration": "PT15M30S",
  "view_count": "125000",
  "like_count": "3500",
  "topic_hi": "गेहूं की खेती",
  "topic_en": "wheat cultivation",
  "category": "crops",
  "language": "hi"
}
```

---

## 🎯 Topics Covered

### Crops (फसलें)
- गेहूं की खेती (Wheat)
- धान की खेती (Rice)
- मक्का की खेती (Maize)
- कपास की खेती (Cotton)
- सोयाबीन की खेती (Soybean)

### Methods (विधियाँ)
- जैविक खेती (Organic farming)
- मौसम आधारित खेती (Weather-based farming)

### Protection (सुरक्षा)
- कीट नियंत्रण (Pest control)
- फसल रोग (Crop diseases)

### Resources (संसाधन)
- मिट्टी परीक्षण (Soil testing)
- सिंचाई प्रबंधन (Irrigation)
- बीज उपचार (Seed treatment)
- खाद प्रबंधन (Fertilizer)

### Schemes (योजनाएं)
- PM-KISAN योजना
- फसल बीमा योजना
- किसान क्रेडिट कार्ड

### Equipment (उपकरण)
- कृषि यंत्र (Agricultural machinery)

---

## 🔧 Customization

### Add More Topics

Edit `advanced-scraper.py`:

```python
FARMING_TOPICS = [
    {"hi": "आलू की खेती", "en": "potato cultivation", "category": "crops"},
    {"hi": "टमाटर की खेती", "en": "tomato cultivation", "category": "vegetables"},
    # Add more topics...
]
```

### Change Video Count

```python
# In advanced-scraper.py
self.scrape_youtube_videos_detailed(topic, max_results=10)  # Get 10 videos
```

### Add More Sources

```python
def scrape_new_source(self, topic_dict):
    """Add your custom scraper"""
    url = f"https://example.com/search?q={topic_dict['en']}"
    # Implement scraping logic
    pass
```

---

## 📤 Upload to S3 for Knowledge Base

### Step 1: Prepare Documents

```bash
# After scraping, documents are in scraped-knowledge/documents/
cd scraped-knowledge/documents

# Convert JSON to text files for better indexing
python3 ../../convert-to-text.py
```

### Step 2: Upload to S3

```bash
# Set your S3 bucket name
BUCKET_NAME="farmer-voice-ai-dev-documents"

# Upload all documents
aws s3 sync ./documents/ s3://${BUCKET_NAME}/farming-knowledge/ \
  --region ap-south-1 \
  --exclude "*.html" \
  --exclude "*.json"

# Upload videos metadata
aws s3 sync ./videos/ s3://${BUCKET_NAME}/video-metadata/ \
  --region ap-south-1
```

### Step 3: Sync Knowledge Base

```bash
# Trigger knowledge base sync
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id YOUR_KB_ID \
  --data-source-id YOUR_DS_ID \
  --region ap-south-1
```

---

## 🎥 YouTube Video Integration

### Option 1: With API (Recommended)

```python
# Get detailed video metadata
videos = scraper.scrape_youtube_videos_detailed(topic, max_results=5)

# Each video includes:
# - Title, description, channel
# - View count, likes, comments
# - Thumbnail URLs
# - Embed URL for player
# - Duration
```

### Option 2: Without API

```python
# Creates search URLs for manual review
video_data = scraper.scrape_youtube_without_api(topic)

# Visit the search_url to find videos manually
# Then add video IDs to your database
```

### Option 3: Get Video Transcripts

```bash
# Install transcript library
pip install youtube-transcript-api

# Get Hindi transcripts
python3 get-video-transcripts.py
```

---

## 🔍 Data Sources

### 1. Krishi Jagran (कृषि जागरण)
- **URL:** https://hindi.krishijagran.com
- **Language:** Hindi
- **Content:** Articles, news, farming tips
- **Coverage:** All major crops and farming topics

### 2. YouTube
- **Search:** Hindi farming videos
- **Channels:** Krishi Gyan, Agriculture Today, etc.
- **Content:** Video tutorials, demonstrations
- **Language:** Hindi audio

### 3. Government Portals
- **PM-KISAN:** https://pmkisan.gov.in
- **PMFBY:** https://pmfby.gov.in
- **AgriTech:** Various state portals
- **Content:** Schemes, guidelines, forms

### 4. ICAR (Indian Council of Agricultural Research)
- **URL:** https://icar.org.in
- **Content:** Research papers, guidelines
- **Language:** English + Hindi translations

---

## 📈 Performance

### Scraping Speed

- **Articles:** ~2-3 seconds per article
- **Videos:** ~1 second per video (with API)
- **Total time:** ~10-15 minutes for all topics

### Rate Limiting

```python
# Built-in delays to respect servers
time.sleep(2)  # Between requests
time.sleep(5)  # Between topics
```

### API Quotas

**YouTube Data API v3:**
- Free tier: 10,000 units/day
- Search: 100 units per request
- Video details: 1 unit per request
- ~100 searches per day on free tier

---

## 🐛 Troubleshooting

### Issue: "BeautifulSoup not installed"

```bash
pip install beautifulsoup4 lxml
```

### Issue: "YouTube API quota exceeded"

```bash
# Wait 24 hours or use search URLs
python3 advanced-scraper.py  # Will create search URLs
```

### Issue: "Connection timeout"

```python
# Increase timeout in scraper
response = self.session.get(url, timeout=30)  # 30 seconds
```

### Issue: "No content found"

```bash
# Check if website structure changed
# Update CSS selectors in scraper
# Or use raw HTML mode for debugging
```

---

## 🔐 Best Practices

### 1. Respect Robots.txt

```python
# Check robots.txt before scraping
# Add delays between requests
time.sleep(2)
```

### 2. Use User-Agent

```python
headers = {
    'User-Agent': 'FarmerAI-Bot/1.0 (Educational Purpose)'
}
```

### 3. Cache Results

```python
# Save raw HTML for debugging
with open(f"raw_html/{filename}.html", 'w') as f:
    f.write(response.text)
```

### 4. Handle Errors Gracefully

```python
try:
    content = scrape_article(url)
except Exception as e:
    print(f"Error: {e}")
    continue  # Skip and move to next
```

---

## 📊 Example Output

### After Running Scraper

```
🚀 Starting Advanced Knowledge Scraper

📋 Topics: 15
📁 Output: scraped-knowledge/

🏛️  Scraping Government Schemes...
  ✅ Saved 3 schemes

============================================================
[1/15] गेहूं की खेती (wheat cultivation)
============================================================
📰 Scraping Krishi Jagran for: गेहूं की खेती
  ✅ Saved 5 articles to: scraped-knowledge/documents/krishijagran_wheat_cultivation.json
🎥 Searching YouTube for: गेहूं की खेती
  ✅ गेहूं की खेती की पूरी जानकारी | Complete Wheat Farming... (125000 views)
  ✅ गेहूं में खरपतवार नियंत्रण | Weed Control in Wheat... (85000 views)
  ✅ गेहूं की उन्नत किस्में | Improved Wheat Varieties... (62000 views)
  📹 Saved 3 videos

... (continues for all topics)

📚 Creating training dataset...
  ✅ Training dataset created: scraped-knowledge/training_dataset.json
  📊 Total entries: 45

📊 Generating report...

============================================================
📈 SCRAPING REPORT
============================================================
Topics scraped: 15
Documents: 18
Videos: 45
Total size: 2.5 MB
Output: scraped-knowledge/
============================================================

✅ Scraping completed successfully!
📂 Check output: scraped-knowledge/
```

---

## 🎯 Next Steps

### 1. Review Scraped Content

```bash
cd scraped-knowledge
ls -lh documents/
ls -lh videos/
```

### 2. Convert to Knowledge Base Format

```bash
python3 convert-to-kb-format.py
```

### 3. Upload to S3

```bash
aws s3 sync documents/ s3://your-bucket/knowledge/
```

### 4. Sync Bedrock Knowledge Base

```bash
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id YOUR_KB_ID \
  --data-source-id YOUR_DS_ID
```

### 5. Test with Your API

```bash
curl -X POST https://your-api.com/dev/query \
  -H "Content-Type: application/json" \
  -d '{"question": "गेहूं की बुवाई कब करें?", "sessionId": "test"}'
```

---

## ✅ Summary

You now have:
- ✅ Complete scraper for farming knowledge
- ✅ YouTube video integration
- ✅ Government schemes data
- ✅ 15 farming topics covered
- ✅ Hindi language content
- ✅ Structured JSON output
- ✅ Ready for knowledge base training

**Run it now:**
```bash
pip install -r scraper-requirements.txt
export YOUTUBE_API_KEY='your-key'  # Optional
python3 advanced-scraper.py
```

**Output:** `scraped-knowledge/` directory with all content ready for training! 🚀
