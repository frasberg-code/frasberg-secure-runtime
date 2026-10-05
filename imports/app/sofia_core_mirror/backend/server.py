from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import os
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr, Field
import uuid
from passlib.context import CryptContext
from jose import JWTError, jwt

load_dotenv()

app = FastAPI(
    title="EmeraldOrbit API",
    description="Complete backend for EmeraldOrbit platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "emerald_orbit")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Auth setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get("JWT_SECRET", "emerald-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Collections
users_col = db.users
contacts_col = db.contacts
calls_col = db.call_history
songs_col = db.songs
properties_col = db.properties
subscriptions_col = db.subscriptions
workspaces_col = db.workspaces
notifications_col = db.notifications
wallets_col = db.crypto_wallets
transactions_col = db.crypto_transactions
messages_col = db.chat_messages
presence_col = db.user_presence
tickets_col = db.support_tickets
interactions_col = db.support_interactions
sessions_col = db.collaboration_sessions

# ==================== MODELS ====================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str = "user"
    is_active: bool = True

class ContactCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    role: Optional[str] = None

class PropertyCreate(BaseModel):
    title: str
    address: str
    city: str
    state: str
    zip_code: Optional[str] = None
    price: float
    property_type: str = "house"
    status: str = "for_sale"
    bedrooms: int = 0
    bathrooms: float = 0
    sqft: int = 0
    images: List[str] = []
    features: List[str] = []
    description: Optional[str] = None

class SubscriptionCreate(BaseModel):
    tier: str = "free"
    sofia_message_limit: int = 50
    image_generation_limit: int = 5
    music_generation_limit: int = 0
    video_generation_limit: int = 0

class MessageCreate(BaseModel):
    receiver_email: str
    message: str

# ==================== AUTH HELPERS ====================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

def serialize_doc(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# ==================== ROUTES ====================
@app.get("/")
async def root():
    return {"message": "EmeraldOrbit API", "version": "1.0.0", "status": "operational"}

@app.get("/api/health")
async def health():
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== AUTH ====================
@app.post("/api/auth/register")
async def register(user: UserCreate):
    existing = await users_col.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": hash_password(user.password),
        "role": "user",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await users_col.insert_one(user_doc)
    
    # Create default subscription
    sub_doc = {
        "id": str(uuid.uuid4()),
        "user_email": user.email,
        "tier": "free",
        "sofia_message_limit": 50,
        "sofia_messages_used": 0,
        "image_generation_limit": 5,
        "image_generations_used": 0,
        "music_generation_limit": 0,
        "music_generations_used": 0,
        "video_generation_limit": 0,
        "video_generations_used": 0,
        "advanced_features_enabled": False,
        "created_date": datetime.now(timezone.utc).isoformat()
    }
    await subscriptions_col.insert_one(sub_doc)
    
    token = create_token({"sub": user.email})
    return {"token": token, "user": {"email": user.email, "full_name": user.full_name}}

@app.post("/api/auth/login")
async def login(user: UserLogin):
    db_user = await users_col.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"sub": user.email})
    return {
        "token": token,
        "user": {
            "id": db_user["id"],
            "email": db_user["email"],
            "full_name": db_user.get("full_name"),
            "role": db_user.get("role", "user")
        }
    }

