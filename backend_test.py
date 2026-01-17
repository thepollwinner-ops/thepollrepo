#!/usr/bin/env python3
"""
Backend API Testing for The Poll Winner Application
Tests user authentication, poll APIs, wallet APIs, and payment callback
"""

import requests
import json
import uuid
from datetime import datetime
import sys
import os

# Backend URL from environment
BACKEND_URL = "http://localhost:8001/api"

class UserAPITester:
    def __init__(self):
        self.session_token = None
        self.user_data = None
        self.test_email = f"testapi_{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "test123"
        self.test_name = "Test User API"
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_user_registration(self):
        """Test POST /api/auth/register"""
        try:
            payload = {
                "email": self.test_email,
                "password": self.test_password,
                "name": self.test_name
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/register", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "user_id" in data and "email" in data:
                    self.user_data = data
                    # Extract session token from cookies
                    cookies = response.cookies
                    if "session_token" in cookies:
                        self.session_token = cookies["session_token"]
                    self.log_result("User Registration", True, f"Successfully registered user: {data['email']}")
                    return True
                else:
                    self.log_result("User Registration", False, "Invalid response format", {"response": data})
                    return False
            else:
                self.log_result("User Registration", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("User Registration", False, f"Exception: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test POST /api/auth/login"""
        if not self.user_data:
            self.log_result("User Login", False, "No user data available for login test")
            return False
            
        try:
            payload = {
                "email": self.test_email,
                "password": self.test_password
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "user_id" in data and data["user_id"] == self.user_data["user_id"]:
                    # Update session token from login
                    cookies = response.cookies
                    if "session_token" in cookies:
                        self.session_token = cookies["session_token"]
                    self.log_result("User Login", True, f"Successfully logged in user: {data['email']}")
                    return True
                else:
                    self.log_result("User Login", False, "Invalid response or user mismatch", {"response": data})
                    return False
            else:
                self.log_result("User Login", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("User Login", False, f"Exception: {str(e)}")
            return False
    
    def test_get_current_user(self):
        """Test GET /api/auth/me"""
        if not self.session_token:
            self.log_result("Get Current User", False, "No session token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "user_id" in data and "email" in data:
                    self.log_result("Get Current User", True, f"Successfully retrieved user info: {data['email']}")
                    return True
                else:
                    self.log_result("Get Current User", False, "Invalid response format", {"response": data})
                    return False
            else:
                self.log_result("Get Current User", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Get Current User", False, f"Exception: {str(e)}")
            return False
    
    def test_get_polls(self):
        """Test GET /api/polls"""
        try:
            response = requests.get(f"{BACKEND_URL}/polls")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Polls", True, f"Successfully retrieved {len(data)} polls")
                    return data
                else:
                    self.log_result("Get Polls", False, "Response is not a list", {"response": data})
                    return []
            else:
                self.log_result("Get Polls", False, f"HTTP {response.status_code}", {"response": response.text})
                return []
                
        except Exception as e:
            self.log_result("Get Polls", False, f"Exception: {str(e)}")
            return []
    
    def test_get_specific_poll(self, poll_id):
        """Test GET /api/polls/{poll_id}"""
        try:
            response = requests.get(f"{BACKEND_URL}/polls/{poll_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "poll_id" in data and data["poll_id"] == poll_id:
                    self.log_result("Get Specific Poll", True, f"Successfully retrieved poll: {data.get('title', 'Unknown')}")
                    return data
                else:
                    self.log_result("Get Specific Poll", False, "Invalid poll data", {"response": data})
                    return None
            elif response.status_code == 404:
                self.log_result("Get Specific Poll", False, "Poll not found", {"poll_id": poll_id})
                return None
            else:
                self.log_result("Get Specific Poll", False, f"HTTP {response.status_code}", {"response": response.text})
                return None
                
        except Exception as e:
            self.log_result("Get Specific Poll", False, f"Exception: {str(e)}")
            return None
    
    def test_purchase_votes(self, poll_id, vote_count=1, option_id=None):
        """Test POST /api/polls/{poll_id}/purchase"""
        if not self.session_token:
            self.log_result("Purchase Votes", False, "No session token available")
            return None
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            payload = {
                "poll_id": poll_id,
                "vote_count": vote_count
            }
            if option_id:
                payload["option_id"] = option_id
            
            response = requests.post(f"{BACKEND_URL}/polls/{poll_id}/purchase", 
                                   json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "order_id" in data:
                    # Check if it's a real Cashfree response or fallback
                    if data.get("payment_session_id"):
                        self.log_result("Purchase Votes", True, 
                                      f"Cashfree order created successfully. Order ID: {data['order_id']}")
                    else:
                        self.log_result("Purchase Votes", True, 
                                      f"Payment auto-approved (fallback). Order ID: {data['order_id']}")
                    return data
                else:
                    self.log_result("Purchase Votes", False, "Invalid response format", {"response": data})
                    return None
            else:
                self.log_result("Purchase Votes", False, f"HTTP {response.status_code}", {"response": response.text})
                return None
                
        except Exception as e:
            self.log_result("Purchase Votes", False, f"Exception: {str(e)}")
            return None
    
    def test_get_wallet(self):
        """Test GET /api/wallet"""
        if not self.session_token:
            self.log_result("Get Wallet", False, "No session token available")
            return None
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(f"{BACKEND_URL}/wallet", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "wallet_id" in data and "balance" in data:
                    self.log_result("Get Wallet", True, f"Wallet balance: ₹{data['balance']}")
                    return data
                else:
                    self.log_result("Get Wallet", False, "Invalid wallet format", {"response": data})
                    return None
            else:
                self.log_result("Get Wallet", False, f"HTTP {response.status_code}", {"response": response.text})
                return None
                
        except Exception as e:
            self.log_result("Get Wallet", False, f"Exception: {str(e)}")
            return None
    
    def test_get_transactions(self):
        """Test GET /api/transactions"""
        if not self.session_token:
            self.log_result("Get Transactions", False, "No session token available")
            return []
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(f"{BACKEND_URL}/transactions", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Transactions", True, f"Retrieved {len(data)} transactions")
                    return data
                else:
                    self.log_result("Get Transactions", False, "Response is not a list", {"response": data})
                    return []
            else:
                self.log_result("Get Transactions", False, f"HTTP {response.status_code}", {"response": response.text})
                return []
                
        except Exception as e:
            self.log_result("Get Transactions", False, f"Exception: {str(e)}")
            return []
    
    def test_get_my_polls(self):
        """Test GET /api/my-polls"""
        if not self.session_token:
            self.log_result("Get My Polls", False, "No session token available")
            return []
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(f"{BACKEND_URL}/my-polls", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get My Polls", True, f"Retrieved {len(data)} poll participations")
                    return data
                else:
                    self.log_result("Get My Polls", False, "Response is not a list", {"response": data})
                    return []
            else:
                self.log_result("Get My Polls", False, f"HTTP {response.status_code}", {"response": response.text})
                return []
                
        except Exception as e:
            self.log_result("Get My Polls", False, f"Exception: {str(e)}")
            return []
    
    def test_payment_callback(self):
        """Test GET /api/payment/callback"""
        try:
            # Test the callback endpoint with sample parameters
            params = {
                "poll_id": "test_poll_123",
                "order_id": "test_order_123", 
                "user_id": "test_user_123",
                "vote_count": "1",
                "option_id": "test_option_123"
            }
            
            response = requests.get(f"{BACKEND_URL.replace('/api', '')}/api/payment/callback", 
                                  params=params, allow_redirects=False)
            
            # Should redirect (302) or return HTML
            if response.status_code == 302:
                location = response.headers.get("location", "")
                if "?payment=success" in location:
                    self.log_result("Payment Callback", True, "Callback redirects correctly with ?payment=success")
                    return True
                elif "?payment=pending" in location:
                    self.log_result("Payment Callback", True, "Callback redirects with ?payment=pending (expected for invalid data)")
                    return True
                else:
                    self.log_result("Payment Callback", False, f"Unexpected redirect: {location}")
                    return False
            elif response.status_code == 200:
                # HTML response with redirect script
                if "payment=pending" in response.text or "payment=success" in response.text:
                    self.log_result("Payment Callback", True, "Callback returns HTML with payment status")
                    return True
                else:
                    self.log_result("Payment Callback", False, "HTML response missing payment status")
                    return False
            else:
                self.log_result("Payment Callback", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Payment Callback", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for Poll Winner Application")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # 1. User Authentication Flow
        print("\n📋 Testing User Authentication Flow...")
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        
        # 2. Poll APIs
        print("\n📊 Testing Poll APIs...")
        polls = self.test_get_polls()
        
        # Test specific poll if any exist
        if polls:
            poll_id = polls[0]["poll_id"]
            poll_data = self.test_get_specific_poll(poll_id)
            
            # Test purchase votes
            if poll_data and poll_data.get("options"):
                option_id = poll_data["options"][0]["option_id"]
                self.test_purchase_votes(poll_id, vote_count=1, option_id=option_id)
        else:
            self.log_result("Poll Tests", False, "No polls available for testing")
        
        # 3. Wallet APIs
        print("\n💰 Testing Wallet APIs...")
        self.test_get_wallet()
        self.test_get_transactions()
        self.test_get_my_polls()
        
        # 4. Payment Callback
        print("\n💳 Testing Payment Callback...")
        self.test_payment_callback()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.test_results if r["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        return self.test_results

def main():
    """Main test execution"""
    tester = UserAPITester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n📁 Detailed results saved to: /app/backend_test_results.json")
    
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