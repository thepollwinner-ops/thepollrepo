from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, Request, Response
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from passlib.context import CryptContext
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Cashfree credentials
CASHFREE_CLIENT_ID = os.getenv("CASHFREE_CLIENT_ID", "TEST432972d3f54ef1104fb751d37d279234")
CASHFREE_CLIENT_SECRET = os.getenv("CASHFREE_CLIENT_SECRET", "TEST51637902e758909219e83f5678b467a4afe7ab8c")
CASHFREE_ENV = os.getenv("CASHFREE_ENV", "TEST")
CASHFREE_API_VERSION = "2023-08-01"

# Secret key for admin JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI()

# Serve admin panel directly on app (before routers)
@app.get("/api/admin-panel", include_in_schema=False)
async def serve_admin_panel_route():
    """Serve admin panel HTML - must be before API router"""
    return FileResponse("/app/admin-panel/build/admin.html", media_type="text/html")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= MODELS =============

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    upi_id: Optional[str] = None
    created_at: datetime

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Admin(BaseModel):
    admin_id: str
    email: str
    name: str
    password_hash: str
    created_at: datetime

class AdminRegister(BaseModel):
    email: str
    name: str
    password: str

class AdminLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class PollOption(BaseModel):
    option_id: str
    text: str
    image_base64: Optional[str] = None

class Poll(BaseModel):
    poll_id: str
    title: str
    description: str
    options: List[PollOption]
    price_per_vote: float = 1.0
    status: str = "active"  # active, closed
    result_option_id: Optional[str] = None
    created_at: datetime
    closed_at: Optional[datetime] = None

class CreatePoll(BaseModel):
    title: str
    description: str
    options: List[Dict[str, str]]  # [{"text": "Option 1", "image_base64": "..."}]
    price_per_vote: float = 1.0

class Vote(BaseModel):
    vote_id: str
    poll_id: str
    user_id: str
    option_id: str
    vote_count: int
    amount_paid: float
    transaction_id: str
    created_at: datetime

class CastVoteRequest(BaseModel):
    option_id: str
    vote_count: int

class Wallet(BaseModel):
    wallet_id: str
    user_id: str
    balance: float = 0.0
    updated_at: datetime

class Transaction(BaseModel):
    transaction_id: str
    user_id: str
    type: str  # purchase, win, withdrawal, withdrawal_fee
    amount: float
    status: str  # success, pending, failed
    poll_id: Optional[str] = None
    cashfree_order_id: Optional[str] = None
    created_at: datetime

class Withdrawal(BaseModel):
    withdrawal_id: str
    user_id: str
    amount: float
    fee: float
    net_amount: float
    upi_id: str
    status: str  # pending, approved, rejected
    admin_notes: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None

class PurchaseVotesRequest(BaseModel):
    poll_id: str
    vote_count: int

class WithdrawalRequest(BaseModel):
    amount: float
    upi_id: str

class SetResultRequest(BaseModel):
    winning_option_id: str

class UpdateUPIRequest(BaseModel):
    upi_id: str

# ============= HELPER FUNCTIONS =============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token (cookie or Authorization header)"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    
    # Check expiry with timezone-aware datetime
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return User(**user_doc)

