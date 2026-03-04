#!/usr/bin/env python3
"""
Flask web application for Commodity Market Analyzer
"""

from flask import Flask, render_template, request, jsonify
from commodity_analyzer import CommodityAnalyzer
import config
import traceback

app = Flask(__name__)
analyzer = CommodityAnalyzer(config.API_KEY, config.AWS_REGION)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        state = data.get('state')
        district = data.get('district')
        commodity = data.get('commodity')
        
        result = analyzer.get_recommendations(
            state=state if state else None,
            district=district if district else None,
            commodity=commodity if commodity else None
        )
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/fetch-data', methods=['POST'])
def fetch_data():
    try:
        data = request.json
        state = data.get('state')
        district = data.get('district')
        commodity = data.get('commodity')
        limit = data.get('limit', 50)
        
        result = analyzer.fetch_commodity_data(
            state=state if state else None,
            district=district if district else None,
            commodity=commodity if commodity else None,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
