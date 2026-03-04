# 🌾 Knowledge Base Scraper

Collect farming knowledge and videos in Hindi - **No API keys required!**

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Install (only 3 packages)
pip install requests beautifulsoup4 lxml

# 2. Scrape
python3 simple-scraper.py

# 3. Convert
python3 convert-to-kb-format.py
```

**Done!** You have farming knowledge ready for your AI.

---

## 📦 What's Included

### Scripts

1. **simple-scraper.py** ⭐ **RECOMMENDED**
   - No API keys needed
   - Scrapes Krishi Jagran, YouTube, AgriTech portals
   - 10 farming topics + 5 government schemes
   - Fast and reliable

2. **advanced-scraper.py**
   - Requires YouTube API key
   - More detailed video metadata
   - 15 farming topics

3. **convert-to-kb-format.py**
   - Converts JSON to text files
   - Formats for Bedrock Knowledge Base
   - Generates S3 upload script

4. **run-scraper.sh**
   - Complete pipeline
   - Runs scraper + converter
   - One command for everything

### Documentation

- **QUICK_START.md** - Get started in 5 minutes
- **SCRAPER_GUIDE.md** - Detailed guide with examples
- **README_SCRAPER.md** - Complete reference

---

## 🎯 Content Collected

### Topics (10)
1. गेहूं की खेती (Wheat)
2. धान की खेती (Rice)
3. मक्का की खेती (Maize)
4. कपास की खेती (Cotton)
5. कीट नियंत्रण (Pest control)
6. जैविक खेती (Organic farming)
7. मिट्टी परीक्षण (Soil testing)
8. सिंचाई (Irrigation)
9. बीज उपचार (Seed treatment)
10. खाद प्रबंधन (Fertilizer)

### Government Schemes (5)
1. PM-KISAN (₹6000/year)
2. PMFBY (Crop insurance)
3. KCC (Credit card)
4. Soil Health Card
5. PMKSY (Irrigation)

### Sources
- Krishi Jagran (Hindi articles)
- YouTube (Hindi videos)
- AgriTech portals
- Government websites

---

## 📁 Output Structure

```
scraped-knowledge/              # Raw JSON data
├── documents/
│   ├── krishi_wheat_farming.json
│   ├── government_schemes.json
│   └── ...
├── videos/
│   ├── wheat_farming_videos.json
│   └── ...
└── metadata/
    └── report.json

kb-ready-documents/             # Formatted for KB
├── articles/
│   ├── krishi_wheat_farming.txt
│   └── ...
├── videos/
│   ├── wheat_farming_videos.txt
│   └── ...
├── schemes/
│   └── government_schemes.txt
├── index.json
└── upload-to-s3.sh            # Upload script
```

---

## 🎥 YouTube Videos

Extracts without API:
- Video IDs
- Titles (Hindi)
- URLs and embed URLs
- Thumbnail images
- Search queries

Example:
```json
{
  "video_id": "abc123",
  "title": "गेहूं की खेती की पूरी जानकारी",
  "url": "https://www.youtube.com/watch?v=abc123",
  "thumbnail": "https://i.ytimg.com/vi/abc123/hqdefault.jpg"
}
```

---

## 🏛️ Government Schemes

Each scheme includes:
- Hindi and English names
- Description and benefits
- Eligibility criteria
- Application process
- Required documents
- Helpline numbers
- Official URLs

Example:
```json
{
  "name_hi": "प्रधानमंत्री किसान सम्मान निधि",
  "name_en": "PM-KISAN",
  "description": "₹6000 प्रति वर्ष सीधे किसानों के खाते में",
  "benefits": "₹2000 की तीन किस्तें",
  "helpline": "155261",
  "url": "https://pmkisan.gov.in/"
}
```

---

## 📤 Upload to S3

```bash
# After scraping and conversion
cd kb-ready-documents

# Edit bucket name in upload-to-s3.sh
# Then run:
./upload-to-s3.sh

# Sync Bedrock Knowledge Base
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id YOUR_KB_ID \
  --data-source-id YOUR_DS_ID \
  --region ap-south-1
```

---

## 🔧 Requirements

### Minimal (Simple Scraper)
```bash
pip install requests beautifulsoup4 lxml
```

### Full (Advanced Scraper)
```bash
pip install -r scraper-requirements.txt
```

---

## ⏱️ Performance

| Metric | Value |
|--------|-------|
| Time | 5-10 minutes |
| Topics | 10 |
| Documents | ~15 |
| Videos | ~10 |
| Schemes | 5 |
| Output Size | 1-2 MB |
| API Keys | None needed |

---

## 🎯 Use Cases

### 1. Train Knowledge Base
```bash
python3 simple-scraper.py
python3 convert-to-kb-format.py
cd kb-ready-documents && ./upload-to-s3.sh
```

### 2. Get Video Tutorials
```bash
python3 simple-scraper.py
cat scraped-knowledge/videos/*.json | jq '.videos[].url'
```

### 3. Government Schemes Info
```bash
python3 simple-scraper.py
cat scraped-knowledge/documents/government_schemes.json | jq
```

---

## 🐛 Troubleshooting

### Missing dependencies
```bash
pip install requests beautifulsoup4 lxml
```

### No content found
Website structure may have changed. Scraper continues with other sources.

### Connection timeout
```bash
# Increase timeout in scraper
response = self.session.get(url, timeout=30)
```

---

## 📚 Documentation

- **QUICK_START.md** - 5-minute setup guide
- **SCRAPER_GUIDE.md** - Detailed documentation
- **README_SCRAPER.md** - Complete reference

---

## ✅ Comparison

| Feature | Simple | Advanced |
|---------|--------|----------|
| API Keys | ❌ None | ✅ YouTube |
| Setup | 1 min | 5 min |
| Packages | 3 | 8+ |
| Topics | 10 | 15 |
| Video Data | Basic | Detailed |
| Reliability | High | Medium |

**Recommendation:** Use `simple-scraper.py` for most cases.

---

## 🎉 Summary

You get:
- ✅ 10 farming topics in Hindi
- ✅ Articles from Krishi Jagran
- ✅ YouTube videos with metadata
- ✅ 5 government schemes
- ✅ No API keys required
- ✅ Ready for knowledge base

**Start now:**
```bash
pip install requests beautifulsoup4 lxml
python3 simple-scraper.py
```

**Questions?** Check QUICK_START.md or SCRAPER_GUIDE.md

**Happy farming!** 🌾🚀
