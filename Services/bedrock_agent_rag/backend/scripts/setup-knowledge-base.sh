#!/bin/bash

# Setup script for Bedrock Knowledge Base with OpenSearch Serverless
# Run this after deploying the serverless stack

set -e

REGION="ap-south-1"
STAGE="${1:-dev}"
SERVICE_NAME="farmer-voice-ai"
S3_BUCKET="${SERVICE_NAME}-${STAGE}-documents"

echo "🚀 Setting up Bedrock Knowledge Base..."
echo "Region: $REGION"
echo "Stage: $STAGE"
echo "S3 Bucket: $S3_BUCKET"

# Step 1: Upload sample PDFs to S3
echo -e "\n📄 Step 1: Uploading sample documents to S3..."

# Create sample farming documents
mkdir -p ./sample-docs

cat > ./sample-docs/wheat-cultivation.txt << 'EOF'
गेहूं की खेती - ICAR गाइड 2023

बुवाई का समय:
- नवंबर का पहला सप्ताह सबसे उपयुक्त है
- तापमान 20-25°C होना चाहिए
- मिट्टी में पर्याप्त नमी होनी चाहिए

बीज दर:
- सामान्य किस्में: 100 किलो प्रति हेक्टेयर
- देर से बुवाई: 125 किलो प्रति हेक्टेयर

उर्वरक:
- नाइट्रोजन: 120 किलो प्रति हेक्टेयर
- फास्फोरस: 60 किलो प्रति हेक्टेयर
- पोटाश: 40 किलो प्रति हेक्टेयर

सिंचाई:
- पहली सिंचाई: बुवाई के 20-25 दिन बाद (CRI stage)
- दूसरी सिंचाई: बुवाई के 40-45 दिन बाद (tillering)
- तीसरी सिंचाई: बुवाई के 60-65 दिन बाद (jointing)
- चौथी सिंचाई: बुवाई के 80-85 दिन बाद (flowering)
- पांचवी सिंचाई: बुवाई के 100-105 दिन बाद (milk stage)

स्रोत: ICAR - भारतीय कृषि अनुसंधान परिषद
EOF

cat > ./sample-docs/rice-pest-management.txt << 'EOF'
धान में कीट प्रबंधन - ICAR

प्रमुख कीट:

1. तना छेदक (Stem Borer):
   - लक्षण: पत्तियों में सफेद धारियां
   - नियंत्रण: कार्टाप हाइड्रोक्लोराइड 4% @ 1 किलो/हेक्टेयर
   - जैविक: ट्राइकोग्रामा कार्ड @ 50,000/हेक्टेयर

2. पत्ती लपेटक (Leaf Folder):
   - लक्षण: पत्तियां मुड़ी हुई
   - नियंत्रण: क्लोरपायरीफॉस 20% EC @ 2.5 लीटर/हेक्टेयर

3. भूरा फुदका (Brown Plant Hopper):
   - लक्षण: पौधे सूखे और भूरे
   - नियंत्रण: इमिडाक्लोप्रिड 17.8% SL @ 100 ml/हेक्टेयर

जैविक नियंत्रण:
- नीम का तेल 5ml प्रति लीटर पानी
- पीले चिपचिपे ट्रैप लगाएं
- प्रकाश ट्रैप का उपयोग करें

स्रोत: ICAR - धान अनुसंधान निदेशालय
EOF

cat > ./sample-docs/pm-kisan-scheme.txt << 'EOF'
प्रधानमंत्री किसान सम्मान निधि (PM-KISAN) योजना

योजना का उद्देश्य:
सभी भूमिधारक किसान परिवारों को आय सहायता प्रदान करना

लाभ:
- ₹6000 प्रति वर्ष
- तीन समान किस्तों में ₹2000-₹2000-₹2000
- सीधे बैंक खाते में DBT के माध्यम से

पात्रता:
- सभी भूमिधारक किसान परिवार
- 2 हेक्टेयर तक की भूमि वाले किसान (पहले की सीमा हटा दी गई)

आवश्यक दस्तावेज:
- आधार कार्ड
- बैंक खाता विवरण
- भूमि स्वामित्व दस्तावेज
- मोबाइल नंबर

