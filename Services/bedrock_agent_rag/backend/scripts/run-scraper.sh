#!/bin/bash
# Complete Knowledge Base Scraper Pipeline
# Scrapes farming content and prepares it for Bedrock Knowledge Base

set -e  # Exit on error

echo "🌾 Farmer Voice AI - Knowledge Base Scraper"
echo "============================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Check if requirements are installed
echo "📦 Checking dependencies..."
if ! python3 -c "import bs4" 2>/dev/null; then
    echo "⚠️  BeautifulSoup not installed"
    echo "Installing dependencies..."
    pip3 install -r scraper-requirements.txt
else
    echo "✅ Dependencies installed"
fi
echo ""

# Step 1: Run scraper (no API keys needed)
echo "============================================"
echo "Step 1: Scraping farming knowledge"
echo "============================================"
echo ""
echo "ℹ️  Using simple web scraper (no API keys required)"
echo ""
python3 simple-scraper.py

if [ $? -ne 0 ]; then
    echo "❌ Scraping failed"
    exit 1
fi

echo ""
echo "✅ Scraping completed"
echo ""

# Step 2: Convert to KB format
echo "============================================"
echo "Step 2: Converting to Knowledge Base format"
echo "============================================"
echo ""
python3 convert-to-kb-format.py

if [ $? -ne 0 ]; then
    echo "❌ Conversion failed"
    exit 1
fi

echo ""
echo "✅ Conversion completed"
echo ""

# Summary
echo "============================================"
echo "🎉 Pipeline Completed Successfully!"
echo "============================================"
echo ""
echo "📂 Output directories:"
echo "   - scraped-knowledge/     (Raw JSON data)"
echo "   - kb-ready-documents/    (Formatted text files)"
echo ""
echo "📊 Statistics:"
echo "   Documents: $(find kb-ready-documents/articles -name "*.txt" 2>/dev/null | wc -l)"
echo "   Videos: $(find kb-ready-documents/videos -name "*.txt" 2>/dev/null | wc -l)"
echo "   Schemes: $(find kb-ready-documents/schemes -name "*.txt" 2>/dev/null | wc -l)"
echo ""
echo "📤 Next steps:"
echo "   1. Review documents:"
echo "      ls -lh kb-ready-documents/"
echo ""
echo "   2. Upload to S3:"
echo "      ./kb-ready-documents/upload-to-s3.sh"
echo ""
echo "   3. Sync Bedrock Knowledge Base:"
echo "      aws bedrock-agent start-ingestion-job \\"
echo "        --knowledge-base-id YOUR_KB_ID \\"
echo "        --data-source-id YOUR_DS_ID \\"
echo "        --region ap-south-1"
echo ""
echo "✅ All done! Happy farming! 🌾"
