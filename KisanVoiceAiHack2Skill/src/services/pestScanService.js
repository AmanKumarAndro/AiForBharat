import axios from 'axios';

const API_BASE_URL = 'https://w34j1qs7tc.execute-api.ap-south-1.amazonaws.com/prod';

class PestScanService {
    async completeScan(farmerId, imageBlob, district = 'Pune') {
        // Simulate a network delay of 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Return the exact simulated mock JSON response provided
        return {
            "type": "DIAGNOSIS",
            "disease_label": "fall_armyworm",
            "disease_name": "फॉल आर्मीवर्म",
            "confidence": 100.0,
            "description": "Caterpillar pest destroying maize and rice leaves",
            "severity": "CRITICAL",
            "safe_treatments": [
                {
                    "pesticide_name": "Emamectin Benzoate 5% SG",
                    "dose": "0.4g per litre of water",
                    "safety_measures": {
                        "before_application": [
                            "Read product label carefully",
                            "Check weather forecast - avoid if rain expected",
                            "Wear full PPE: long-sleeved shirt, pants, gloves, mask, goggles",
                            "Keep children and animals away from spray area",
                            "Prepare spray solution in well-ventilated area"
                        ],
                        "during_application": [
                            "Spray in early morning (6-10 AM) or evening (4-6 PM)",
                            "Avoid spraying in windy conditions (wind speed > 10 km/h)",
                            "Stand upwind while spraying",
                            "Do not eat, drink, or smoke during application",
                            "Take breaks every 2 hours in shaded area"
                        ],
                        "after_application": [
                            "Wash hands and face with soap immediately",
                            "Take bath with soap and clean water",
                            "Wash contaminated clothes separately",
                            "Clean spray equipment thoroughly",
                            "Store leftover pesticide in original container with label",
                            "Dispose empty containers safely - do not reuse"
                        ],
                        "first_aid": {
                            "inhalation": "Move to fresh air immediately, seek medical help if breathing difficulty",
                            "ingestion": "Do NOT induce vomiting. Seek immediate medical help. Show product label to doctor",
                            "eye_contact": "Rinse eyes with clean water for 15 minutes, seek medical help",
                            "skin_contact": "Wash with plenty of soap and water for 15 minutes"
                        },
                        "emergency_contact": "National Poison Control: 1800-180-1551"
                    },
                    "method": "Foliar spray",
                    "is_organic": false,
                    "waiting_period_days": 7.0
                },
                {
                    "pesticide_name": "Neem Oil 1500 PPM",
                    "dose": "3ml per litre of water",
                    "safety_measures": {
                        "before_application": [
                            "Wear basic PPE: gloves and mask (organic but can cause skin irritation)",
                            "Mix in well-ventilated area",
                            "Keep away from children and pets"
                        ],
                        "during_application": [
                            "Spray in early morning or evening",
                            "Avoid contact with eyes and skin",
                            "Do not spray on flowering plants (affects beneficial insects)"
                        ],
                        "after_application": [
                            "Wash hands with soap and water",
                            "Clean equipment with soap",
                            "Store in cool, dark place"
                        ],
                        "first_aid": {
                            "inhalation": "Move to fresh air",
                            "ingestion": "Drink water, seek medical help if discomfort",
                            "eye_contact": "Rinse with clean water for 10 minutes",
                            "skin_contact": "Wash with soap and water"
                        },
                        "emergency_contact": "KVK Helpline or 1800-180-1551"
                    },
                    "method": "Foliar spray",
                    "is_organic": true,
                    "waiting_period_days": 3.0
                }
            ],
            "banned_removed": [],
            "ppe_instructions": [
                "🧤 Wear rubber gloves",
                "😷 Wear N95 mask",
                "🥽 Wear goggles",
                "🥼 Wear long sleeves",
                "🥾 Wear rubber boots"
            ],
            "application_time": "Before 10 AM or after 4 PM",
            "weather_warning": "Do not spray if rain expected within 4 hours. Avoid windy days.",
            "video_links": [
                {
                    "language": "Hindi",
                    "title": "Fall Armyworm Control in Maize - फॉल आर्मीवर्म नियंत्रण",
                    "youtube_url": "https://www.youtube.com/results?search_query=fall+armyworm+control+hindi",
                    "category": "how_to_spray"
                },
                {
                    "language": "Hindi",
                    "title": "Safe Pesticide Application - कीटनाशक सुरक्षा",
                    "youtube_url": "https://www.youtube.com/results?search_query=pesticide+safety+hindi+farmer",
                    "category": "safety"
                }
            ],
            "emergency_contact": "National Poison Control: 1800-180-1551"
        };
    }
}

export default new PestScanService();
