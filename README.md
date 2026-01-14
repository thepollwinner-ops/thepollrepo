# The Poll Winner - Mobile Polling App with Real Money

A comprehensive mobile application where users can vote on polls, win real money, and manage their cash wallet.

## Features

### Mobile App Features
- 🔐 **Google Social Login** - Easy authentication via Emergent Auth
- 📊 **Poll Listing** - Browse active and closed polls
- 🗳️ **Vote System** - Purchase votes and cast them on polls
- 💰 **Cash Wallet** - Store winnings and manage balance
- 💸 **Withdrawals** - Request withdrawals with 10% fee (UPI-based)
- 📜 **Transaction History** - Track all purchases, winnings, and withdrawals
- 🏆 **Win Distribution** - Automatic distribution of losing money to winners

### Admin Panel Features (Web)
- 🔑 **Admin Authentication** - Secure JWT-based login
- ➕ **Poll Management** - Create, update, and close polls
- 🎯 **Result Declaration** - Set winning option and trigger automatic distribution
- 👥 **User Management** - View all users and their details
- 💳 **Transaction Monitoring** - Track all platform transactions
- ✅ **Withdrawal Approval** - Approve or reject withdrawal requests
- 📈 **Analytics Dashboard** - View platform statistics

## Tech Stack

### Mobile App (Expo/React Native)
- **Framework**: Expo Router (File-based routing)
- **State Management**: Zustand + React Context
- **Navigation**: React Navigation (Bottom Tabs)
- **UI**: React Native Elements + Custom Components
- **API Client**: Axios
- **Authentication**: Emergent Google OAuth

### Backend (FastAPI)
- **Framework**: FastAPI
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT for admin, Session tokens for users
- **Payment Gateway**: Cashfree (Test mode)
- **Password Hashing**: bcrypt

## Setup Instructions

### Prerequisites
- Node.js 16+ and Yarn
- Python 3.8+
- MongoDB (local or Atlas)
- Cashfree test account

### Environment Variables

**Backend (.env)**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CASHFREE_CLIENT_ID=TEST432972d3f54ef1104fb751d37d279234
CASHFREE_CLIENT_SECRET=TEST51637902e758909219e83f5678b467a4afe7ab8c
CASHFREE_ENV=TEST
SECRET_KEY=your-secret-key-change-in-production
```

**Frontend (.env)**
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
```

### Installation

1. **Install Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

2. **Install Frontend Dependencies**
```bash
cd frontend
yarn install
```

3. **Start Services**
```bash
# Backend (from /app/backend)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (from /app/frontend)
yarn start
```

## API Documentation

### User APIs

#### Authentication
- `POST /api/auth/google/session` - Exchange session_id for user data
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

#### Polls
- `GET /api/polls` - Get all active polls
- `GET /api/polls/{poll_id}` - Get specific poll
- `POST /api/polls/{poll_id}/purchase` - Purchase votes for poll
- `POST /api/polls/{poll_id}/vote` - Cast votes on poll

#### Wallet
- `GET /api/wallet` - Get wallet balance
- `GET /api/transactions` - Get transaction history
- `POST /api/withdrawal/request` - Request withdrawal
- `GET /api/withdrawal/history` - Get withdrawal history
- `PUT /api/profile/upi` - Update UPI ID

### Admin APIs

#### Authentication
- `POST /api/auth/admin/register` - Register admin
- `POST /api/auth/admin/login` - Admin login

#### Poll Management
- `POST /api/admin/polls` - Create poll
- `PUT /api/admin/polls/{poll_id}` - Update poll
- `POST /api/admin/polls/{poll_id}/result` - Set poll result (triggers winner calculation)
- `GET /api/admin/polls` - Get all polls

#### User Management
- `GET /api/admin/users` - Get all users
- `GET /api/admin/transactions` - Get all transactions
- `GET /api/admin/withdrawals` - Get all withdrawal requests
- `PUT /api/admin/withdrawals/{withdrawal_id}/approve` - Approve withdrawal
- `PUT /api/admin/withdrawals/{withdrawal_id}/reject` - Reject withdrawal
- `GET /api/admin/analytics` - Get platform analytics

## How It Works

### Poll Flow
1. Admin creates a poll with multiple options
2. Users browse active polls
3. Users purchase votes (₹1 per vote default)
4. Payment is processed via Cashfree
5. Users cast their votes on chosen option
6. Admin declares result
7. System automatically distributes losing money to winners

### Winner Calculation Logic
```
Total Losing Amount = Sum of all losing votes × price_per_vote
Total Winning Votes = Sum of all winning votes
Per Vote Share = Total Losing Amount / Total Winning Votes

For each winner:
  Winning Amount = Their Votes × Per Vote Share
  Credit to wallet
```

### Withdrawal Process
1. User requests withdrawal with UPI ID
2. System calculates 10% fee
3. Request goes to admin for approval
4. Admin approves/rejects
5. On approval, amount deducted from wallet
6. User receives money to UPI

## Testing

### Register Admin
```bash
curl -X POST http://localhost:8001/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pollwinner.com",
    "name": "Admin",
    "password": "admin123"
  }'
```

### Create Poll (as Admin)
```bash
curl -X POST http://localhost:8001/api/admin/polls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Which team will win IPL 2025?",
    "description": "Place your votes",
    "options": [
      {"text": "Mumbai Indians"},
      {"text": "Chennai Super Kings"},
      {"text": "RCB"},
      {"text": "KKR"}
    ],
    "price_per_vote": 1.0
  }'
```

### Get Polls
```bash
curl http://localhost:8001/api/polls
```

## Database Collections

### users
- user_id (custom ID)
- email
- name
- picture
- upi_id
- created_at

### admins
- admin_id
- email
- name
- password_hash
- created_at

### polls
- poll_id
- title
- description
- options (array)
- price_per_vote
- status (active/closed)
- result_option_id
- created_at
- closed_at

### votes
- vote_id
- poll_id
- user_id
- option_id
- vote_count
- amount_paid
- transaction_id
- created_at

### wallets
- wallet_id
- user_id
- balance
- updated_at

### transactions
- transaction_id
- user_id
- type (purchase/win/withdrawal)
- amount
- status
- poll_id
- cashfree_order_id
- created_at

### withdrawals
- withdrawal_id
- user_id
- amount
- fee (10%)
- net_amount
- upi_id
- status (pending/approved/rejected)
- admin_notes
- created_at
- processed_at

### user_sessions
- user_id
- session_token
- expires_at
- created_at

## Security Features

- JWT-based admin authentication
- Session-based user authentication
- HTTP-only cookies
- Password hashing with bcrypt
- Timezone-aware datetime handling
- CORS protection
- Input validation with Pydantic

## Payment Integration

**Cashfree Test Mode**
- Environment: Sandbox
- Test Card: 4706131211212123
- CVV: 123
- OTP: 111000
- Test UPI: testsuccess@gocash

## Future Enhancements

1. Real-time poll updates using WebSockets
2. Push notifications for poll results
3. Leaderboard and user rankings
4. Multiple payment methods
5. Referral system
6. Poll categories and filters
7. Social sharing
8. Mobile app screenshots in polls
9. Admin dashboard with charts
10. Automated withdrawal processing

## Support

For issues or questions, contact support@pollwinner.com

## License

Proprietary - All Rights Reserved
