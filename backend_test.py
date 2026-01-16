#!/usr/bin/env python3
"""
Backend API Testing for The Poll Winner Application
Tests admin authentication, poll management, and public endpoints
"""

import requests
import json
import uuid
from datetime import datetime
import sys
import os

# Backend URL from environment
BACKEND_URL = "https://vote-cash.preview.emergentagent.com/api"

class PollWinnerAPITester:
    def __init__(self):
        self.admin_token = None
        self.admin_email = f"admin_{uuid.uuid4().hex[:8]}@test.com"
        self.admin_password = "TestAdmin123!"
        self.created_poll_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_admin_register(self):
        """Test admin registration"""
        try:
            payload = {
                "email": self.admin_email,
                "name": "Test Admin",
                "password": self.admin_password
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/admin/register", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "token_type" in data:
                    self.admin_token = data["access_token"]
                    self.log_result("Admin Registration", True, "Admin registered successfully")
                    return True
                else:
                    self.log_result("Admin Registration", False, "Missing token in response", data)
                    return False
            else:
                self.log_result("Admin Registration", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Registration", False, f"Exception: {str(e)}")
            return False
    
    def test_admin_login(self):
        """Test admin login"""
        try:
            payload = {
                "email": self.admin_email,
                "password": self.admin_password
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/admin/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "token_type" in data:
                    self.admin_token = data["access_token"]
                    self.log_result("Admin Login", True, "Admin login successful")
                    return True
                else:
                    self.log_result("Admin Login", False, "Missing token in response", data)
                    return False
            else:
                self.log_result("Admin Login", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Login", False, f"Exception: {str(e)}")
            return False
    
    def test_create_poll(self):
        """Test poll creation (admin only)"""
        if not self.admin_token:
            self.log_result("Create Poll", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            payload = {
                "title": "Test Poll - Who will win the match?",
                "description": "A test poll to check the system functionality",
                "options": [
                    {"text": "Team A"},
                    {"text": "Team B"},
                    {"text": "Draw"}
                ],
                "price_per_vote": 2.0
            }
            
            response = requests.post(f"{BACKEND_URL}/admin/polls", json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "poll_id" in data and "title" in data and "options" in data:
                    self.created_poll_id = data["poll_id"]
                    self.log_result("Create Poll", True, f"Poll created with ID: {self.created_poll_id}")
                    return True
                else:
                    self.log_result("Create Poll", False, "Invalid poll response structure", data)
                    return False
            else:
                self.log_result("Create Poll", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Create Poll", False, f"Exception: {str(e)}")
            return False
    
    def test_get_admin_polls(self):
        """Test getting all polls (admin only)"""
        if not self.admin_token:
            self.log_result("Get Admin Polls", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/admin/polls", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Admin Polls", True, f"Retrieved {len(data)} polls")
                    return True
                else:
                    self.log_result("Get Admin Polls", False, "Response is not a list", data)
                    return False
            else:
                self.log_result("Get Admin Polls", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Get Admin Polls", False, f"Exception: {str(e)}")
            return False
    
    def test_get_public_polls(self):
        """Test getting active polls (public endpoint)"""
        try:
            response = requests.get(f"{BACKEND_URL}/polls")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Public Polls", True, f"Retrieved {len(data)} active polls")
                    return True
                else:
                    self.log_result("Get Public Polls", False, "Response is not a list", data)
                    return False
            else:
                self.log_result("Get Public Polls", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Get Public Polls", False, f"Exception: {str(e)}")
            return False
    
    def test_get_specific_poll(self):
        """Test getting specific poll (public endpoint)"""
        if not self.created_poll_id:
            self.log_result("Get Specific Poll", False, "No poll ID available")
            return False
            
        try:
            response = requests.get(f"{BACKEND_URL}/polls/{self.created_poll_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "poll_id" in data and data["poll_id"] == self.created_poll_id:
                    self.log_result("Get Specific Poll", True, f"Retrieved poll: {data['title']}")
                    return True
                else:
                    self.log_result("Get Specific Poll", False, "Invalid poll data", data)
                    return False
            else:
                self.log_result("Get Specific Poll", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Get Specific Poll", False, f"Exception: {str(e)}")
            return False
    
    def test_set_poll_result(self):
        """Test setting poll result (admin only)"""
        if not self.admin_token or not self.created_poll_id:
            self.log_result("Set Poll Result", False, "Missing admin token or poll ID")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # First get the poll to find a valid option ID
            poll_response = requests.get(f"{BACKEND_URL}/polls/{self.created_poll_id}")
            if poll_response.status_code != 200:
                self.log_result("Set Poll Result", False, "Could not retrieve poll for option ID")
                return False
                
            poll_data = poll_response.json()
            if not poll_data.get("options"):
                self.log_result("Set Poll Result", False, "Poll has no options")
                return False
                
            winning_option_id = poll_data["options"][0]["option_id"]
            
            payload = {
                "winning_option_id": winning_option_id
            }
            
            response = requests.post(f"{BACKEND_URL}/admin/polls/{self.created_poll_id}/result", 
                                   json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "winners_count" in data:
                    self.log_result("Set Poll Result", True, f"Poll result set: {data['message']}")
                    return True
                else:
                    self.log_result("Set Poll Result", False, "Invalid response structure", data)
                    return False
            else:
                self.log_result("Set Poll Result", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Set Poll Result", False, f"Exception: {str(e)}")
            return False
    
    def test_get_analytics(self):
        """Test getting analytics (admin only)"""
        if not self.admin_token:
            self.log_result("Get Analytics", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/admin/analytics", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["total_users", "total_polls", "active_polls", "pending_withdrawals", "total_revenue"]
                if all(field in data for field in expected_fields):
                    self.log_result("Get Analytics", True, f"Analytics retrieved successfully")
                    return True
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_result("Get Analytics", False, f"Missing fields: {missing_fields}", data)
                    return False
            else:
                self.log_result("Get Analytics", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Get Analytics", False, f"Exception: {str(e)}")
            return False
    
    def test_invalid_admin_auth(self):
        """Test invalid admin authentication"""
        try:
            headers = {"Authorization": "Bearer invalid_token"}
            response = requests.get(f"{BACKEND_URL}/admin/polls", headers=headers)
            
            if response.status_code == 401:
                self.log_result("Invalid Admin Auth", True, "Correctly rejected invalid token")
                return True
            else:
                self.log_result("Invalid Admin Auth", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Invalid Admin Auth", False, f"Exception: {str(e)}")
            return False
    
    def test_missing_auth_header(self):
        """Test missing authorization header"""
        try:
            response = requests.get(f"{BACKEND_URL}/admin/polls")
            
            if response.status_code == 401:
                self.log_result("Missing Auth Header", True, "Correctly rejected missing auth")
                return True
            else:
                self.log_result("Missing Auth Header", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Missing Auth Header", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Backend API Tests for Poll Winner")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test sequence based on dependencies
        tests = [
            ("Admin Registration", self.test_admin_register),
            ("Admin Login", self.test_admin_login),
            ("Create Poll", self.test_create_poll),
            ("Get Admin Polls", self.test_get_admin_polls),
            ("Get Public Polls", self.test_get_public_polls),
            ("Get Specific Poll", self.test_get_specific_poll),
            ("Set Poll Result", self.test_set_poll_result),
            ("Get Analytics", self.test_get_analytics),
            ("Invalid Admin Auth", self.test_invalid_admin_auth),
            ("Missing Auth Header", self.test_missing_auth_header)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                success = test_func()
                if success:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log_result(test_name, False, f"Test execution failed: {str(e)}")
                failed += 1
        
        print("=" * 60)
        print(f"📊 Test Summary:")
        print(f"   ✅ Passed: {passed}")
        print(f"   ❌ Failed: {failed}")
        print(f"   📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        return self.test_results

def main():
    """Main test execution"""
    tester = PollWinnerAPITester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open('/app/test_results_backend.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📁 Detailed results saved to: /app/test_results_backend.json")
    
    # Return exit code based on results
    failed_tests = [r for r in results if not r['success']]
    if failed_tests:
        print(f"\n❌ {len(failed_tests)} tests failed")
        return 1
    else:
        print(f"\n✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())