# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var visitorId = 'user_' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: visitorId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: visitorId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + visitorId);
"
```

## Step 2: Test Backend API
```bash
# Test auth endpoint
curl -X GET "http://localhost:3000/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test protected endpoints
curl -X GET "http://localhost:3000/api/polls" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Step 3: Browser Testing
```javascript
// Set cookie and navigate
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "localhost",
    "path": "/",
    "httpOnly": true,
    "secure": false,
    "sameSite": "Lax"
}]);
await page.goto("http://localhost:3000");
```

## MongoDB ID Handling
- Use custom `user_id` field and ignore MongoDB's `_id`
- Always exclude `_id` from queries with `{"_id": 0}`

## Checklist
- [ ] User document has `user_id` field
- [ ] Session `user_id` matches `users.user_id`
- [ ] All queries exclude `_id` with `{"_id": 0}`
- [ ] API returns user data (not 401/404)
- [ ] Mobile app loads dashboard (not login page)
