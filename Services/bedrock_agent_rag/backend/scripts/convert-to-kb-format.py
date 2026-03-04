#!/usr/bin/env python3
"""
Convert scraped JSON data to text format for Bedrock Knowledge Base
Creates clean text files optimized for RAG (Retrieval Augmented Generation)
"""

import os
import json
from datetime import datetime

INPUT_DIR = "scraped-knowledge"
OUTPUT_DIR = "kb-ready-documents"

class KBFormatter:
    def __init__(self):
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        os.makedirs(f"{OUTPUT_DIR}/articles", exist_ok=True)
        os.makedirs(f"{OUTPUT_DIR}/videos", exist_ok=True)
        os.makedirs(f"{OUTPUT_DIR}/schemes", exist_ok=True)
    
    def format_article_document(self, data):
        """Convert article JSON to formatted text"""
        lines = []
        
        # Header
        lines.append(f"विषय: {data.get('topic_hi', 'N/A')}")
        lines.append(f"Topic: {data.get('topic_en', 'N/A')}")
        lines.append(f"श्रेणी: {data.get('category', 'N/A')}")
        lines.append(f"स्रोत: {data.get('source', 'N/A')}")
        lines.append(f"भाषा: हिंदी")
        lines.append("=" * 60)
        lines.append("")
        
        # Articles
        articles = data.get('articles', [])
        for i, article in enumerate(articles, 1):
            lines.append(f"## लेख {i}: {article.get('title', 'शीर्षक नहीं')}")
            lines.append("")
            lines.append(article.get('content', ''))
            lines.append("")
            lines.append(f"स्रोत URL: {article.get('url', 'N/A')}")
            lines.append("")
            lines.append("-" * 60)
            lines.append("")
        
        # Footer
        lines.append("")
        lines.append(f"संकलित: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return "\n".join(lines)
    
    def format_video_document(self, videos):
        """Convert video JSON to formatted text"""
        if not videos:
            return ""
        
        lines = []
        
        # Get topic from first video
        first_video = videos[0] if isinstance(videos, list) else videos
        topic_hi = first_video.get('topic_hi', 'N/A')
        topic_en = first_video.get('topic_en', 'N/A')
        
        # Header
        lines.append(f"विषय: {topic_hi}")
        lines.append(f"Topic: {topic_en}")
        lines.append(f"प्रकार: वीडियो ट्यूटोरियल")
        lines.append(f"भाषा: हिंदी")
        lines.append("=" * 60)
        lines.append("")
        
        # Videos
        if isinstance(videos, list):
            for i, video in enumerate(videos, 1):
                lines.append(f"## वीडियो {i}: {video.get('title', 'शीर्षक नहीं')}")
                lines.append("")
                lines.append(f"चैनल: {video.get('channel', 'N/A')}")
                lines.append(f"अवधि: {video.get('duration', 'N/A')}")
                lines.append(f"व्यूज: {video.get('view_count', 'N/A')}")
                lines.append(f"लाइक्स: {video.get('like_count', 'N/A')}")
                lines.append("")
                lines.append("विवरण:")
                lines.append(video.get('description', 'विवरण उपलब्ध नहीं'))
                lines.append("")
                lines.append(f"वीडियो URL: {video.get('url', 'N/A')}")
                lines.append(f"एम्बेड URL: {video.get('embed_url', 'N/A')}")
                lines.append(f"थंबनेल: {video.get('thumbnail_high', 'N/A')}")
                lines.append("")
                lines.append("-" * 60)
                lines.append("")
        
        # Footer
        lines.append("")
        lines.append(f"संकलित: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return "\n".join(lines)
    
    def format_scheme_document(self, schemes):
        """Convert government schemes to formatted text"""
        lines = []
        
        # Header
        lines.append("सरकारी कृषि योजनाएं")
        lines.append("Government Agricultural Schemes")
        lines.append("=" * 60)
        lines.append("")
        
        # Schemes
        for i, scheme in enumerate(schemes, 1):
            lines.append(f"## योजना {i}: {scheme.get('name_hi', 'N/A')}")
            lines.append(f"Scheme: {scheme.get('name_en', 'N/A')}")
            lines.append("")
            lines.append("विवरण:")
            lines.append(scheme.get('description', 'N/A'))
            lines.append("")
            lines.append("पात्रता:")
            lines.append(scheme.get('eligibility', 'N/A'))
            lines.append("")
            lines.append("लाभ:")
            lines.append(scheme.get('benefits', 'N/A'))
            lines.append("")
            lines.append(f"आधिकारिक वेबसाइट: {scheme.get('url', 'N/A')}")
            lines.append(f"श्रेणी: {scheme.get('category', 'N/A')}")
            lines.append("")
            lines.append("-" * 60)
            lines.append("")
        
        # Footer
        lines.append("")
        lines.append(f"संकलित: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return "\n".join(lines)
    
    def process_documents(self):
        """Process all document JSON files"""
        print("📄 Processing documents...")
        
        docs_dir = f"{INPUT_DIR}/documents"
        if not os.path.exists(docs_dir):
            print("  ⚠️  Documents directory not found")
            return 0
        
        count = 0
        for filename in os.listdir(docs_dir):
            if not filename.endswith('.json'):
                continue
            
            filepath = f"{docs_dir}/{filename}"
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Check if it's schemes or articles
                if 'government_schemes' in filename:
                    text_content = self.format_scheme_document(data)
                    output_file = f"{OUTPUT_DIR}/schemes/{filename.replace('.json', '.txt')}"
                else:
                    text_content = self.format_article_document(data)
                    output_file = f"{OUTPUT_DIR}/articles/{filename.replace('.json', '.txt')}"
                
                # Save as text file
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(text_content)
                
                print(f"  ✅ {filename} → {os.path.basename(output_file)}")
                count += 1
                
            except Exception as e:
                print(f"  ❌ Error processing {filename}: {e}")
        
        return count
    
    def process_videos(self):
        """Process all video JSON files"""
        print("\n🎥 Processing videos...")
        
        videos_dir = f"{INPUT_DIR}/videos"
        if not os.path.exists(videos_dir):
            print("  ⚠️  Videos directory not found")
            return 0
        
        count = 0
        for filename in os.listdir(videos_dir):
            if not filename.endswith('.json'):
                continue
            
            filepath = f"{videos_dir}/{filename}"
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Format videos
                text_content = self.format_video_document(data)
                
                if text_content:
                    output_file = f"{OUTPUT_DIR}/videos/{filename.replace('.json', '.txt')}"
                    
                    with open(output_file, 'w', encoding='utf-8') as f:
                        f.write(text_content)
                    
                    print(f"  ✅ {filename} → {os.path.basename(output_file)}")
                    count += 1
                
            except Exception as e:
                print(f"  ❌ Error processing {filename}: {e}")
        
        return count
    
    def create_master_index(self):
        """Create a master index of all documents"""
        print("\n📚 Creating master index...")
        
        index = {
            "created_at": datetime.now().isoformat(),
            "total_documents": 0,
            "categories": {
                "articles": [],
                "videos": [],
                "schemes": []
            }
        }
        
        # Index articles
        articles_dir = f"{OUTPUT_DIR}/articles"
        if os.path.exists(articles_dir):
            for filename in os.listdir(articles_dir):
                if filename.endswith('.txt'):
                    index['categories']['articles'].append(filename)
        
        # Index videos
        videos_dir = f"{OUTPUT_DIR}/videos"
        if os.path.exists(videos_dir):
            for filename in os.listdir(videos_dir):
                if filename.endswith('.txt'):
                    index['categories']['videos'].append(filename)
        
        # Index schemes
        schemes_dir = f"{OUTPUT_DIR}/schemes"
        if os.path.exists(schemes_dir):
            for filename in os.listdir(schemes_dir):
                if filename.endswith('.txt'):
                    index['categories']['schemes'].append(filename)
        
        index['total_documents'] = sum(len(v) for v in index['categories'].values())
        
        # Save index
        with open(f"{OUTPUT_DIR}/index.json", 'w', encoding='utf-8') as f:
            json.dump(index, f, ensure_ascii=False, indent=2)
        
        print(f"  ✅ Index created: {index['total_documents']} documents")
        return index
    
    def generate_upload_script(self):
        """Generate AWS S3 upload script"""
        print("\n📤 Generating upload script...")
        
        script = f"""#!/bin/bash
# Upload Knowledge Base Documents to S3
# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

# Configuration
BUCKET_NAME="farmer-voice-ai-dev-documents"
REGION="ap-south-1"
KB_PREFIX="farming-knowledge"

echo "🚀 Uploading knowledge base documents to S3..."

# Upload articles
echo "📄 Uploading articles..."
aws s3 sync {OUTPUT_DIR}/articles/ s3://${{BUCKET_NAME}}/${{KB_PREFIX}}/articles/ \\
  --region ${{REGION}} \\
  --content-type "text/plain; charset=utf-8"

# Upload videos metadata
echo "🎥 Uploading video metadata..."
aws s3 sync {OUTPUT_DIR}/videos/ s3://${{BUCKET_NAME}}/${{KB_PREFIX}}/videos/ \\
  --region ${{REGION}} \\
  --content-type "text/plain; charset=utf-8"

# Upload schemes
echo "🏛️  Uploading government schemes..."
aws s3 sync {OUTPUT_DIR}/schemes/ s3://${{BUCKET_NAME}}/${{KB_PREFIX}}/schemes/ \\
  --region ${{REGION}} \\
  --content-type "text/plain; charset=utf-8"

# Upload index
echo "📚 Uploading index..."
aws s3 cp {OUTPUT_DIR}/index.json s3://${{BUCKET_NAME}}/${{KB_PREFIX}}/index.json \\
  --region ${{REGION}} \\
  --content-type "application/json; charset=utf-8"

echo "✅ Upload completed!"
echo "📊 Check S3 bucket: s3://${{BUCKET_NAME}}/${{KB_PREFIX}}/"

# Trigger Knowledge Base sync (optional)
# Uncomment and set your KB ID and Data Source ID
# echo "🔄 Triggering Knowledge Base sync..."
# aws bedrock-agent start-ingestion-job \\
#   --knowledge-base-id YOUR_KB_ID \\
#   --data-source-id YOUR_DS_ID \\
#   --region ${{REGION}}
"""
        
        script_file = f"{OUTPUT_DIR}/upload-to-s3.sh"
        with open(script_file, 'w') as f:
            f.write(script)
        
        os.chmod(script_file, 0o755)  # Make executable
        
        print(f"  ✅ Upload script created: {script_file}")
        print(f"  💡 Run with: ./{script_file}")
    
    def run(self):
        """Run the complete conversion process"""
        print("🚀 Converting scraped data to Knowledge Base format\n")
        print(f"📂 Input: {INPUT_DIR}/")
        print(f"📂 Output: {OUTPUT_DIR}/\n")
        
        # Process all data
        doc_count = self.process_documents()
        video_count = self.process_videos()
        
        # Create index
        index = self.create_master_index()
        
        # Generate upload script
        self.generate_upload_script()
        
        # Summary
        print(f"\n{'='*60}")
        print("📊 CONVERSION SUMMARY")
        print(f"{'='*60}")
        print(f"Articles processed: {doc_count}")
        print(f"Videos processed: {video_count}")
        print(f"Total documents: {index['total_documents']}")
        print(f"Output directory: {OUTPUT_DIR}/")
        print(f"{'='*60}\n")
        
        print("✅ Conversion completed!")
        print(f"\n📤 Next steps:")
        print(f"1. Review documents: ls -lh {OUTPUT_DIR}/")
        print(f"2. Upload to S3: ./{OUTPUT_DIR}/upload-to-s3.sh")
        print(f"3. Sync Knowledge Base in AWS Console")

def main():
    formatter = KBFormatter()
    formatter.run()

if __name__ == "__main__":
    main()
