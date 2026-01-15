# Admin Panel API Guide

## Admin Credentials
```
Email: admin@pollwinner.com
Password: admin123
```

## Authentication

### Login
```bash
curl -X POST http://localhost:8001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pollwinner.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer"
}
```

**Save the token** and use it in all subsequent requests as:
```
Authorization: Bearer <access_token>
```

---

## Poll Management

### 1. Get All Polls
```bash
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:8001/api/admin/polls \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Create New Poll
```bash
curl -X POST http://localhost:8001/api/admin/polls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Best Cricket Team 2025?",
    "description": "Vote for your favorite cricket team",
    "options": [
      {"text": "India"},
      {"text": "Australia"},
      {"text": "England"},
      {"text": "South Africa"}
    ],
    "price_per_vote": 2.0
  }'
```

### 3. Update Poll
```bash
curl -X PUT http://localhost:8001/api/admin/polls/poll_12345 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description",
    "options": [
      {"text": "Option 1"},
      {"text": "Option 2"}
    ],
    "price_per_vote": 1.5
  }'
```

### 4. Set Poll Result (IMPORTANT!)
**This triggers automatic winner calculation and money distribution!**

```bash
# First, get the poll to see option IDs
curl http://localhost:8001/api/polls/poll_12345

# Then set the winning option
curl -X POST http://localhost:8001/api/admin/polls/poll_12345/result \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "winning_option_id": "opt_abc123"
  }'
```

**What happens when you set result:**
- Poll status changes to "closed"
- System calculates all losing votes' money
- Distributes money equally among winning votes
- Updates all winners' wallet balances
- Creates transaction records

---

## User Management

### 1. Get All Users
```bash
curl -X GET http://localhost:8001/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

**Response includes:**
- User ID, email, name
- UPI ID (if provided)
- Registration date

### 2. Get All Transactions
```bash
curl -X GET http://localhost:8001/api/admin/transactions \
  -H "Authorization: Bearer $TOKEN"
```

**Transaction Types:**
- `purchase` - User bought votes
- `win` - User won money from poll
- `withdrawal` - User withdrew money

---

## Withdrawal Management

### 1. Get All Withdrawal Requests
```bash
curl -X GET http://localhost:8001/api/admin/withdrawals \
  -H "Authorization: Bearer $TOKEN"
```

**Statuses:**
- `pending` - Awaiting approval
- `approved` - Processed
- `rejected` - Declined

### 2. Approve Withdrawal
```bash
curl -X PUT http://localhost:8001/api/admin/withdrawals/withdrawal_12345/approve \
  -H "Authorization: Bearer $TOKEN"
```

**What happens on approval:**
- Amount deducted from user's wallet
- Withdrawal status changed to "approved"
- Transaction record created
- Admin should manually send money to user's UPI

### 3. Reject Withdrawal
```bash
curl -X PUT "http://localhost:8001/api/admin/withdrawals/withdrawal_12345/reject?notes=Insufficient%20documents" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Analytics Dashboard

### Get Platform Statistics
```bash
curl -X GET http://localhost:8001/api/admin/analytics \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "total_users": 150,
  "total_polls": 25,
  "active_polls": 8,
  "pending_withdrawals": 5,
  "total_revenue": 15000.0
}
```

---

## Common Workflows

### Workflow 1: Create and Close a Poll

1. **Create Poll**
```bash
curl -X POST http://localhost:8001/api/admin/polls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "IPL 2025 Winner",
    "description": "Which team will win?",
    "options": [
      {"text": "MI"},
      {"text": "CSK"},
      {"text": "RCB"}
    ],
    "price_per_vote": 1.0
  }'
```

2. **Wait for users to vote**

3. **Set Result** (when poll ends)
```bash
# Use the winning option_id from step 1
curl -X POST http://localhost:8001/api/admin/polls/poll_abc/result \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"winning_option_id": "opt_xyz"}'
```

### Workflow 2: Process Withdrawals

1. **Check pending withdrawals**
```bash
curl -X GET http://localhost:8001/api/admin/withdrawals \
  -H "Authorization: Bearer $TOKEN"
```

2. **Review each request** (check UPI ID, amount, user history)

3. **Approve or Reject**
```bash
# Approve
curl -X PUT http://localhost:8001/api/admin/withdrawals/w_123/approve \
  -H "Authorization: Bearer $TOKEN"

# OR Reject
curl -X PUT "http://localhost:8001/api/admin/withdrawals/w_123/reject?notes=Invalid%20UPI" \
  -H "Authorization: Bearer $TOKEN"
```

4. **Send money to user's UPI** (manually via payment app)

---

## Testing Scenarios

### Test Winner Calculation

1. Create a test poll
2. Login as 2-3 different users
3. Have them vote on different options
4. Set the result for one option
5. Check winners' wallets - they should receive money!

Example:
- User A votes 10 times on "Option 1" (₹10)
- User B votes 5 times on "Option 2" (₹5)
- Admin declares "Option 1" as winner
- User A receives ₹5 in wallet (all of User B's money)

---

## API Testing Tools

### Using Postman
1. Import the APIs into Postman
2. Create an environment variable for `TOKEN`
3. Use `{{TOKEN}}` in Authorization header

### Using curl with saved token
```bash
# Save token once
TOKEN="eyJhbGci..."

# Use in all requests
curl -H "Authorization: Bearer $TOKEN" http://localhost:8001/api/admin/polls
```

---

## Important Notes

1. **JWT Token Expiry**: Tokens expire after 7 days. Login again if you get 401 errors.

2. **Winner Calculation**: When you set a poll result, the system automatically:
   - Collects all losing votes' money
   - Divides it among winning votes
   - Credits winners' wallets
   - Creates transaction records

3. **Withdrawal Flow**:
   - User requests withdrawal from mobile app
   - You approve/reject from admin panel
   - On approval: money deducted from wallet
   - You manually transfer to their UPI

4. **Poll Status**:
   - `active` - Users can vote
   - `closed` - Result declared, no more voting

---

## Security Best Practices

1. Keep JWT token secure
2. Don't share admin credentials
3. Change default password in production
4. Use HTTPS in production
5. Verify UPI IDs before approving withdrawals
6. Monitor suspicious voting patterns

---

## Need Help?

If you need a web-based admin panel UI instead of using APIs, let me know!
I can build a complete React-based admin dashboard with:
- Login page
- Poll management interface
- User management
- Withdrawal approval system
- Analytics dashboard with charts
