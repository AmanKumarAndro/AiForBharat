# 🌾 Knowledge Base Scraper - Complete Package

Automated scraper to collect farming knowledge and videos in Hindi for training your AI system.

---

## 🎯 What You Get

### Content Sources
1. **Farming Articles** - Hindi articles from Krishi Jagran and other portals
2. **YouTube Videos** - Hindi farming tutorial videos with metadata
3. **Government Schemes** - PM-KISAN, PMFBY, KCC information
4. **15 Topics** - Wheat, rice, maize, cotton, pest control, organic farming, etc.

### Output
- **Raw JSON** - Structured data with all metadata
- **Text Files** - Formatted for Bedrock Knowledge Base
- **Video Metadata** - Titles, descriptions, URLs, thumbnails
- **Upload Scripts** - Ready-to-use S3 upload commands

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Install dependencies
pip install -r scraper-requirements.txt

# 2. Set YouTube API key (optional)
export YOUTUBE_API_KEY='your-api-key-here'

# 3. Run everything
./run-scraper.sh
```

**That's it!** The scraper will:
- Scrape 15 farming topics
- Collect articles and videos
- Format for knowledge base
- Generate upload scripts

---

## 📁 Files Included

```
backend/scripts/
├── knowledge-scraper.py          # Basic scraper
├── advanced-scraper.py           # Advanced scraper (recommended)
├── convert-to-kb-format.py       # Convert JSON to text
├── run-scraper.sh                # Run complete pipeline
├── scraper-requirements.txt      # Python dependencies
├── SCRAPER_GUIDE.md              # Detailed guide
└── README_SCRAPER.md             # This file
```

---

## 📊 Topics Covered

### Crops (फसलें)
- गेहूं की खेती (Wheat)
- धान की खेती (Rice)
- मक्का की खेती (Maize)
- कपास की खेती (Cotton)
- सोयाबीन की खेती (Soybean)

### Methods (विधियाँ)
- जैविक खेती (Organic farming)
- मौसम आधारित खेती (Weather-based)

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
- फसल बीमा योजना (PMFBY)
- किसान क्रेडिट कार्ड (KCC)

### Equipment (उपकरण)
- कृषि यंत्र (Machinery)

---

## 🎥 YouTube Integration

### With API Key (Recommended)

```bash
# Get API key from Google Cloud Console
# Enable YouTube Data API v3
export YOUTUBE_API_KEY='AIzaSy...'

# Run scraper
python3 advanced-scraper.py
```

**Benefits:**
- Video titles, descriptions
- View counts, likes, comments
- Thumbnail URLs
- Channel information
- Duration

### Without API Key

```bash
# Run without API key
python3 advanced-scraper.py
```

**Output:**
- YouTube search URLs
- Manual video selection needed

---

## 📤 Output Structure

```
scraped-knowledge/              # Raw JSON data
├── documents/
│   ├── krishijagran_wheat_cultivation.json
│   ├── krishijagran_rice_cultivation.json
│   └── government_schemes.json
├── videos/
│   ├── wheat_cultivation_videos.json
│   ├── rice_cultivation_videos.json
│   └── ...
├── metadata/
│   └── scraping_report.json
└── training_dataset.json

kb-ready-documents/             # Formatted for KB
├── articles/
│   ├── krishijagran_wheat_cultivation.txt
│   └── ...
├── videos/
│   ├── wheat_cultivation_videos.txt
│   └── ...
├── schemes/
│   └── government_schemes.txt
├── index.json
└── upload-to-s3.sh            # Upload script
```

---

## 🔧 Customization

### Add More Topics

Edit `advanced-scraper.py`:

```python
FARMING_TOPICS = [
    {"hi": "आलू की खेती", "en": "potato cultivation", "category": "crops"},
    {"hi": "प्याज की खेती", "en": "onion cultivation", "category": "crops"},
    # Add your topics...
]
```

### Change Video Count

```python
# Get 10 videos per topic instead of 3
self.scrape_youtube_videos_detailed(topic, max_results=10)
```

### Add Custom Sources

```python
def scrape_custom_source(self, topic_dict):
    """Your custom scraper"""
    url = f"https://example.com/search?q={topic_dict['en']}"
    # Implement scraping logic
    pass
```

---

## 📤 Upload to S3

### Automatic Upload

```bash
# After scraping and conversion
cd kb-ready-documents
./upload-to-s3.sh
```

### Manual Upload

```bash
# Set your bucket name
BUCKET="farmer-voice-ai-dev-documents"

