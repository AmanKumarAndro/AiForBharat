#!/usr/bin/env python3
"""
Knowledge Base Scraper for Farmer Voice AI
Scrapes farming content in Hindi from multiple sources:
1. ICAR official website
2. Government agriculture portals
3. YouTube videos (Hindi farming tutorials)
4. Krishi Vigyan Kendra (KVK) resources
"""

import os
import json
import time
import requests
from datetime import datetime
from urllib.parse import urljoin, quote
import re

# Configuration
OUTPUT_DIR = "scraped-knowledge"
YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY', '')

# Farming topics to scrape
FARMING_TOPICS = [
    "गेहूं की खेती",  # Wheat cultivation
    "धान की खेती",   # Rice cultivation
    "मक्का की खेती",  # Maize cultivation
    "कपास की खेती",  # Cotton cultivation
    "सोयाबीन की खेती", # Soybean cultivation
    "जैविक खेती",    # Organic farming
    "कीट नियंत्रण",   # Pest control
    "मिट्टी परीक्षण",  # Soil testing
    "सिंचाई प्रबंधन",  # Irrigation management
    "बीज उपचार",      # Seed treatment
    "खाद प्रबंधन",    # Fertilizer management
    "फसल रोग",       # Crop diseases
    "PM-KISAN योजना", # PM-KISAN scheme
    "मंडी भाव",       # Market prices
    "कृषि यंत्र",     # Agricultural machinery
]

class KnowledgeScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Create output directory
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        os.makedirs(f"{OUTPUT_DIR}/documents", exist_ok=True)
        os.makedirs(f"{OUTPUT_DIR}/videos", exist_ok=True)
        os.makedirs(f"{OUTPUT_DIR}/metadata", exist_ok=True)
    
    def scrape_icar_content(self, topic):
        """Scrape ICAR (Indian Council of Agricultural Research) content"""
        print(f"📚 Scraping ICAR content for: {topic}")
        
        # ICAR search URL (simulated - adjust based on actual ICAR website structure)
        search_url = f"https://icar.org.in/search?q={quote(topic)}"
        
        try:
            # Note: This is a template. Actual implementation depends on ICAR website structure
            content = {
                "source": "ICAR",
                "topic": topic,
                "url": search_url,
                "scraped_at": datetime.now().isoformat(),
                "content": f"ICAR content for {topic} (placeholder - implement actual scraping)",
                "language": "hi"
            }
            
            # Save to file
            filename = f"{OUTPUT_DIR}/documents/icar_{topic.replace(' ', '_')}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(content, f, ensure_ascii=False, indent=2)
            
            print(f"  ✅ Saved: {filename}")
            return content
            
        except Exception as e:
            print(f"  ❌ Error scraping ICAR: {e}")
            return None
    
    def scrape_krishi_jagran(self, topic):
        """Scrape Krishi Jagran (popular Hindi farming portal)"""
        print(f"📰 Scraping Krishi Jagran for: {topic}")
        
        # Krishi Jagran Hindi section
        search_url = f"https://hindi.krishijagran.com/search?q={quote(topic)}"
        
        try:
            response = self.session.get(search_url, timeout=10)
            
            if response.status_code == 200:
                content = {
                    "source": "Krishi Jagran",
                    "topic": topic,
                    "url": search_url,
                    "scraped_at": datetime.now().isoformat(),
                    "content": response.text[:5000],  # First 5000 chars
                    "language": "hi"
                }
                
                filename = f"{OUTPUT_DIR}/documents/krishijagran_{topic.replace(' ', '_')}.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(content, f, ensure_ascii=False, indent=2)
                
                print(f"  ✅ Saved: {filename}")
                return content
            else:
                print(f"  ⚠️  HTTP {response.status_code}")
                return None
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return None
    
    def scrape_youtube_videos(self, topic, max_results=5):
        """Scrape YouTube videos in Hindi about farming topics"""
        print(f"🎥 Searching YouTube videos for: {topic}")
        
        if not YOUTUBE_API_KEY:
            print("  ⚠️  YouTube API key not set. Skipping video search.")
            return []
        
        try:
            # YouTube Data API v3 search endpoint
            search_url = "https://www.googleapis.com/youtube/v3/search"
            params = {
                'part': 'snippet',
                'q': f"{topic} खेती हिंदी",  # Add "farming Hindi" to query
                'type': 'video',
                'maxResults': max_results,
                'relevanceLanguage': 'hi',
                'key': YOUTUBE_API_KEY,
                'order': 'relevance'
            }
            
            response = self.session.get(search_url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                videos = []
                
                for item in data.get('items', []):
                    video = {
                        "video_id": item['id']['videoId'],
                        "title": item['snippet']['title'],
                        "description": item['snippet']['description'],
                        "channel": item['snippet']['channelTitle'],
                        "published_at": item['snippet']['publishedAt'],
                        "thumbnail": item['snippet']['thumbnails']['high']['url'],
                        "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                        "topic": topic,
                        "language": "hi"
                    }
                    videos.append(video)
                    print(f"  ✅ Found: {video['title'][:50]}...")
                
                # Save videos metadata
                filename = f"{OUTPUT_DIR}/videos/{topic.replace(' ', '_')}_videos.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(videos, f, ensure_ascii=False, indent=2)
                
                print(f"  📹 Saved {len(videos)} videos to: {filename}")
                return videos
            else:
                print(f"  ❌ YouTube API error: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"  ❌ Error searching YouTube: {e}")
            return []
    
    def scrape_agritech_portal(self, topic):
        """Scrape government agriculture technology portal"""
        print(f"🌾 Scraping AgriTech Portal for: {topic}")
        
        # Example: Agriculture Technology Management Agency
        search_url = f"https://agritech.tnau.ac.in/search?q={quote(topic)}"
        
        try:
            content = {
                "source": "AgriTech Portal",
                "topic": topic,
                "url": search_url,
                "scraped_at": datetime.now().isoformat(),
                "content": f"AgriTech content for {topic} (implement actual scraping)",
                "language": "hi"
            }
            
            filename = f"{OUTPUT_DIR}/documents/agritech_{topic.replace(' ', '_')}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(content, f, ensure_ascii=False, indent=2)
            
            print(f"  ✅ Saved: {filename}")
            return content
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return None
    
    def generate_summary_report(self):
        """Generate a summary report of all scraped content"""
        print("\n📊 Generating summary report...")
        
        summary = {
            "generated_at": datetime.now().isoformat(),
            "topics_scraped": len(FARMING_TOPICS),
            "topics": FARMING_TOPICS,
            "sources": ["ICAR", "Krishi Jagran", "YouTube", "AgriTech Portal"],
            "output_directory": OUTPUT_DIR,
            "files": {
                "documents": len(os.listdir(f"{OUTPUT_DIR}/documents")),
                "videos": len(os.listdir(f"{OUTPUT_DIR}/videos"))
            }
        }
        
        # Save summary
        with open(f"{OUTPUT_DIR}/metadata/scraping_summary.json", 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Summary saved to: {OUTPUT_DIR}/metadata/scraping_summary.json")
        print(f"\n📈 Scraping Statistics:")
        print(f"   Topics: {summary['topics_scraped']}")
        print(f"   Documents: {summary['files']['documents']}")
        print(f"   Video files: {summary['files']['videos']}")
        
        return summary
    
    def scrape_all(self):
        """Scrape all topics from all sources"""
        print("🚀 Starting knowledge base scraping...\n")
        print(f"📋 Topics to scrape: {len(FARMING_TOPICS)}")
        print(f"📁 Output directory: {OUTPUT_DIR}\n")
        
        for i, topic in enumerate(FARMING_TOPICS, 1):
            print(f"\n{'='*60}")
            print(f"Topic {i}/{len(FARMING_TOPICS)}: {topic}")
            print(f"{'='*60}")
            
            # Scrape from multiple sources
            self.scrape_icar_content(topic)
            time.sleep(1)  # Rate limiting
            
            self.scrape_krishi_jagran(topic)
            time.sleep(1)
            
            self.scrape_agritech_portal(topic)
            time.sleep(1)
            
            # Scrape YouTube videos
            self.scrape_youtube_videos(topic, max_results=3)
            time.sleep(2)  # Longer delay for YouTube API
        
        # Generate summary report
        self.generate_summary_report()
        
        print("\n✅ Scraping completed!")
        print(f"📂 All content saved to: {OUTPUT_DIR}/")

def main():
    """Main execution function"""
    scraper = KnowledgeScraper()
    scraper.scrape_all()

if __name__ == "__main__":
    main()