@app.get("/api/auth/me")
async def get_me(email: str):
    user = await users_col.find_one({"email": email}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/api/auth/me")
async def update_me(email: str, full_name: Optional[str] = None):
    update_data = {}
    if full_name:
        update_data["full_name"] = full_name
    
    if update_data:
        await users_col.update_one({"email": email}, {"$set": update_data})
    
    user = await users_col.find_one({"email": email}, {"_id": 0, "hashed_password": 0})
    return user

# ==================== CONTACTS ====================
@app.get("/api/contacts")
async def get_contacts(user_email: str):
    contacts = await contacts_col.find({"user_email": user_email}, {"_id": 0}).to_list(1000)
    return contacts

@app.post("/api/contacts")
async def create_contact(contact: ContactCreate, user_email: str):
    doc = contact.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_email"] = user_email
    doc["created_date"] = datetime.now(timezone.utc).isoformat()
    await contacts_col.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@app.put("/api/contacts/{contact_id}")
async def update_contact(contact_id: str, contact: ContactCreate):
    result = await contacts_col.update_one({"id": contact_id}, {"$set": contact.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Updated"}

@app.delete("/api/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    result = await contacts_col.delete_one({"id": contact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Deleted"}

# ==================== CALLS ====================
@app.get("/api/calls")
async def get_calls(user_email: str, limit: int = 50):
    calls = await calls_col.find({"user_email": user_email}, {"_id": 0}).sort("created_date", -1).limit(limit).to_list(limit)
    return calls

@app.post("/api/calls")
async def log_call(call_data: dict):
    call_data["id"] = str(uuid.uuid4())
    call_data["created_date"] = datetime.now(timezone.utc).isoformat()
    await calls_col.insert_one(call_data)
    return {k: v for k, v in call_data.items() if k != "_id"}

# ==================== PROPERTIES ====================
@app.get("/api/properties")
async def get_properties(status: Optional[str] = None, property_type: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if property_type:
        query["property_type"] = property_type
    properties = await properties_col.find(query, {"_id": 0}).to_list(1000)
    return properties

@app.post("/api/properties")
async def create_property(prop: PropertyCreate, user_email: str):
    doc = prop.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_email"] = user_email
    doc["created_date"] = datetime.now(timezone.utc).isoformat()
    await properties_col.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@app.get("/api/properties/{property_id}")
async def get_property(property_id: str):
    prop = await properties_col.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop

@app.put("/api/properties/{property_id}")
async def update_property(property_id: str, prop: PropertyCreate):
    result = await properties_col.update_one({"id": property_id}, {"$set": prop.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Updated"}

@app.delete("/api/properties/{property_id}")
async def delete_property(property_id: str):
    result = await properties_col.delete_one({"id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Deleted"}

# ==================== SUBSCRIPTIONS ====================
@app.get("/api/subscriptions")
async def get_subscriptions(user_email: str):
    subs = await subscriptions_col.find({"user_email": user_email}, {"_id": 0}).to_list(100)
    return subs

@app.get("/api/subscriptions/all")
async def get_all_subscriptions():
    subs = await subscriptions_col.find({}, {"_id": 0}).to_list(1000)
    return subs

@app.put("/api/subscriptions/{sub_id}")
async def update_subscription(sub_id: str, data: dict):
    result = await subscriptions_col.update_one({"id": sub_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Updated"}

# ==================== SONGS/MUSIC ====================
@app.get("/api/songs")
async def get_songs(user_email: Optional[str] = None):
    query = {"user_email": user_email} if user_email else {}
    songs = await songs_col.find(query, {"_id": 0}).to_list(1000)
    return songs

@app.post("/api/songs")
async def create_song(song_data: dict):
    song_data["id"] = str(uuid.uuid4())
    song_data["created_date"] = datetime.now(timezone.utc).isoformat()
    await songs_col.insert_one(song_data)
    return {k: v for k, v in song_data.items() if k != "_id"}

# ==================== NOTIFICATIONS ====================
@app.get("/api/notifications")
async def get_notifications(user_email: str):
    notifs = await notifications_col.find({"user_email": user_email}, {"_id": 0}).sort("created_date", -1).to_list(100)
    return notifs

@app.post("/api/notifications")
async def create_notification(notif_data: dict):
    notif_data["id"] = str(uuid.uuid4())
    notif_data["created_date"] = datetime.now(timezone.utc).isoformat()
    notif_data["read"] = False
    await notifications_col.insert_one(notif_data)
    return {k: v for k, v in notif_data.items() if k != "_id"}

@app.put("/api/notifications/{notif_id}/read")
async def mark_read(notif_id: str):
    await notifications_col.update_one({"id": notif_id}, {"$set": {"read": True}})
    return {"message": "Marked read"}

# ==================== CRYPTO ====================
@app.get("/api/crypto/wallets")
async def get_wallets(user_email: str):
    wallets = await wallets_col.find({"user_email": user_email}, {"_id": 0}).to_list(100)
    return wallets

@app.post("/api/crypto/wallets")
async def create_wallet(wallet_data: dict):
    wallet_data["id"] = str(uuid.uuid4())
    wallet_data["created_date"] = datetime.now(timezone.utc).isoformat()
    await wallets_col.insert_one(wallet_data)
    return {k: v for k, v in wallet_data.items() if k != "_id"}

@app.get("/api/crypto/transactions")
async def get_transactions(user_email: str):
    txs = await transactions_col.find({"user_email": user_email}, {"_id": 0}).sort("created_date", -1).to_list(100)
    return txs

@app.post("/api/crypto/transactions")
async def create_transaction(tx_data: dict):
    tx_data["id"] = str(uuid.uuid4())
    tx_data["created_date"] = datetime.now(timezone.utc).isoformat()
    await transactions_col.insert_one(tx_data)
    return {k: v for k, v in tx_data.items() if k != "_id"}

# ==================== MESSAGING ====================
@app.get("/api/messages")
async def get_messages(user_email: str, other_email: str):
    messages = await messages_col.find({
        "$or": [
            {"sender_email": user_email, "receiver_email": other_email},
            {"sender_email": other_email, "receiver_email": user_email}
        ]
    }, {"_id": 0}).sort("created_date", 1).to_list(1000)
    return messages

@app.post("/api/messages")
async def send_message(msg: MessageCreate, user_email: str):
    user = await users_col.find_one({"email": user_email}, {"_id": 0})
    doc = {
        "id": str(uuid.uuid4()),
        "sender_email": user_email,
        "sender_name": user.get("full_name", user_email) if user else user_email,
        "receiver_email": msg.receiver_email,
        "message": msg.message,
        "read": False,
        "created_date": datetime.now(timezone.utc).isoformat()
    }
    await messages_col.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

# ==================== PRESENCE ====================
@app.get("/api/presence")
async def get_presence():
    presences = await presence_col.find({}, {"_id": 0}).to_list(1000)
    return presences

@app.post("/api/presence")
async def update_presence(user_email: str, status: str = "online"):
    user = await users_col.find_one({"email": user_email}, {"_id": 0})
    existing = await presence_col.find_one({"user_email": user_email})
    
    doc = {
        "user_email": user_email,
        "user_name": user.get("full_name", user_email) if user else user_email,
        "status": status,
        "last_seen": datetime.now(timezone.utc).isoformat()
    }
    
    if existing:
        await presence_col.update_one({"user_email": user_email}, {"$set": doc})
    else:
        doc["id"] = str(uuid.uuid4())
        await presence_col.insert_one(doc)
    
    return {"message": "Presence updated"}

# ==================== SUPPORT ====================
@app.get("/api/support/tickets")
async def get_tickets(user_email: Optional[str] = None):
    query = {"user_email": user_email} if user_email else {}
    tickets = await tickets_col.find(query, {"_id": 0}).sort("created_date", -1).to_list(100)
    return tickets

@app.post("/api/support/tickets")
async def create_ticket(ticket_data: dict):
    ticket_data["id"] = str(uuid.uuid4())
    ticket_data["ticket_id"] = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    ticket_data["status"] = "open"
    ticket_data["created_date"] = datetime.now(timezone.utc).isoformat()
    await tickets_col.insert_one(ticket_data)
    return {k: v for k, v in ticket_data.items() if k != "_id"}

@app.get("/api/support/interactions")
async def get_interactions(user_email: Optional[str] = None):
    query = {"user_email": user_email} if user_email else {}
    interactions = await interactions_col.find(query, {"_id": 0}).sort("created_date", -1).to_list(100)
    return interactions

# ==================== WORKSPACES ====================
@app.get("/api/workspaces")
async def get_workspaces(user_email: str):
    workspaces = await workspaces_col.find({
        "$or": [
            {"owner_email": user_email},
            {"members.email": user_email}
        ]
    }, {"_id": 0}).to_list(100)
    return workspaces

@app.post("/api/workspaces")
async def create_workspace(ws_data: dict):
    ws_data["id"] = str(uuid.uuid4())
    ws_data["created_date"] = datetime.now(timezone.utc).isoformat()
    await workspaces_col.insert_one(ws_data)
    return {k: v for k, v in ws_data.items() if k != "_id"}

# ==================== COLLABORATION SESSIONS ====================
@app.get("/api/collaboration/sessions")
async def get_sessions(user_email: Optional[str] = None):
    query = {}
    if user_email:
        query["$or"] = [
            {"owner_email": user_email},
            {"participants.email": user_email}
        ]
    sessions = await sessions_col.find(query, {"_id": 0}).sort("last_active", -1).to_list(100)
    return sessions

@app.post("/api/collaboration/sessions")
async def create_session(session_data: dict):
    session_data["id"] = str(uuid.uuid4())
    session_data["created_date"] = datetime.now(timezone.utc).isoformat()
    session_data["last_active"] = datetime.now(timezone.utc).isoformat()
    await sessions_col.insert_one(session_data)
    return {k: v for k, v in session_data.items() if k != "_id"}

@app.put("/api/collaboration/sessions/{session_id}")
async def update_session(session_id: str, data: dict):
    data["last_active"] = datetime.now(timezone.utc).isoformat()
    result = await sessions_col.update_one({"id": session_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Updated"}

# ==================== USERS LIST (for chat) ====================
@app.get("/api/users")
async def get_users():
    users = await users_col.find({}, {"_id": 0, "hashed_password": 0}).to_list(1000)
    return users

# ==================== CALL HISTORY (for Supabase Edge Function) ====================
# Additional MongoDB collections for hybrid architecture
projects_col = db.projects
messages_archive_col = db.messages_archive
call_history_col = db.call_history
creator_assets_col = db.creator_assets

class CallHistoryCreate(BaseModel):
    callId: str
    callerId: Optional[str] = None
    calleeId: Optional[str] = None
    status: str
    startedAt: str
    endedAt: str
    metadata: Optional[dict] = None

@app.post("/api/call-history")
async def log_call_history(call: CallHistoryCreate):
    """Endpoint for Supabase Edge Function to log calls to MongoDB"""
    started = datetime.fromisoformat(call.startedAt.replace('Z', '+00:00'))
    ended = datetime.fromisoformat(call.endedAt.replace('Z', '+00:00'))
    duration_seconds = (ended - started).total_seconds()

    doc = {
        "id": str(uuid.uuid4()),
        "callId": call.callId,
        "callerId": call.callerId,
        "calleeId": call.calleeId,
        "status": call.status,
        "startedAt": started.isoformat(),
        "endedAt": ended.isoformat(),
        "durationSeconds": duration_seconds,
        "metadata": call.metadata or {},
        "createdAt": datetime.now(timezone.utc).isoformat()
    }

    await call_history_col.insert_one(doc)
    return {"ok": True, "id": doc["id"]}

@app.get("/api/call-history")
async def get_call_history(user_id: Optional[str] = None, limit: int = 50):
    query = {}
    if user_id:
        query["$or"] = [{"callerId": user_id}, {"calleeId": user_id}]
    
    calls = await call_history_col.find(query, {"_id": 0}).sort("createdAt", -1).limit(limit).to_list(limit)
    return calls

# ==================== PROJECTS (MongoDB for creative work) ====================
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    data: Optional[dict] = None

@app.get("/api/projects")
async def get_projects(user_id: str):
    projects = await projects_col.find({"ownerId": user_id}, {"_id": 0}).to_list(100)
    return projects

@app.post("/api/projects")
async def create_project(project: ProjectCreate, user_id: str):
    doc = {
        "id": str(uuid.uuid4()),
        "ownerId": user_id,
        "name": project.name,
        "description": project.description,
        "data": project.data or {},
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    await projects_col.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, project: ProjectCreate):
    update_data = {
        "name": project.name,
        "description": project.description,
        "data": project.data,
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    result = await projects_col.update_one({"id": project_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Updated"}

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    result = await projects_col.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Deleted"}

# ==================== MESSAGES ARCHIVE (MongoDB long-term storage) ====================
class MessageArchive(BaseModel):
    conversationId: str
    senderId: str
    content: str
    metadata: Optional[dict] = None

@app.post("/api/messages/archive")
async def archive_message(message: MessageArchive):
    doc = {
        "id": str(uuid.uuid4()),
        "conversationId": message.conversationId,
        "senderId": message.senderId,
        "content": message.content,
        "metadata": message.metadata or {},
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await messages_archive_col.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@app.get("/api/messages/archive/{conversation_id}")
async def get_archived_messages(conversation_id: str, limit: int = 100):
    messages = await messages_archive_col.find(
        {"conversationId": conversation_id}, {"_id": 0}
    ).sort("createdAt", 1).limit(limit).to_list(limit)
    return messages

# ==================== CREATOR ASSETS (MongoDB for creative assets) ====================
class CreatorAsset(BaseModel):
    type: str  # scene, template, preset, layout
    name: str
    data: dict

@app.get("/api/creator-assets")
async def get_creator_assets(user_id: str, asset_type: Optional[str] = None):
    query = {"ownerId": user_id}
    if asset_type:
        query["type"] = asset_type
    assets = await creator_assets_col.find(query, {"_id": 0}).to_list(100)
    return assets

@app.post("/api/creator-assets")
async def create_asset(asset: CreatorAsset, user_id: str):
    doc = {
        "id": str(uuid.uuid4()),
        "ownerId": user_id,
        "type": asset.type,
        "name": asset.name,
        "data": asset.data,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    await creator_assets_col.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@app.put("/api/creator-assets/{asset_id}")
async def update_asset(asset_id: str, asset: CreatorAsset):
    update_data = {
        "type": asset.type,
        "name": asset.name,
        "data": asset.data,
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    result = await creator_assets_col.update_one({"id": asset_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Updated"}

@app.delete("/api/creator-assets/{asset_id}")
async def delete_asset(asset_id: str):
    result = await creator_assets_col.delete_one({"id": asset_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
