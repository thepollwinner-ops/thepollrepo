# Poll Winner - Admin Panel

A complete web-based administration panel for managing the Poll Winner mobile application.

## Features

### 📊 Dashboard
- Platform statistics overview
- Visual charts for analytics
- Quick stats cards (Users, Polls, Revenue, etc.)
- Pending withdrawals alert

### 📋 Poll Management
- View all polls (active and closed)
- Create new polls with custom options
- Set poll results
- Automatic winner calculation and money distribution

### 👥 User Management
- View all registered users
- User details (ID, email, name, UPI)
- Registration dates

### 💳 Transaction Monitoring
- View all platform transactions
- Filter by type (Purchase, Win, Withdrawal)
- Transaction details with amounts and status

### 💸 Withdrawal Management
- Approve/reject withdrawal requests
- View pending withdrawals separately
- 10% fee calculation
- UPI details for manual transfer

## Tech Stack

- **React** 18.2.0
- **React Router DOM** 6.20.0
- **Axios** for API calls
- **Recharts** for analytics visualization
- **CSS** for styling

## Installation

```bash
cd /app/admin-panel
yarn install
```

## Running the Admin Panel

```bash
# Development mode
yarn start

# The app will open at http://localhost:3001
# (Different port from mobile app which uses 3000)
```

## Default Admin Credentials

```
Email: admin@pollwinner.com
Password: admin123
```

## Features Guide

### 1. Login
- Use admin credentials to login
- JWT token stored in localStorage
- Auto-redirect to dashboard on success

### 2. Dashboard
- Overview of platform statistics
- Visual representation with charts
- Quick access to pending actions

### 3. Creating a Poll
1. Click "Create New Poll" from Polls page
2. Fill in poll details:
   - Title
   - Description  
   - Price per vote
   - Options (minimum 2, can add more)
3. Click "Create Poll"
4. Poll becomes immediately available to mobile users

### 4. Setting Poll Result
1. Go to Polls page
2. Click "Set Result" on active poll
3. Select winning option
4. Confirm
5. System automatically:
   - Closes the poll
   - Calculates winnings
   - Distributes money to winners
   - Updates wallet balances

### 5. Managing Withdrawals
1. Go to Withdrawals page
2. View pending requests
3. Check user UPI ID and amount
4. **Approve**: 
   - Deducts from user wallet
   - Shows net amount to transfer
   - You manually send money to UPI
5. **Reject**: 
   - Provide reason
   - User can request again

## API Integration

The admin panel connects to backend at:
```
http://localhost:8001/api
```

Configured in `.env` file:
```
REACT_APP_API_URL=http://localhost:8001/api
```

## Security

- JWT-based authentication
- Tokens stored in localStorage
- Auto-logout on token expiry
- Protected routes (requires login)

## Deployment

### Build for Production

```bash
yarn build
```

This creates an optimized build in the `build/` folder.

### Deploy to Server

1. Build the project
2. Copy `build/` folder contents to web server
3. Configure web server to serve React app
4. Update `.env` with production API URL

## Troubleshooting

### Cannot login
- Verify backend is running on port 8001
- Check admin credentials in database
- Check browser console for errors

### Data not loading
- Verify JWT token is valid
- Check network tab for API responses
- Ensure backend APIs are accessible

### CORS errors
- Backend has CORS middleware enabled
- Check backend CORS configuration

## File Structure

```
admin-panel/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Layout.js
│   │   └── Layout.css
│   ├── context/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── Polls.js
│   │   ├── CreatePoll.js
│   │   ├── Users.js
│   │   ├── Transactions.js
│   │   ├── Withdrawals.js
│   │   ├── Login.js
│   │   └── Login.css
│   ├── App.js
│   ├── index.js
│   └── index.css
├── .env
├── package.json
└── README.md
```

## Support

For issues or questions, refer to the main project documentation.