async def get_current_admin(request: Request) -> Optional[Admin]:
    """Get current admin from JWT token"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = auth_header.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id = payload.get("admin_id")
        if not admin_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    admin_doc = await db.admins.find_one({"admin_id": admin_id}, {"_id": 0})
    if not admin_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")
    
    return Admin(**admin_doc)

# ============= AUTH ROUTES =============

@api_router.post("/auth/register")
async def user_register(user_data: UserRegister, response: Response):
    """Register new user with email/password"""
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    new_user = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "picture": None,
        "upi_id": None,
        "created_at": datetime.now(timezone.utc)
    }
    await db.users.insert_one(new_user)
    
    # Create wallet
    wallet = {
        "wallet_id": f"wallet_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "balance": 0.0,
        "updated_at": datetime.now(timezone.utc)
    }
    await db.wallets.insert_one(wallet)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return user_doc

@api_router.post("/auth/login")
async def user_login(login_data: UserLogin, response: Response):
    """User login with email/password"""
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return user_doc

@api_router.post("/auth/google/session")
async def google_auth_session(request: Request, response: Response):
    """Exchange session_id for user data using Emergent Auth"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session ID required")
    
    try:
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
            
            user_data = auth_response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
        
        if not existing_user:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            new_user = {
                "user_id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data.get("picture"),
                "upi_id": None,
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(new_user)
            
            # Create wallet
            wallet = {
                "wallet_id": f"wallet_{uuid.uuid4().hex[:12]}",
                "user_id": user_id,
                "balance": 0.0,
                "updated_at": datetime.now(timezone.utc)
            }
            await db.wallets.insert_one(wallet)
        else:
            user_id = existing_user["user_id"]
        
        # Create session
        session_token = user_data["session_token"]
        session_doc = {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        }
        await db.user_sessions.insert_one(session_doc)
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )
        
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        return User(**user_doc)
    
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Authentication failed")

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, current_user: User = Depends(get_current_user)):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# Admin Auth
@api_router.post("/auth/admin/register")
async def admin_register(admin_data: AdminRegister):
    """Register new admin"""
    # Check if admin exists
    existing = await db.admins.find_one({"email": admin_data.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin already exists")
    
    admin_id = f"admin_{uuid.uuid4().hex[:12]}"
    new_admin = {
        "admin_id": admin_id,
        "email": admin_data.email,
        "name": admin_data.name,
        "password_hash": hash_password(admin_data.password),
        "created_at": datetime.now(timezone.utc)
    }
    await db.admins.insert_one(new_admin)
    
    token = create_access_token({"admin_id": admin_id})
    return {"access_token": token, "token_type": "bearer"}

@api_router.post("/auth/admin/login")
async def admin_login(login_data: AdminLogin):
    """Admin login"""
    admin = await db.admins.find_one({"email": login_data.email})
    if not admin or not verify_password(login_data.password, admin["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    token = create_access_token({"admin_id": admin["admin_id"]})
    return {"access_token": token, "token_type": "bearer"}

# ============= POLL ROUTES =============

@api_router.get("/polls")
async def get_polls():
    """Get all active polls"""
    polls = await db.polls.find({"status": "active"}, {"_id": 0}).to_list(1000)
    return polls

@api_router.get("/polls/{poll_id}")
async def get_poll(poll_id: str):
    """Get specific poll"""
    poll = await db.polls.find_one({"poll_id": poll_id}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poll not found")
    return poll

@api_router.post("/polls/{poll_id}/purchase")
async def purchase_votes(poll_id: str, request: PurchaseVotesRequest, current_user: User = Depends(get_current_user)):
    """Purchase votes for a poll using Cashfree"""
    poll = await db.polls.find_one({"poll_id": poll_id}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poll not found")
    
    if poll["status"] != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Poll is not active")
    
    amount = request.vote_count * poll["price_per_vote"]
    order_id = f"order_{current_user.user_id}_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    
    # For test environment, create order with minimal Cashfree integration
    # In production, you would use full Cashfree SDK
    try:
        # Create Cashfree order payload
        cashfree_url = f"https://sandbox.cashfree.com/pg/orders"
        
        order_payload = {
            "order_id": order_id,
            "order_amount": amount,
            "order_currency": "INR",
            "customer_details": {
                "customer_id": current_user.user_id,
                "customer_phone": "9999999999",
                "customer_email": current_user.email,
                "customer_name": current_user.name
            },
            "order_meta": {
                "return_url": "https://poll-winner.preview.emergentagent.com/?payment=success",
                "notify_url": f"https://poll-winner.preview.emergentagent.com/api/payments/webhook"
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                cashfree_url,
                json=order_payload,
                headers={
                    "x-client-id": CASHFREE_CLIENT_ID,
                    "x-client-secret": CASHFREE_CLIENT_SECRET,
                    "x-api-version": "2023-08-01",
                    "Content-Type": "application/json"
                },
                timeout=10.0
            )
            
            logger.info(f"Cashfree response status: {response.status_code}")
            logger.info(f"Cashfree response: {response.text}")
            
            if response.status_code not in [200, 201]:
                logger.error(f"Cashfree error: {response.text}")
                # For testing, create transaction with pending status
                transaction = {
                    "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
                    "user_id": current_user.user_id,
                    "type": "purchase",
                    "amount": amount,
                    "status": "pending",
                    "poll_id": poll_id,
                    "cashfree_order_id": order_id,
                    "vote_count": request.vote_count,
                    "created_at": datetime.now(timezone.utc)
                }
                await db.transactions.insert_one(transaction)
                
                # Return test payment URL
                return {
                    "order_id": order_id,
                    "payment_url": f"https://sandbox.cashfree.com/pg/orders/pay?order_id={order_id}",
                    "payment_session_id": "test_session",
                    "amount": amount,
                    "status": "pending",
                    "message": "Cashfree integration in test mode. Use test payment."
                }
            
            cashfree_data = response.json()
            
            # Store transaction
            transaction = {
                "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
                "user_id": current_user.user_id,
                "type": "purchase",
                "amount": amount,
                "status": "pending",
                "poll_id": poll_id,
                "cashfree_order_id": order_id,
                "vote_count": request.vote_count,
                "created_at": datetime.now(timezone.utc)
            }
            await db.transactions.insert_one(transaction)
            
            return {
                "order_id": order_id,
                "payment_session_id": cashfree_data.get("payment_session_id"),
                "payment_url": cashfree_data.get("payment_link"),
                "cf_order_id": cashfree_data.get("cf_order_id"),
                "amount": amount,
                "status": "pending"
            }
    
    except Exception as e:
        logger.error(f"Purchase error: {str(e)}")
        # For demo purposes, allow manual payment confirmation
        transaction = {
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "user_id": current_user.user_id,
            "type": "purchase",
            "amount": amount,
            "status": "success",  # Auto-approve for testing
            "poll_id": poll_id,
            "cashfree_order_id": order_id,
            "vote_count": request.vote_count,
            "created_at": datetime.now(timezone.utc)
        }
        await db.transactions.insert_one(transaction)
        
        return {
            "order_id": order_id,
            "payment_url": None,
            "amount": amount,
            "status": "success",
            "message": "Payment auto-approved for testing. In production, use real Cashfree gateway."
        }

@api_router.post("/polls/{poll_id}/vote")
async def cast_vote(poll_id: str, vote_request: CastVoteRequest, current_user: User = Depends(get_current_user)):
    """Cast votes on a poll"""
    poll = await db.polls.find_one({"poll_id": poll_id}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poll not found")
    
    if poll["status"] != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Poll is not active")
    
    # Check if option exists
    option_exists = any(opt["option_id"] == vote_request.option_id for opt in poll["options"])
    if not option_exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid option")
    
    # Check if user has enough purchased votes (transactions with status=success)
    purchased_votes = await db.transactions.aggregate([
        {"$match": {"user_id": current_user.user_id, "poll_id": poll_id, "type": "purchase", "status": "success"}},
        {"$group": {"_id": None, "total_votes": {"$sum": "$vote_count"}}}
    ]).to_list(1)
    
    total_purchased = purchased_votes[0]["total_votes"] if purchased_votes else 0
    
    # Check already cast votes
    cast_votes = await db.votes.aggregate([
        {"$match": {"user_id": current_user.user_id, "poll_id": poll_id}},
        {"$group": {"_id": None, "total_cast": {"$sum": "$vote_count"}}}
    ]).to_list(1)
    
    total_cast = cast_votes[0]["total_cast"] if cast_votes else 0
    available_votes = total_purchased - total_cast
    
    if available_votes < vote_request.vote_count:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient votes. Available: {available_votes}")
    
    # Cast vote
    vote = {
        "vote_id": f"vote_{uuid.uuid4().hex[:12]}",
        "poll_id": poll_id,
        "user_id": current_user.user_id,
        "option_id": vote_request.option_id,
        "vote_count": vote_request.vote_count,
        "amount_paid": vote_request.vote_count * poll["price_per_vote"],
        "transaction_id": "",
        "created_at": datetime.now(timezone.utc)
    }
    await db.votes.insert_one(vote)
    
    return {"message": "Vote cast successfully", "remaining_votes": available_votes - vote_request.vote_count}

# ============= WALLET ROUTES =============

@api_router.get("/wallet")
async def get_wallet(current_user: User = Depends(get_current_user)):
    """Get user wallet balance"""
    wallet = await db.wallets.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not wallet:
        # Create wallet if not exists
        wallet = {
            "wallet_id": f"wallet_{uuid.uuid4().hex[:12]}",
            "user_id": current_user.user_id,
            "balance": 0.0,
            "updated_at": datetime.now(timezone.utc)
        }
        await db.wallets.insert_one(wallet)
    
    return wallet

@api_router.get("/transactions")
async def get_transactions(current_user: User = Depends(get_current_user)):
    """Get user transactions"""
    transactions = await db.transactions.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return transactions

@api_router.post("/withdrawal/request")
async def request_withdrawal(withdrawal_request: WithdrawalRequest, current_user: User = Depends(get_current_user)):
    """Request withdrawal"""
    wallet = await db.wallets.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not wallet or wallet["balance"] < withdrawal_request.amount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance")
    
    # Calculate fee (10%)
    fee = withdrawal_request.amount * 0.1
    net_amount = withdrawal_request.amount - fee
    
    withdrawal = {
        "withdrawal_id": f"withdrawal_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "amount": withdrawal_request.amount,
        "fee": fee,
        "net_amount": net_amount,
        "upi_id": withdrawal_request.upi_id,
        "status": "pending",
        "admin_notes": None,
        "created_at": datetime.now(timezone.utc),
        "processed_at": None
    }
    await db.withdrawals.insert_one(withdrawal)
    
    return {"message": "Withdrawal request submitted", "withdrawal_id": withdrawal["withdrawal_id"]}

@api_router.get("/withdrawal/history")
async def get_withdrawal_history(current_user: User = Depends(get_current_user)):
    """Get withdrawal history"""
    withdrawals = await db.withdrawals.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return withdrawals

@api_router.put("/profile/upi")
async def update_upi(upi_request: UpdateUPIRequest, current_user: User = Depends(get_current_user)):
    """Update UPI ID"""
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"upi_id": upi_request.upi_id}}
    )
    return {"message": "UPI ID updated successfully"}

# ============= ADMIN ROUTES =============

@api_router.post("/admin/polls")
async def create_poll(poll_data: CreatePoll, current_admin: Admin = Depends(get_current_admin)):
    """Create new poll (admin only)"""
    poll_id = f"poll_{uuid.uuid4().hex[:12]}"
    
    options = []
    for opt in poll_data.options:
        options.append({
            "option_id": f"opt_{uuid.uuid4().hex[:8]}",
            "text": opt["text"],
            "image_base64": opt.get("image_base64")
        })
    
    poll = {
        "poll_id": poll_id,
        "title": poll_data.title,
        "description": poll_data.description,
        "options": options,
        "price_per_vote": poll_data.price_per_vote,
        "status": "active",
        "result_option_id": None,
        "created_at": datetime.now(timezone.utc),
        "closed_at": None
    }
    await db.polls.insert_one(poll)
    
    # Return without _id
    return {k: v for k, v in poll.items() if k != '_id'}

@api_router.put("/admin/polls/{poll_id}")
async def update_poll(poll_id: str, poll_data: CreatePoll, current_admin: Admin = Depends(get_current_admin)):
    """Update poll (admin only)"""
    poll = await db.polls.find_one({"poll_id": poll_id})
    if not poll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poll not found")
    
    options = []
    for opt in poll_data.options:
        options.append({
            "option_id": f"opt_{uuid.uuid4().hex[:8]}",
            "text": opt["text"],
            "image_base64": opt.get("image_base64")
        })
    
    await db.polls.update_one(
        {"poll_id": poll_id},
        {"$set": {
            "title": poll_data.title,
            "description": poll_data.description,
            "options": options,
            "price_per_vote": poll_data.price_per_vote
        }}
    )
    
    return {"message": "Poll updated successfully"}

@api_router.post("/admin/polls/{poll_id}/result")
async def set_poll_result(poll_id: str, result_data: SetResultRequest, current_admin: Admin = Depends(get_current_admin)):
    """Set poll result and distribute winnings (admin only)"""
    poll = await db.polls.find_one({"poll_id": poll_id}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poll not found")
    
    if poll["status"] != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Poll is already closed")
    
    # Verify winning option exists
    option_exists = any(opt["option_id"] == result_data.winning_option_id for opt in poll["options"])
    if not option_exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid winning option")
    
    # Calculate winnings
    all_votes = await db.votes.find({"poll_id": poll_id}).to_list(10000)
    
    winning_votes = [v for v in all_votes if v["option_id"] == result_data.winning_option_id]
    losing_votes = [v for v in all_votes if v["option_id"] != result_data.winning_option_id]
    
    total_losing_amount = sum(v["amount_paid"] for v in losing_votes)
    total_winning_votes = sum(v["vote_count"] for v in winning_votes)
    
    if total_winning_votes > 0:
        per_vote_share = total_losing_amount / total_winning_votes
        
        # Distribute to winners
        user_winnings = {}
        for vote in winning_votes:
            user_id = vote["user_id"]
            winning_amount = vote["vote_count"] * per_vote_share
            user_winnings[user_id] = user_winnings.get(user_id, 0) + winning_amount
        
        # Update wallets
        for user_id, amount in user_winnings.items():
            await db.wallets.update_one(
                {"user_id": user_id},
                {
                    "$inc": {"balance": amount},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
            
            # Create transaction
            transaction = {
                "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
                "user_id": user_id,
                "type": "win",
                "amount": amount,
                "status": "success",
                "poll_id": poll_id,
                "cashfree_order_id": None,
                "created_at": datetime.now(timezone.utc)
            }
            await db.transactions.insert_one(transaction)
    
    # Close poll
    await db.polls.update_one(
        {"poll_id": poll_id},
        {
            "$set": {
                "status": "closed",
                "result_option_id": result_data.winning_option_id,
                "closed_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "message": "Poll result set successfully",
        "winners_count": len(user_winnings) if total_winning_votes > 0 else 0,
        "total_distributed": total_losing_amount
    }

@api_router.get("/admin/polls")
async def get_all_polls_admin(current_admin: Admin = Depends(get_current_admin)):
    """Get all polls for admin"""
    polls = await db.polls.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return polls

@api_router.get("/admin/users")
async def get_all_users(current_admin: Admin = Depends(get_current_admin)):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.get("/admin/transactions")
async def get_all_transactions(current_admin: Admin = Depends(get_current_admin)):
    """Get all transactions (admin only)"""
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return transactions

@api_router.get("/admin/withdrawals")
async def get_pending_withdrawals(current_admin: Admin = Depends(get_current_admin)):
    """Get all withdrawal requests (admin only)"""
    withdrawals = await db.withdrawals.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return withdrawals

@api_router.put("/admin/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(withdrawal_id: str, current_admin: Admin = Depends(get_current_admin)):
    """Approve withdrawal (admin only)"""
    withdrawal = await db.withdrawals.find_one({"withdrawal_id": withdrawal_id}, {"_id": 0})
    if not withdrawal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Withdrawal not found")
    
    if withdrawal["status"] != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Withdrawal already processed")
    
    # Deduct from wallet
    wallet = await db.wallets.find_one({"user_id": withdrawal["user_id"]}, {"_id": 0})
    if not wallet or wallet["balance"] < withdrawal["amount"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance")
    
    await db.wallets.update_one(
        {"user_id": withdrawal["user_id"]},
        {
            "$inc": {"balance": -withdrawal["amount"]},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    # Update withdrawal
    await db.withdrawals.update_one(
        {"withdrawal_id": withdrawal_id},
        {
            "$set": {
                "status": "approved",
                "processed_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Create transactions
    await db.transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "user_id": withdrawal["user_id"],
        "type": "withdrawal",
        "amount": -withdrawal["amount"],
        "status": "success",
        "poll_id": None,
        "cashfree_order_id": None,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Withdrawal approved successfully"}

@api_router.put("/admin/withdrawals/{withdrawal_id}/reject")
async def reject_withdrawal(withdrawal_id: str, notes: str = "", current_admin: Admin = Depends(get_current_admin)):
    """Reject withdrawal (admin only)"""
    withdrawal = await db.withdrawals.find_one({"withdrawal_id": withdrawal_id})
    if not withdrawal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Withdrawal not found")
    
    if withdrawal["status"] != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Withdrawal already processed")
    
    await db.withdrawals.update_one(
        {"withdrawal_id": withdrawal_id},
        {
            "$set": {
                "status": "rejected",
                "admin_notes": notes,
                "processed_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"message": "Withdrawal rejected"}

@api_router.get("/admin/analytics")
async def get_analytics(current_admin: Admin = Depends(get_current_admin)):
    """Get dashboard analytics (admin only)"""
    total_users = await db.users.count_documents({})
    total_polls = await db.polls.count_documents({})
    active_polls = await db.polls.count_documents({"status": "active"})
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pending"})
    
    total_transactions = await db.transactions.aggregate([
        {"$match": {"status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    total_revenue = total_transactions[0]["total"] if total_transactions else 0
    
    return {
        "total_users": total_users,
        "total_polls": total_polls,
        "active_polls": active_polls,
        "pending_withdrawals": pending_withdrawals,
        "total_revenue": total_revenue
    }

# ============= PAYMENT WEBHOOK =============

@api_router.post("/payments/webhook")
async def payment_webhook(request: Request):
    """Handle Cashfree payment webhooks"""
    try:
        body = await request.body()
        payload = await request.json()
        
        event_type = payload.get("type")
        order_id = payload.get("data", {}).get("order", {}).get("order_id")
        
        logger.info(f"Webhook received: {event_type} for order {order_id}")
        
        if event_type == "PAYMENT_SUCCESS_WEBHOOK":
            # Update transaction
            transaction = await db.transactions.find_one({"cashfree_order_id": order_id})
            if transaction:
                await db.transactions.update_one(
                    {"cashfree_order_id": order_id},
                    {"$set": {"status": "success"}}
                )
                
                logger.info(f"Payment processed successfully: {order_id}")
        
        return {"status": "success"}
    
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

# ============= INCLUDE ROUTER =============

# Now include API router
app.include_router(api_router)

# Mount static files for admin panel assets BEFORE dynamic route
try:
    app.mount("/admin/static", StaticFiles(directory="/app/admin-panel/build/static"), name="admin-static")
    logger.info("Admin panel static files mounted")
except Exception as e:
    logger.warning(f"Could not mount admin static files: {e}")

@app.get("/admin/{full_path:path}")
async def serve_admin_spa(full_path: str):
    """Serve admin panel with SPA routing support"""
    # For all admin routes, serve index.html (SPA fallback)
    return FileResponse("/app/admin-panel/build/admin.html", media_type="text/html")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
