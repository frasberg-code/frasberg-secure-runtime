#!/usr/bin/env python3
"""
Sofia Console Backend API Test Suite
Tests all backend endpoints as specified in the review request
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL from frontend .env
BACKEND_URL = "https://intellichat-173.preview.emergentagent.com"

class SofiaBackendTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.results = []
        
    def log_result(self, test_name, success, details, response_data=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_health_check(self):
        """Test 1: Health Check - GET /api/"""
        try:
            response = self.session.get(f"{self.base_url}/api/")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result("Health Check", True, f"Status: {data.get('status')}", data)
                else:
                    self.log_result("Health Check", False, f"Unexpected status: {data.get('status')}", data)
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
    
    def test_chat_api(self):
        """Test 2: Chat API - POST /api/chat"""
        try:
            payload = {
                "session_id": f"test-session-{uuid.uuid4()}",
                "message": "Hello Sofia, how are you today?",
                "model": "gpt-4o",
                "provider": "openai"
            }
            
            response = self.session.post(f"{self.base_url}/api/chat", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "content" in data["message"]:
                    content = data["message"]["content"]
                    self.log_result("Chat API", True, f"Got AI response: {content[:100]}...", {"response_length": len(content)})
                else:
                    self.log_result("Chat API", False, "Missing message content in response", data)
            else:
                self.log_result("Chat API", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Chat API", False, f"Exception: {str(e)}")
    
    def test_get_conversations(self):
        """Test 3: Get Conversations - GET /api/conversations"""
        try:
            response = self.session.get(f"{self.base_url}/api/conversations")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Conversations", True, f"Retrieved {len(data)} conversations", {"count": len(data)})
                else:
                    self.log_result("Get Conversations", False, "Response is not a list", data)
            else:
                self.log_result("Get Conversations", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get Conversations", False, f"Exception: {str(e)}")
    
    def test_get_voices(self):
        """Test 4: Get Voices - GET /api/voices"""
        try:
            response = self.session.get(f"{self.base_url}/api/voices")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    voice_names = [voice.get("name", "Unknown") for voice in data]
                    self.log_result("Get Voices", True, f"Retrieved {len(data)} voices: {', '.join(voice_names)}", {"voices": voice_names})
                else:
                    self.log_result("Get Voices", False, "No voices returned or invalid format", data)
            else:
                self.log_result("Get Voices", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get Voices", False, f"Exception: {str(e)}")
    
    def test_sofia_core_sync_status(self):
        """Test 5: Sofia Core Sync Status - GET /api/admin/sofia-core/sync/status"""
        try:
            response = self.session.get(f"{self.base_url}/api/admin/sofia-core/sync/status")
            
            if response.status_code == 200:
                data = response.json()
                # Check for expected fields in sync status
                expected_fields = ["files_synced", "files_failed"]
                has_expected = any(field in data for field in expected_fields)
                
                if has_expected:
                    files_synced = data.get("files_synced", 0)
                    files_failed = data.get("files_failed", 0)
                    self.log_result("Sofia Core Sync Status", True, f"Synced: {files_synced}, Failed: {files_failed}", data)
                else:
                    self.log_result("Sofia Core Sync Status", False, "Missing expected sync status fields", data)
            else:
                self.log_result("Sofia Core Sync Status", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Sofia Core Sync Status", False, f"Exception: {str(e)}")
    
    def test_sofia_core_files(self):
        """Test 6: Sofia Core Files - GET /api/admin/sofia-core/files"""
        try:
            response = self.session.get(f"{self.base_url}/api/admin/sofia-core/files")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Sofia Core Files", True, f"Retrieved {len(data)} files", {"file_count": len(data)})
                else:
                    self.log_result("Sofia Core Files", False, "Response is not a list", data)
            else:
                self.log_result("Sofia Core Files", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Sofia Core Files", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Sofia Console Backend API Tests")
        print(f"📍 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run all tests
        self.test_health_check()
        self.test_chat_api()
        self.test_get_conversations()
        self.test_get_voices()
        self.test_sofia_core_sync_status()
        self.test_sofia_core_files()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r['success'])
        failed = len(self.results) - passed
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/len(self.results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        return passed, failed

def main():
    """Main test execution"""
    tester = SofiaBackendTester(BACKEND_URL)
    passed, failed = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()