#!/usr/bin/env python3
"""
Simple Web Scraper - No API Keys Required
Scrapes farming content from public websites without any API dependencies
"""

import os
import json
import time
import re
from datetime import datetime
from urllib.parse import quote, urljoin

try:
    import requests
    from bs4 import BeautifulSoup
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False
    print("❌ Missing dependencies. Install with:")
    print("   pip install requests beautifulsoup4 lxml")
    exit(1)

# Configuration
OUTPUT_DIR = "scraped-knowledge"

# Farming topics
TOPICS = [
    {"hi": "गेहूं की खेती", "en": "wheat farming", "keywords": ["wheat", "gehun"]},
    {"hi": "धान की खेती", "en": "rice farming", "keywords": ["rice", "dhan", "paddy"]},
    {"hi": "मक्का की खेती", "en": "maize farming", "keywords": ["maize", "corn", "makka"]},
    {"hi": "कपास की खेती", "en": "cotton farming", "keywords": ["cotton", "kapas"]},
    {"hi": "कीट नियंत्रण", "en": "pest control", "keywords": ["pest", "insect", "keet"]},
    {"hi": "जैविक खेती", "en": "organic farming", "keywords": ["organic", "jaivik"]},
    {"hi": "मिट्टी परीक्षण", "en": "soil testing", "keywords": ["soil", "mitti"]},
    {"hi": "सिंचाई", "en": "irrigation", "keywords": ["irrigation", "sinchai", "water"]},
    {"hi": "बीज उपचार", "en": "seed treatment", "keywords": ["seed", "beej"]},
    {"hi": "खाद प्रबंधन", "en": "fertilizer", "keywords": ["fertilizer", "khad", "manure"]},
]

class SimpleScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Create directories
        for dir_name in ['documents', 'videos', 'metadata']:
            os.makedirs(f"{OUTPUT_DIR}/{dir_name}", exist_ok=True)
    
    def clean_text(self, text):
        """Clean text content"""
        if not text:
            return ""
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        return text
    
    def scrape_krishi_jagran(self, topic):
        """Scrape Krishi Jagran Hindi website"""
        print(f"📰 Scraping Krishi Jagran: {topic['hi']}")
        
        try:
            # Search URL
            search_url = f"https://hindi.krishijagran.com/search?q={quote(topic['en'])}"
            response = self.session.get(search_url, timeout=15)
            
            if response.status_code != 200:
                print(f"  ⚠️  HTTP {response.status_code}")
                return None
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find article links
            articles = []
            links = soup.find_all('a', href=True)
            
            article_count = 0
            for link in links:
                href = link.get('href', '')
                
                # Look for article URLs
                if any(x in href for x in ['/article/', '/news/', '/kheti/']):
                    full_url = urljoin('https://hindi.krishijagran.com', href)
                    
                    # Get article title
                    title = self.clean_text(link.get_text())
                    
                    if title and len(title) > 10:
                        articles.append({
                            "title": title,
                            "url": full_url,
                            "source": "Krishi Jagran"
                        })
                        article_count += 1
                        
                        if article_count >= 5:  # Limit to 5 articles
                            break
            
            if articles:
                content = {
                    "topic_hi": topic['hi'],
                    "topic_en": topic['en'],
                    "source": "Krishi Jagran",
                    "scraped_at": datetime.now().isoformat(),
                    "articles": articles,
                    "language": "hi"
                }
                
                filename = f"{OUTPUT_DIR}/documents/krishi_{topic['en'].replace(' ', '_')}.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(content, f, ensure_ascii=False, indent=2)
                
                print(f"  ✅ Found {len(articles)} articles")
                return content
            else:
                print(f"  ⚠️  No articles found")
                return None
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return None
    
    def scrape_youtube_search(self, topic):
        """Scrape YouTube search page (no API needed)"""
        print(f"🎥 Scraping YouTube: {topic['hi']}")
        
        try:
            # YouTube search URL
            search_query = f"{topic['hi']} खेती हिंदी"
            search_url = f"https://www.youtube.com/results?search_query={quote(search_query)}"
            
            response = self.session.get(search_url, timeout=15)
            
            if response.status_code != 200:
                print(f"  ⚠️  HTTP {response.status_code}")
                return None
            
            # Parse HTML to find video data
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find script tags containing video data
            videos = []
            scripts = soup.find_all('script')
            
            for script in scripts:
                if script.string and 'var ytInitialData' in script.string:
                    # Extract video IDs and titles from the data
                    content = script.string
                    
                    # Find video IDs (pattern: "videoId":"...")
                    video_ids = re.findall(r'"videoId":"([^"]+)"', content)
                    
                    # Find titles (pattern: "title":{"runs":[{"text":"..."}]})
                    titles = re.findall(r'"title":\{"runs":\[\{"text":"([^"]+)"', content)
                    
                    # Combine video IDs and titles
                    for i, (video_id, title) in enumerate(zip(video_ids[:5], titles[:5])):
                        if len(video_id) == 11:  # Valid YouTube video ID length
                            videos.append({
                                "video_id": video_id,
                                "title": title,
                                "url": f"https://www.youtube.com/watch?v={video_id}",
                                "embed_url": f"https://www.youtube.com/embed/{video_id}",
                                "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                                "search_query": search_query
                            })
                    
                    break
            
            if videos:
                content = {
                    "topic_hi": topic['hi'],
                    "topic_en": topic['en'],
                    "source": "YouTube",
                    "scraped_at": datetime.now().isoformat(),
                    "videos": videos,
                    "search_url": search_url,
                    "language": "hi"
                }
                
                filename = f"{OUTPUT_DIR}/videos/{topic['en'].replace(' ', '_')}_videos.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(content, f, ensure_ascii=False, indent=2)
                
                print(f"  ✅ Found {len(videos)} videos")
                return content
            else:
                print(f"  ⚠️  No videos found")
                return None
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return None
    
    def scrape_agritech_portal(self, topic):
        """Scrape agriculture technology portals"""
        print(f"🌾 Scraping AgriTech: {topic['hi']}")
        
        try:
            # Try multiple agriculture portals
            portals = [
                f"https://agritech.tnau.ac.in/search?q={quote(topic['en'])}",
                f"https://farmer.gov.in/search?q={quote(topic['en'])}",
            ]
            
            for portal_url in portals:
                try:
                    response = self.session.get(portal_url, timeout=10)
                    
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.content, 'html.parser')
                        
                        # Extract text content
                        paragraphs = soup.find_all('p')
                        content_text = '\n\n'.join([self.clean_text(p.get_text()) for p in paragraphs[:10]])
                        
                        if content_text and len(content_text) > 100:
                            content = {
                                "topic_hi": topic['hi'],
                                "topic_en": topic['en'],
                                "source": "AgriTech Portal",
                                "url": portal_url,
                                "scraped_at": datetime.now().isoformat(),
                                "content": content_text[:2000],
                                "language": "en"
                            }
                            
                            filename = f"{OUTPUT_DIR}/documents/agritech_{topic['en'].replace(' ', '_')}.json"
                            with open(filename, 'w', encoding='utf-8') as f:
                                json.dump(content, f, ensure_ascii=False, indent=2)
                            
                            print(f"  ✅ Scraped content")
                            return content
                            
                except Exception as e:
                    continue
            
            print(f"  ⚠️  No content found")
            return None
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return None
    
    def create_government_schemes(self):
        """Create government schemes data"""
        print("\n🏛️  Creating government schemes data...")
        
        schemes = [
            {
                "name_hi": "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
                "name_en": "PM-KISAN",
                "description": "₹6000 प्रति वर्ष सीधे किसानों के खाते में तीन किस्तों में",
                "eligibility": "सभी भूमिधारक किसान परिवार",
                "benefits": "₹2000 की तीन किस्तें प्रति वर्ष",
                "how_to_apply": "ऑनलाइन आवेदन pmkisan.gov.in पर या नजदीकी CSC केंद्र पर",
                "documents_required": "आधार कार्ड, बैंक खाता, भूमि दस्तावेज",
                "helpline": "155261 / 011-24300606",
                "url": "https://pmkisan.gov.in/",
                "category": "financial_assistance"
            },
            {
                "name_hi": "प्रधानमंत्री फसल बीमा योजना (PMFBY)",
                "name_en": "Pradhan Mantri Fasal Bima Yojana",
                "description": "प्राकृतिक आपदाओं से फसल नुकसान की भरपाई",
                "eligibility": "सभी किसान (भूमिधारक और किरायेदार)",
                "benefits": "फसल नुकसान पर बीमा राशि, कम प्रीमियम (खरीफ 2%, रबी 1.5%)",
                "how_to_apply": "बैंक, CSC, या pmfby.gov.in पर ऑनलाइन",
                "documents_required": "आधार कार्ड, बैंक खाता, भूमि दस्तावेज, बुवाई प्रमाण पत्र",
                "helpline": "011-23382012",
                "url": "https://pmfby.gov.in/",
                "category": "insurance"
            },
            {
                "name_hi": "किसान क्रेडिट कार्ड (KCC)",
                "name_en": "Kisan Credit Card",
                "description": "कम ब्याज दर पर कृषि ऋण",
                "eligibility": "सभी किसान (व्यक्तिगत/संयुक्त)",
                "benefits": "4% ब्याज दर (समय पर भुगतान पर), ₹3 लाख तक बिना गारंटी",
                "how_to_apply": "नजदीकी बैंक शाखा में आवेदन करें",
                "documents_required": "आधार कार्ड, पैन कार्ड, भूमि दस्तावेज, पासपोर्ट फोटो",
                "helpline": "बैंक शाखा से संपर्क करें",
                "url": "https://www.india.gov.in/spotlight/kisan-credit-card-kcc",
                "category": "credit"
            },
            {
                "name_hi": "मृदा स्वास्थ्य कार्ड योजना",
                "name_en": "Soil Health Card Scheme",
                "description": "मुफ्त मिट्टी परीक्षण और सिफारिशें",
                "eligibility": "सभी किसान",
                "benefits": "मुफ्त मिट्टी परीक्षण, पोषक तत्वों की जानकारी, उर्वरक सिफारिशें",
                "how_to_apply": "नजदीकी कृषि विभाग कार्यालय या मिट्टी परीक्षण प्रयोगशाला",
                "documents_required": "आधार कार्ड, भूमि दस्तावेज",
                "helpline": "राज्य कृषि विभाग",
                "url": "https://soilhealth.dac.gov.in/",
                "category": "soil_health"
            },
            {
                "name_hi": "प्रधानमंत्री कृषि सिंचाई योजना (PMKSY)",
                "name_en": "PM Krishi Sinchayee Yojana",
                "description": "सिंचाई सुविधाओं का विस्तार और जल संरक्षण",
                "eligibility": "सभी किसान",
                "benefits": "ड्रिप/स्प्रिंकलर सिंचाई पर सब्सिडी, जल संरक्षण उपकरण",
                "how_to_apply": "जिला कृषि कार्यालय में आवेदन",
                "documents_required": "आधार कार्ड, भूमि दस्तावेज, बैंक खाता",
                "helpline": "राज्य कृषि विभाग",
                "url": "https://pmksy.gov.in/",
                "category": "irrigation"
            }
        ]
        
        filename = f"{OUTPUT_DIR}/documents/government_schemes.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(schemes, f, ensure_ascii=False, indent=2)
        
        print(f"  ✅ Created {len(schemes)} schemes")
        return schemes
    
    def generate_report(self):
        """Generate scraping report"""
        print("\n📊 Generating report...")
        
        report = {
            "generated_at": datetime.now().isoformat(),
            "topics_scraped": len(TOPICS),
            "statistics": {
                "documents": 0,
                "videos": 0
            },
            "sources": ["Krishi Jagran", "YouTube", "AgriTech Portals", "Government Schemes"],
            "output_directory": OUTPUT_DIR
        }
        
        # Count files
        for dir_name in ['documents', 'videos']:
            dir_path = f"{OUTPUT_DIR}/{dir_name}"
            if os.path.exists(dir_path):
                count = len([f for f in os.listdir(dir_path) if f.endswith('.json')])
                report['statistics'][dir_name] = count
        
        # Save report
        with open(f"{OUTPUT_DIR}/metadata/report.json", 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"\n{'='*60}")
        print("📈 SCRAPING REPORT")
        print(f"{'='*60}")
        print(f"Topics: {report['topics_scraped']}")
        print(f"Documents: {report['statistics']['documents']}")
        print(f"Videos: {report['statistics']['videos']}")
        print(f"Output: {OUTPUT_DIR}/")
        print(f"{'='*60}\n")
        
        return report
    
    def run(self):
        """Run the scraper"""
        print("🚀 Simple Web Scraper - No API Keys Needed\n")
        print(f"📋 Topics: {len(TOPICS)}")
        print(f"📁 Output: {OUTPUT_DIR}/\n")
        
        # Create government schemes
        self.create_government_schemes()
        
        # Scrape each topic
        for i, topic in enumerate(TOPICS, 1):
            print(f"\n{'='*60}")
            print(f"[{i}/{len(TOPICS)}] {topic['hi']} ({topic['en']})")
            print(f"{'='*60}")
            
            # Scrape articles
            self.scrape_krishi_jagran(topic)
            time.sleep(2)  # Rate limiting
            
            # Scrape videos
            self.scrape_youtube_search(topic)
            time.sleep(2)
            
            # Scrape agritech portals
            self.scrape_agritech_portal(topic)
            time.sleep(2)
        
        # Generate report
        self.generate_report()
        
        print("✅ Scraping completed!")
        print(f"\n📂 Next steps:")
        print(f"1. Review: ls -lh {OUTPUT_DIR}/")
        print(f"2. Convert: python3 convert-to-kb-format.py")
        print(f"3. Upload: ./kb-ready-documents/upload-to-s3.sh")

def main():
    if not HAS_DEPS:
        return
    
    scraper = SimpleScraper()
    scraper.run()

if __name__ == "__main__":
    main()
