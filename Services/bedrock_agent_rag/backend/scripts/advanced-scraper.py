#!/usr/bin/env python3
"""
Advanced Knowledge Scraper with BeautifulSoup
Scrapes actual content from farming websites and YouTube
"""

import os
import json
import time
import requests
from datetime import datetime
from urllib.parse import urljoin, quote
import re

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False
    print("⚠️  BeautifulSoup not installed. Install with: pip install beautifulsoup4")

# Configuration
OUTPUT_DIR = "scraped-knowledge"
YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY', '')

# Farming topics with English translations for better search
FARMING_TOPICS = [
    {"hi": "गेहूं की खेती", "en": "wheat cultivation", "category": "crops"},
    {"hi": "धान की खेती", "en": "rice cultivation", "category": "crops"},
    {"hi": "मक्का की खेती", "en": "maize cultivation", "category": "crops"},
    {"hi": "कपास की खेती", "en": "cotton cultivation", "category": "crops"},
    {"hi": "सोयाबीन की खेती", "en": "soybean cultivation", "category": "crops"},
    {"hi": "जैविक खेती", "en": "organic farming", "category": "methods"},
    {"hi": "कीट नियंत्रण", "en": "pest control", "category": "protection"},
    {"hi": "मिट्टी परीक्षण", "en": "soil testing", "category": "soil"},
    {"hi": "सिंचाई प्रबंधन", "en": "irrigation management", "category": "water"},
    {"hi": "बीज उपचार", "en": "seed treatment", "category": "seeds"},
    {"hi": "खाद प्रबंधन", "en": "fertilizer management", "category": "nutrients"},
    {"hi": "फसल रोग", "en": "crop diseases", "category": "protection"},
    {"hi": "PM-KISAN योजना", "en": "PM-KISAN scheme", "category": "schemes"},
    {"hi": "कृषि यंत्र", "en": "agricultural machinery", "category": "equipment"},
    {"hi": "मौसम आधारित खेती", "en": "weather based farming", "category": "methods"},
]

class AdvancedScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Create output directories
        for dir_name in ['documents', 'videos', 'metadata', 'raw_html']:
            os.makedirs(f"{OUTPUT_DIR}/{dir_name}", exist_ok=True)
    
    def clean_text(self, text):
        """Clean and normalize text"""
        if not text:
            return ""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep Hindi
        text = text.strip()
        return text
    
    def scrape_krishi_jagran_article(self, topic_dict):
        """Scrape actual articles from Krishi Jagran Hindi"""
        print(f"📰 Scraping Krishi Jagran for: {topic_dict['hi']}")
        
        if not HAS_BS4:
            print("  ⚠️  BeautifulSoup required. Skipping.")
            return None
        
        try:
            # Search page
            search_url = f"https://hindi.krishijagran.com/search?q={quote(topic_dict['en'])}"
            response = self.session.get(search_url, timeout=15)
            
            if response.status_code != 200:
                print(f"  ⚠️  HTTP {response.status_code}")
                return None
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract article links (adjust selectors based on actual website)
            articles = []
            article_links = soup.find_all('a', href=True, limit=5)
            
            for link in article_links:
                href = link.get('href', '')
                if '/article/' in href or '/news/' in href:
                    full_url = urljoin('https://hindi.krishijagran.com', href)
                    
                    # Scrape individual article
                    article_data = self.scrape_article_content(full_url)
                    if article_data:
                        articles.append(article_data)
                        time.sleep(2)  # Rate limiting
            
            # Save compiled content
            if articles:
                content = {
                    "source": "Krishi Jagran",
                    "topic_hi": topic_dict['hi'],
                    "topic_en": topic_dict['en'],
                    "category": topic_dict['category'],
                    "scraped_at": datetime.now().isoformat(),
                    "articles": articles,
                    "language": "hi"
                }
                
                filename = f"{OUTPUT_DIR}/documents/krishijagran_{topic_dict['en'].replace(' ', '_')}.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(content, f, ensure_ascii=False, indent=2)
                
                print(f"  ✅ Saved {len(articles)} articles to: {filename}")
                return content
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return None
    
    def scrape_article_content(self, url):
        """Scrape content from a single article"""
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                return None
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title = soup.find('h1')
            title_text = self.clean_text(title.get_text()) if title else ""
            
            # Extract main content (adjust selectors based on website)
            content_div = soup.find('div', class_=['article-content', 'content', 'post-content'])
            if content_div:
                paragraphs = content_div.find_all('p')
                content_text = '\n\n'.join([self.clean_text(p.get_text()) for p in paragraphs])
            else:
                content_text = ""
            
            return {
                "title": title_text,
                "content": content_text[:3000],  # First 3000 chars
                "url": url,
                "scraped_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"    ⚠️  Error scraping article: {e}")
            return None
    
    def scrape_youtube_videos_detailed(self, topic_dict, max_results=5):
        """Scrape YouTube videos with detailed metadata"""
        print(f"🎥 Searching YouTube for: {topic_dict['hi']}")
        
        if not YOUTUBE_API_KEY:
            print("  ⚠️  YouTube API key not set")
            print("  💡 Set it with: export YOUTUBE_API_KEY='your-key'")
            return self.scrape_youtube_without_api(topic_dict)
        
        try:
            # Search for videos
            search_url = "https://www.googleapis.com/youtube/v3/search"
            search_params = {
                'part': 'snippet',
                'q': f"{topic_dict['hi']} खेती हिंदी",
                'type': 'video',
                'maxResults': max_results,
                'relevanceLanguage': 'hi',
                'key': YOUTUBE_API_KEY,
                'order': 'relevance',
                'videoDuration': 'medium'  # 4-20 minutes
            }
            
            response = self.session.get(search_url, params=search_params, timeout=10)
            
            if response.status_code != 200:
                print(f"  ❌ YouTube API error: {response.status_code}")
                return []
            
            data = response.json()
            video_ids = [item['id']['videoId'] for item in data.get('items', [])]
            
            if not video_ids:
                print("  ⚠️  No videos found")
                return []
            
            # Get detailed video statistics
            videos_url = "https://www.googleapis.com/youtube/v3/videos"
            videos_params = {
                'part': 'snippet,contentDetails,statistics',
                'id': ','.join(video_ids),
                'key': YOUTUBE_API_KEY
            }
            
            videos_response = self.session.get(videos_url, params=videos_params, timeout=10)
            videos_data = videos_response.json()
            
            videos = []
            for item in videos_data.get('items', []):
                video = {
                    "video_id": item['id'],
                    "title": item['snippet']['title'],
                    "description": item['snippet']['description'][:500],
                    "channel": item['snippet']['channelTitle'],
                    "published_at": item['snippet']['publishedAt'],
                    "thumbnail_default": item['snippet']['thumbnails']['default']['url'],
                    "thumbnail_high": item['snippet']['thumbnails']['high']['url'],
                    "url": f"https://www.youtube.com/watch?v={item['id']}",
                    "embed_url": f"https://www.youtube.com/embed/{item['id']}",
                    "duration": item['contentDetails']['duration'],
                    "view_count": item['statistics'].get('viewCount', 0),
                    "like_count": item['statistics'].get('likeCount', 0),
                    "comment_count": item['statistics'].get('commentCount', 0),
                    "topic_hi": topic_dict['hi'],
                    "topic_en": topic_dict['en'],
                    "category": topic_dict['category'],
                    "language": "hi"
                }
                videos.append(video)
                print(f"  ✅ {video['title'][:60]}... ({video['view_count']} views)")
            
            # Save videos
            filename = f"{OUTPUT_DIR}/videos/{topic_dict['en'].replace(' ', '_')}_videos.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(videos, f, ensure_ascii=False, indent=2)
            
            print(f"  📹 Saved {len(videos)} videos")
            return videos
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return []
    
    def scrape_youtube_without_api(self, topic_dict):
        """Fallback: Create YouTube search URLs without API"""
        print("  💡 Creating YouTube search URLs (no API)")
        
        search_query = f"{topic_dict['hi']} खेती हिंदी"
        search_url = f"https://www.youtube.com/results?search_query={quote(search_query)}"
        
        video_data = {
            "topic_hi": topic_dict['hi'],
            "topic_en": topic_dict['en'],
            "category": topic_dict['category'],
            "search_url": search_url,
            "search_query": search_query,
            "note": "Manual search required - YouTube API key not configured",
            "instructions": "Visit the search_url to find relevant videos"
        }
        
        filename = f"{OUTPUT_DIR}/videos/{topic_dict['en'].replace(' ', '_')}_search.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(video_data, f, ensure_ascii=False, indent=2)
        
        print(f"  📝 Saved search URL")
        return [video_data]
    
    def scrape_government_schemes(self):
        """Scrape government agricultural schemes information"""
        print("\n🏛️  Scraping Government Schemes...")
        
        schemes = [
            {
                "name_hi": "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
                "name_en": "PM-KISAN",
                "description": "₹6000 प्रति वर्ष सीधे किसानों के खाते में",
                "url": "https://pmkisan.gov.in/",
                "eligibility": "सभी भूमिधारक किसान परिवार",
                "benefits": "₹2000 की तीन किस्तें प्रति वर्ष",
                "category": "financial_assistance"
            },
            {
                "name_hi": "प्रधानमंत्री फसल बीमा योजना (PMFBY)",
                "name_en": "Pradhan Mantri Fasal Bima Yojana",
                "description": "फसल बीमा योजना",
                "url": "https://pmfby.gov.in/",
                "eligibility": "सभी किसान",
                "benefits": "प्राकृतिक आपदाओं से फसल नुकसान की भरपाई",
                "category": "insurance"
            },
            {
                "name_hi": "किसान क्रेडिट कार्ड (KCC)",
                "name_en": "Kisan Credit Card",
                "description": "कम ब्याज दर पर कृषि ऋण",
                "url": "https://www.india.gov.in/spotlight/kisan-credit-card-kcc",
                "eligibility": "सभी किसान",
                "benefits": "4% ब्याज दर पर ऋण",
                "category": "credit"
            }
        ]
        
        filename = f"{OUTPUT_DIR}/documents/government_schemes.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(schemes, f, ensure_ascii=False, indent=2)
        
        print(f"  ✅ Saved {len(schemes)} schemes")
        return schemes
    
    def create_training_dataset(self):
        """Create a formatted training dataset for knowledge base"""
        print("\n📚 Creating training dataset...")
        
        training_data = []
        
        # Collect all documents
        docs_dir = f"{OUTPUT_DIR}/documents"
        if os.path.exists(docs_dir):
            for filename in os.listdir(docs_dir):
                if filename.endswith('.json'):
                    with open(f"{docs_dir}/{filename}", 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        training_data.append(data)
        
        # Collect all videos
        videos_dir = f"{OUTPUT_DIR}/videos"
        if os.path.exists(videos_dir):
            for filename in os.listdir(videos_dir):
                if filename.endswith('.json'):
                    with open(f"{videos_dir}/{filename}", 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        training_data.append(data)
        
        # Save combined dataset
        dataset_file = f"{OUTPUT_DIR}/training_dataset.json"
        with open(dataset_file, 'w', encoding='utf-8') as f:
            json.dump(training_data, f, ensure_ascii=False, indent=2)
        
        print(f"  ✅ Training dataset created: {dataset_file}")
        print(f"  📊 Total entries: {len(training_data)}")
        
        return training_data
    
    def generate_report(self):
        """Generate comprehensive scraping report"""
        print("\n📊 Generating report...")
        
        report = {
            "generated_at": datetime.now().isoformat(),
            "topics": {
                "total": len(FARMING_TOPICS),
                "categories": {}
            },
            "statistics": {
                "documents": 0,
                "videos": 0,
                "total_size_mb": 0
            },
            "sources": [
                "Krishi Jagran (Hindi)",
                "YouTube (Hindi videos)",
                "Government Schemes"
            ],
            "output_directory": OUTPUT_DIR
        }
        
        # Count files
        for dir_name in ['documents', 'videos']:
            dir_path = f"{OUTPUT_DIR}/{dir_name}"
            if os.path.exists(dir_path):
                count = len([f for f in os.listdir(dir_path) if f.endswith('.json')])
                report['statistics'][dir_name] = count
        
        # Calculate total size
        total_size = 0
        for root, dirs, files in os.walk(OUTPUT_DIR):
            for file in files:
                total_size += os.path.getsize(os.path.join(root, file))
        report['statistics']['total_size_mb'] = round(total_size / (1024 * 1024), 2)
        
        # Save report
        report_file = f"{OUTPUT_DIR}/metadata/scraping_report.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"\n{'='*60}")
        print("📈 SCRAPING REPORT")
        print(f"{'='*60}")
        print(f"Topics scraped: {report['topics']['total']}")
        print(f"Documents: {report['statistics']['documents']}")
        print(f"Videos: {report['statistics']['videos']}")
        print(f"Total size: {report['statistics']['total_size_mb']} MB")
        print(f"Output: {OUTPUT_DIR}/")
        print(f"{'='*60}\n")
        
        return report
    
    def run(self):
        """Run the complete scraping process"""
        print("🚀 Starting Advanced Knowledge Scraper\n")
        print(f"📋 Topics: {len(FARMING_TOPICS)}")
        print(f"📁 Output: {OUTPUT_DIR}/\n")
        
        if not HAS_BS4:
            print("⚠️  Install BeautifulSoup for better scraping:")
            print("   pip install beautifulsoup4 lxml\n")
        
        # Scrape government schemes first
        self.scrape_government_schemes()
        
        # Scrape each topic
        for i, topic in enumerate(FARMING_TOPICS, 1):
            print(f"\n{'='*60}")
            print(f"[{i}/{len(FARMING_TOPICS)}] {topic['hi']} ({topic['en']})")
            print(f"{'='*60}")
            
            # Scrape articles
            if HAS_BS4:
                self.scrape_krishi_jagran_article(topic)
                time.sleep(2)
            
            # Scrape videos
            self.scrape_youtube_videos_detailed(topic, max_results=3)
            time.sleep(2)
        
        # Create training dataset
        self.create_training_dataset()
        
        # Generate report
        self.generate_report()
        
        print("✅ Scraping completed successfully!")
        print(f"📂 Check output: {OUTPUT_DIR}/")

def main():
    scraper = AdvancedScraper()
    scraper.run()

if __name__ == "__main__":
    main()
