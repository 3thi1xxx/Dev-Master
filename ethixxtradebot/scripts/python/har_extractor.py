#!/usr/bin/env python3
"""
HAR File Extractor for Axiom.trade
Extracts fresh authentication tokens, WebSocket connection details, and patterns
"""

import json
import time
from datetime import datetime
from pathlib import Path

class AxiomHARExtractor:
    def __init__(self, har_file_path):
        self.har_file = har_file_path
        self.extracted_data = {
            'cookies': {},
            'auth_tokens': {},
            'websocket_connections': [],
            'api_requests': [],
            'headers': {},
            'subscription_messages': [],
            'response_patterns': []
        }
        
    def extract_all(self):
        """Extract all valuable data from HAR file"""
        print("🔍 AXIOM.TRADE HAR EXTRACTOR")
        print("=" * 50)
        
        try:
            with open(self.har_file, 'r') as f:
                har_data = json.load(f)
            
            print(f"✅ Loaded HAR file: {len(har_data['log']['entries'])} entries")
            
            # Extract from all entries
            for entry in har_data['log']['entries']:
                url = entry['request']['url']
                
                # Process Axiom-related requests
                if 'axiom.trade' in url:
                    self.process_axiom_request(entry)
                    
            # Summary
            self.print_extraction_summary()
            self.save_extracted_tokens()
            
        except Exception as e:
            print(f"❌ HAR extraction error: {e}")
    
    def process_axiom_request(self, entry):
        """Process individual Axiom request/response"""
        
        request = entry['request']
        response = entry['response']
        url = request['url']
        
        # Extract cookies from requests
        if 'cookies' in request:
            for cookie in request['cookies']:
                if cookie['name'].startswith('auth-'):
                    self.extracted_data['cookies'][cookie['name']] = cookie['value']
                    print(f"🍪 Found auth cookie: {cookie['name']}")
        
        # Extract cookies from response headers
        if 'headers' in response:
            for header in response['headers']:
                if header['name'].lower() == 'set-cookie':
                    cookie_value = header['value']
                    if 'auth-' in cookie_value:
                        print(f"🍪 Response set auth cookie: {cookie_value[:100]}...")
        
        # Extract auth headers
        if 'headers' in request:
            for header in request['headers']:
                if header['name'].lower() in ['authorization', 'cookie']:
                    self.extracted_data['headers'][header['name']] = header['value']
                    if 'eyJ' in header['value']:  # JWT token
                        print(f"🔑 Found JWT in {header['name']}")
        
        # WebSocket upgrade requests
        if any(h['name'].lower() == 'upgrade' and 'websocket' in h['value'].lower() 
               for h in request['headers']):
            ws_data = {
                'url': url,
                'headers': {h['name']: h['value'] for h in request['headers']},
                'response_status': response['status'],
                'timestamp': entry['startedDateTime']
            }
            self.extracted_data['websocket_connections'].append(ws_data)
            print(f"🔌 WebSocket connection: {url}")
        
        # API requests
        if '/api' in url or url.endswith('.json'):
            api_data = {
                'url': url,
                'method': request['method'],
                'headers': {h['name']: h['value'] for h in request['headers']},
                'status': response['status'],
                'timestamp': entry['startedDateTime']
            }
            
            # Extract request body if present
            if 'postData' in request:
                try:
                    api_data['request_body'] = json.loads(request['postData']['text'])
                except:
                    api_data['request_body'] = request['postData']['text']
            
            # Extract response body if present
            if 'content' in response and 'text' in response['content']:
                try:
                    api_data['response_body'] = json.loads(response['content']['text'])
                except:
                    api_data['response_body'] = response['content']['text'][:500] + "..."
            
            self.extracted_data['api_requests'].append(api_data)
            print(f"🌐 API request: {request['method']} {url} -> {response['status']}")
    
    def print_extraction_summary(self):
        """Print summary of extracted data"""
        print("\n🎯 EXTRACTION SUMMARY")
        print("=" * 30)
        
        print(f"🍪 Auth Cookies: {len(self.extracted_data['cookies'])}")
        for name, value in self.extracted_data['cookies'].items():
            print(f"   • {name}: {value[:50]}...")
        
        print(f"\n🔑 Auth Headers: {len(self.extracted_data['headers'])}")
        for name, value in self.extracted_data['headers'].items():
            if 'eyJ' in value:
                print(f"   • {name}: [JWT TOKEN DETECTED]")
            else:
                print(f"   • {name}: {value[:50]}...")
        
        print(f"\n🔌 WebSocket Connections: {len(self.extracted_data['websocket_connections'])}")
        for ws in self.extracted_data['websocket_connections']:
            print(f"   • {ws['url']} (Status: {ws['response_status']})")
        
        print(f"\n🌐 API Requests: {len(self.extracted_data['api_requests'])}")
        successful_apis = [api for api in self.extracted_data['api_requests'] if api['status'] == 200]
        print(f"   • Successful: {len(successful_apis)}")
        
        # Show recent successful API calls
        if successful_apis:
            print("\n✅ Recent Successful API Calls:")
            for api in successful_apis[-3:]:  # Last 3 successful calls
                print(f"   • {api['method']} {api['url']}")
    
    def save_extracted_tokens(self):
        """Save extracted tokens to file for immediate use"""
        
        tokens_file = Path('extracted_axiom_tokens.json')
        
        # Format for immediate use
        tokens_data = {
            'timestamp': time.time(),
            'source': 'HAR_extraction',
            'cookies': self.extracted_data['cookies'],
            'headers': self.extracted_data['headers'],
            'websocket_urls': [ws['url'] for ws in self.extracted_data['websocket_connections']],
            'working_api_endpoints': [api['url'] for api in self.extracted_data['api_requests'] if api['status'] == 200],
            'connection_patterns': {
                'successful_websockets': len([ws for ws in self.extracted_data['websocket_connections'] if ws['response_status'] == 101]),
                'successful_apis': len([api for api in self.extracted_data['api_requests'] if api['status'] == 200])
            }
        }
        
        with open(tokens_file, 'w') as f:
            json.dump(tokens_data, f, indent=2)
        
        print(f"\n💾 Saved extracted tokens to: {tokens_file}")
        
        # Generate quick-use Python variables
        if self.extracted_data['cookies']:
            print("\n🚀 QUICK-USE PYTHON VARIABLES:")
            print("=" * 40)
            
            for name, value in self.extracted_data['cookies'].items():
                var_name = name.replace('-', '_').upper()
                print(f"{var_name} = '{value}'")
            
            print("\n# Update your Python script with these fresh tokens!")

def main():
    har_file = "/Users/DjEthixx/Desktop/Dev/axiom.trade.har"
    
    extractor = AxiomHARExtractor(har_file)
    extractor.extract_all()

if __name__ == "__main__":
    main() 