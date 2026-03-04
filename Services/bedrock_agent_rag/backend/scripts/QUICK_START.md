# 🚀 Quick Start - Simple Scraper (No API Keys)

Get farming knowledge and videos in 3 commands - no API keys required!

---

## ⚡ 3-Command Setup

```bash
# 1. Install dependencies (only 3 packages)
pip install requests beautifulsoup4 lxml

# 2. Run scraper
python3 simple-scraper.py

# 3. Convert to knowledge base format
python3 convert-to-kb-format.py
```

**Done!** You now have farming knowledge ready for your AI.

---

## 📦 What You Get

### Content
- **10 Farming Topics** in Hindi
- **Articles** from Krishi Jagran
- **YouTube Videos** (titles, URLs, thumbnails)
- **5 Government Schemes** (PM-KISAN, PMFBY, KCC, etc.)

### Output
```
scraped-knowledge/
├── documents/
│   ├── krishi_wheat_farming.json
│   ├── krishi_rice_farming.json
│   ├── government_schemes.json
│   └── ...
├── videos/
│   ├── wheat_farming_videos.json
│   ├── rice_farming_videos.json
│   └── ...
└── metadata/
    └── report.json
```

---

## 🎯 Topics Covered

1. गेहूं की खेती (Wheat farming)
2. धान की खेती (Rice farming)
3. मक्का की खेती (Maize farming)
4. कपास की खेती (Cotton farming)
5. कीट नियंत्रण (Pest control)
6. जैविक खेती (Organic farming)
7. मिट्टी परीक्षण (Soil testing)
8. सिंचाई (Irrigation)
9. बीज उपचार (Seed treatment)
10. खाद प्रबंधन (Fertilizer management)

---

## 🏛️ Government Schemes Included

1. **PM-KISAN** - ₹6000/year direct benefit
2. **PMFBY** - Crop insurance scheme
3. **KCC** - Kisan Credit Card (4% interest)
4. **Soil Health Card** - Free soil testing
5. **PMKSY** - Irrigation subsidy

Each scheme includes:
- Hindi and English names
- Description and benefits
- Eligibility criteria
- How to apply
- Required documents
- Helpline numbers
- Official website URLs

---

## 📊 Example Output

### After Running Scraper

```
🚀 Simple Web Scraper - No API Keys Needed

📋 Topics: 10
📁 Output: scraped-knowledge/

🏛️  Creating government schemes data...
  ✅ Created 5 schemes

============================================================
[1/10] गेहूं की खेती (wheat farming)
============================================================
📰 Scraping Krishi Jagran: गेहूं की खेती
  ✅ Found 5 articles
🎥 Scraping YouTube: गेहूं की खेती
  ✅ Found 5 videos
🌾 Scraping AgriTech: गेहूं की खेती
  ✅ Scraped content

... (continues for all topics)

============================================================
📈 SCRAPING REPORT
============================================================
Topics: 10
Documents: 15
Videos: 10
Output: scraped-knowledge/
============================================================

✅ Scraping completed!
```

---

## 🎥 YouTube Videos

The scraper extracts from YouTube search pages:
- Video IDs
- Titles in Hindi
- Video URLs
- Embed URLs
- Thumbnail images

**No API key needed!** Uses web scraping instead.

Example video data:
```json
{
  "video_id": "abc123xyz",
  "title": "गेहूं की खेती की पूरी जानकारी",
  "url": "https://www.youtube.com/watch?v=abc123xyz",
  "embed_url": "https://www.youtube.com/embed/abc123xyz",
  "thumbnail": "https://i.ytimg.com/vi/abc123xyz/hqdefault.jpg"
}
```

---

## 📤 Upload to S3

After scraping and conversion:

```bash
# Convert to text format
python3 convert-to-kb-format.py

# Upload to S3
cd kb-ready-documents
./upload-to-s3.sh
```

---

## 🔧 Customization

### Add More Topics

Edit `simple-scraper.py`:

```python
TOPICS = [
    {"hi": "आलू की खेती", "en": "potato farming", "keywords": ["potato"]},
    {"hi": "टमाटर की खेती", "en": "tomato farming", "keywords": ["tomato"]},
    # Add your topics...
]
```

### Change Article Count

```python
if article_count >= 10:  # Get 10 articles instead of 5
    break
```

---

## ⏱️ Performance

- **Time:** ~5-10 minutes for all topics
- **Rate Limiting:** 2 seconds between requests
- **Output Size:** ~1-2 MB total
- **No API Quotas:** Unlimited scraping

---

## 🐛 Troubleshooting

### Issue: "Missing dependencies"

```bash
pip install requests beautifulsoup4 lxml
```

### Issue: "No articles found"

Website structure may have changed. The scraper will continue with other sources.

### Issue: "Connection timeout"

Check internet connection or increase timeout:
```python
response = self.session.get(url, timeout=30)
```

---

## ✅ Complete Example

```bash
# Navigate to scripts directory
cd backend/scripts

# Install dependencies
pip install requests beautifulsoup4 lxml

# Run scraper
python3 simple-scraper.py

# Output:
# scraped-knowledge/
#   ├── documents/ (15 files)
#   ├── videos/ (10 files)
#   └── metadata/ (1 file)

# Convert to KB format
python3 convert-to-kb-format.py

# Output:
# kb-ready-documents/
#   ├── articles/ (15 .txt files)
#   ├── videos/ (10 .txt files)
#   ├── schemes/ (1 .txt file)
#   └── upload-to-s3.sh

# Upload to S3
cd kb-ready-documents
./upload-to-s3.sh

# Done! Your knowledge base is ready
```

---

## 📚 What's Different from API Version?

| Feature | Simple Scraper | API Version |
|---------|---------------|-------------|
| API Keys | ❌ Not needed | ✅ Required |
| Setup Time | 1 minute | 5-10 minutes |
| Dependencies | 3 packages | 8+ packages |
| Video Details | Basic | Full metadata |
| Cost | Free | Free (with limits) |
| Reliability | High | Medium (quota limits) |

---

## 🎯 Next Steps

1. **Review scraped content:**
   ```bash
   ls -lh scraped-knowledge/documents/
   ls -lh scraped-knowledge/videos/
   ```

2. **Check government schemes:**
   ```bash
   cat scraped-knowledge/documents/government_schemes.json | jq
   ```

3. **Convert to text format:**
   ```bash
   python3 convert-to-kb-format.py
   ```

4. **Upload to S3:**
   ```bash
   cd kb-ready-documents
   ./upload-to-s3.sh
   ```

5. **Test with your API:**
   ```bash
   curl -X POST https://your-api.com/dev/query \
     -H "Content-Type: application/json" \
     -d '{"question": "PM-KISAN योजना क्या है?", "sessionId": "test"}'
   ```

---

## 🎉 Summary

You now have:
- ✅ Simple scraper (no API keys)
- ✅ 10 farming topics in Hindi
- ✅ Articles from Krishi Jagran
- ✅ YouTube videos with metadata
- ✅ 5 government schemes with details
- ✅ Ready for knowledge base training

**Run it now:**
```bash
pip install requests beautifulsoup4 lxml
python3 simple-scraper.py
```

**Total time:** 5-10 minutes from start to finish! 🚀