रजिस्ट्रेशन:
- ऑनलाइन: pmkisan.gov.in
- ऑफलाइन: नजदीकी CSC या कृषि कार्यालय

किस्त का समय:
- पहली किस्त: अप्रैल-जुलाई
- दूसरी किस्त: अगस्त-नवंबर
- तीसरी किस्त: दिसंबर-मार्च

हेल्पलाइन: 155261 / 011-24300606

स्रोत: कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार
EOF

cat > ./sample-docs/soil-testing.txt << 'EOF'
मृदा परीक्षण - ICAR मृदा स्वास्थ्य कार्ड योजना

मृदा परीक्षण क्यों जरूरी है:
- सही उर्वरक की मात्रा जानने के लिए
- मिट्टी की उर्वरता बढ़ाने के लिए
- फसल उत्पादन बढ़ाने के लिए
- खर्च कम करने के लिए

नमूना कैसे लें:

1. खेत को 5-6 भागों में बांटें
2. प्रत्येक भाग से V आकार में मिट्टी खोदें
3. 6 इंच (15 सेमी) गहराई से नमूना लें
4. सभी नमूनों को मिलाकर 500 ग्राम रखें
5. साफ कपड़े या पॉलीथीन में पैक करें

परीक्षण पैरामीटर:
- pH (अम्लता/क्षारीयता)
- EC (विद्युत चालकता)
- नाइट्रोजन (N)
- फास्फोरस (P)
- पोटाश (K)
- जैविक कार्बन
- सूक्ष्म पोषक तत्व (Zn, Fe, Cu, Mn)

कहां जांच कराएं:
- नजदीकी मृदा परीक्षण प्रयोगशाला
- कृषि विज्ञान केंद्र (KVK)
- कृषि विभाग कार्यालय

शुल्क: ₹20-50 (सरकारी प्रयोगशाला)

रिपोर्ट समय: 7-10 दिन

स्रोत: ICAR - भारतीय मृदा विज्ञान संस्थान
EOF

# Upload to S3
echo "Uploading documents..."
aws s3 cp ./sample-docs/ s3://${S3_BUCKET}/knowledge-base/ --recursive --region $REGION

echo "✅ Documents uploaded to S3"

# Step 2: Instructions for creating Knowledge Base
echo -e "\n📚 Step 2: Create Bedrock Knowledge Base"
echo "----------------------------------------"
echo "Go to AWS Console > Amazon Bedrock > Knowledge bases"
echo ""
echo "1. Click 'Create knowledge base'"
echo "2. Name: farmer-voice-ai-kb"
echo "3. IAM Role: Create new service role"
echo "4. Data source: S3"
echo "5. S3 URI: s3://${S3_BUCKET}/knowledge-base/"
echo "6. Embeddings model: Titan Embeddings G1 - Text"
echo "7. Vector database: Quick create new OpenSearch Serverless collection"
echo "8. Click 'Create'"
echo ""
echo "After creation, copy the Knowledge Base ID and add to .env:"
echo "KNOWLEDGE_BASE_ID=<your-kb-id>"
echo ""
echo "Then sync the data source from the console."

# Step 3: Instructions for creating Agent (optional)
echo -e "\n🤖 Step 3: Create Bedrock Agent (Optional - for live web search)"
echo "----------------------------------------------------------------"
echo "Go to AWS Console > Amazon Bedrock > Agents"
echo ""
echo "1. Click 'Create agent'"
echo "2. Name: farmer-voice-ai-agent"
echo "3. Model: Claude 3 Sonnet"
echo "4. Instructions: 'You help Indian farmers with live information about government schemes, mandi prices, and weather.'"
echo "5. Add Action Group:"
echo "   - Name: web-search"
echo "   - Action: Lambda function or API"
echo "   - Enable web search capability"
echo "6. Create and prepare agent"
echo "7. Copy Agent ID and Alias ID to .env:"
echo "   AGENT_ID=<your-agent-id>"
echo "   AGENT_ALIAS_ID=<your-agent-alias-id>"

echo -e "\n✅ Setup script completed!"
echo "Next steps:"
echo "1. Create Knowledge Base in AWS Console (follow instructions above)"
echo "2. Update .env with KNOWLEDGE_BASE_ID"
echo "3. Optionally create Agent for live queries"
echo "4. Deploy: npm run deploy"