# Upload articles
aws s3 sync kb-ready-documents/articles/ \
  s3://${BUCKET}/farming-knowledge/articles/ \
  --region ap-south-1

# Upload videos
aws s3 sync kb-ready-documents/videos/ \
  s3://${BUCKET}/farming-knowledge/videos/ \
  --region ap-south-1

# Upload schemes
aws s3 sync kb-ready-documents/schemes/ \
  s3://${BUCKET}/farming-knowledge/schemes/ \
  --region ap-south-1
```

### Sync Knowledge Base

```bash
# Trigger Bedrock KB ingestion
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id YOUR_KB_ID \
  --data-source-id YOUR_DS_ID \
  --region ap-south-1
```

---

## 📊 Example Output

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
  ✅ Saved 5 articles
🎥 Searching YouTube for: गेहूं की खेती
  ✅ गेहूं की खेती की पूरी जानकारी... (125000 views)
  ✅ गेहूं में खरपतवार नियंत्रण... (85000 views)
  ✅ गेहूं की उन्नत किस्में... (62000 views)
  📹 Saved 3 videos

... (continues for all topics)

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
```

---

## 🐛 Troubleshooting

### Issue: BeautifulSoup not installed

```bash
pip install beautifulsoup4 lxml
```

### Issue: YouTube API quota exceeded

Wait 24 hours or run without API:
```bash
unset YOUTUBE_API_KEY
python3 advanced-scraper.py
```

### Issue: Connection timeout

Increase timeout in scraper:
```python
response = self.session.get(url, timeout=30)
```

### Issue: No content found

Website structure may have changed. Check:
```bash
# Save raw HTML for debugging
python3 advanced-scraper.py --debug
```

---

## 📈 Performance

### Scraping Speed
- Articles: ~2-3 seconds each
- Videos: ~1 second each (with API)
- Total: ~10-15 minutes for all topics

### API Quotas
- YouTube: 10,000 units/day (free tier)
- ~100 video searches per day

### Output Size
- Raw JSON: ~2-3 MB
- Text files: ~1-2 MB
- Total: ~5 MB for all content

---

## 🔐 Best Practices

1. **Respect Rate Limits**
   - Built-in delays between requests
   - Don't modify sleep times

2. **Use API Keys**
   - Get YouTube API key for better results
   - Free tier is sufficient

3. **Review Content**
   - Check scraped content quality
   - Remove irrelevant articles

4. **Regular Updates**
   - Run scraper monthly for fresh content
   - Update topics as needed

---

## ✅ Checklist

Before running:
- [ ] Python 3 installed
- [ ] Dependencies installed (`pip install -r scraper-requirements.txt`)
- [ ] YouTube API key set (optional)
- [ ] Internet connection active

After running:
- [ ] Check `scraped-knowledge/` directory
- [ ] Review `kb-ready-documents/` files
- [ ] Verify video metadata
- [ ] Test upload to S3
- [ ] Sync Bedrock Knowledge Base

---

## 🎯 Next Steps

### 1. Run Scraper

```bash
./run-scraper.sh
```

### 2. Review Output

```bash
ls -lh scraped-knowledge/
ls -lh kb-ready-documents/
```

### 3. Upload to S3

```bash
cd kb-ready-documents
./upload-to-s3.sh
```

### 4. Sync Knowledge Base

```bash
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id YOUR_KB_ID \
  --data-source-id YOUR_DS_ID \
  --region ap-south-1
```

### 5. Test with API

```bash
curl -X POST https://your-api.com/dev/query \
  -H "Content-Type: application/json" \
  -d '{"question": "गेहूं की बुवाई कब करें?", "sessionId": "test"}'
```

---

## 📚 Documentation

- **SCRAPER_GUIDE.md** - Detailed guide with examples
- **advanced-scraper.py** - Main scraper code
- **convert-to-kb-format.py** - Conversion script

---

## 🎉 Summary

You now have:
- ✅ Complete scraper for 15 farming topics
- ✅ YouTube video integration
- ✅ Government schemes data
- ✅ Hindi language content
- ✅ Formatted for Bedrock KB
- ✅ Upload scripts ready
- ✅ ~50+ documents and videos

**Run it now:**
```bash
pip install -r scraper-requirements.txt
export YOUTUBE_API_KEY='your-key'  # Optional
./run-scraper.sh
```

**Happy farming!** 🌾🚀
