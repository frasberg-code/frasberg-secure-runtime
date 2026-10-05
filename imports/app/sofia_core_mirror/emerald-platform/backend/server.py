from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr
import uuid

load_dotenv()

app = FastAPI(
    title="EmeraldOrbit API",
    description="Complete backend for EmeraldOrbit platform",
    version="1.0.0"
)

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.emerald_orbit

# Collections
users_collection = db.users
contacts_collection = db.contacts
call_history_collection = db.call_history
songs_collection = db.songs
properties_collection = db.properties
subscriptions_collection = db.subscriptions
workspaces_collection = db.workspaces
notifications_collection = db.notifications
crypto_wallets_collection = db.crypto_wallets
crypto_transactions_collection = db.crypto_transactions

# Models
class User(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    password: str
    role: str = "user"

class Contact(BaseModel):
    user_email: EmailStr
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    role: Optional[str] = None

@app.get("/")
async def root():
    return {
        "message": "Welcome to EmeraldOrbit API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/api/health")
async def health_check():
    try:
        await db.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ==================== USER ROUTES ====================
@app.post("/api/users/register")
async def register_user(user: User):
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.utcnow()
    user_dict["hashed_password"] = user_dict.pop("password")  # In production, hash this!
    
    await users_collection.insert_one(user_dict)
    return {"message": "User created successfully", "email": user.email}

@app.get("/api/users/me")
async def get_current_user(email: str):
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    return user

# ==================== CONTACT ROUTES ====================
@app.get("/api/contacts")
async def get_contacts(user_email: str):
    contacts = await contacts_collection.find({"user_email": user_email}).to_list(1000)
    for contact in contacts:
        contact["_id"] = str(contact["_id"])
    return contacts

@app.post("/api/contacts")
async def create_contact(contact: Contact):
    contact_dict = contact.model_dump()
    contact_dict["id"] = str(uuid.uuid4())
    contact_dict["created_date"] = datetime.utcnow()
    
    result = await contacts_collection.insert_one(contact_dict)
    contact_dict["_id"] = str(result.inserted_id)
    return contact_dict

@app.put("/api/contacts/{contact_id}")
async def update_contact(contact_id: str, contact: Contact):
    contact_dict = contact.model_dump()
    result = await contacts_collection.update_one(
        {"id": contact_id},
        {"$set": contact_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact updated"}

@app.delete("/api/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    result = await contacts_collection.delete_one({"id": contact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted"}

# ==================== CALL HISTORY ROUTES ====================
@app.get("/api/calls")
async def get_call_history(user_email: str, limit: int = 50):
    calls = await call_history_collection.find({"user_email": user_email}).sort("created_date", -1).limit(limit).to_list(limit)
    for call in calls:
        call["_id"] = str(call["_id"])
    return calls

@app.post("/api/calls")
async def log_call(call_data: dict):
    call_data["id"] = str(uuid.uuid4())
    call_data["created_date"] = datetime.utcnow()
    result = await call_history_collection.insert_one(call_data)
    call_data["_id"] = str(result.inserted_id)
    return call_data

# ==================== MUSIC ROUTES ====================
@app.get("/api/songs")
async def get_songs(user_email: Optional[str] = None):
    query = {"user_email": user_email} if user_email else {}
    songs = await songs_collection.find(query).to_list(1000)
    for song in songs:
        song["_id"] = str(song["_id"])
    return songs

@app.post("/api/songs")
async def create_song(song_data: dict):
    song_data["id"] = str(uuid.uuid4())
    song_data["created_date"] = datetime.utcnow()
    result = await songs_collection.insert_one(song_data)
    song_data["_id"] = str(result.inserted_id)
    return song_data

# ==================== PROPERTY ROUTES ====================
@app.get("/api/properties")
async def get_properties(status: Optional[str] = None):
    query = {"status": status} if status else {}
    properties = await properties_collection.find(query).to_list(1000)
    for prop in properties:
        prop["_id"] = str(prop["_id"])
    return properties

@app.post("/api/properties")
async def create_property(property_data: dict):
    property_data["id"] = str(uuid.uuid4())
    property_data["created_date"] = datetime.utcnow()
    result = await properties_collection.insert_one(property_data)
    property_data["_id"] = str(result.inserted_id)
    return property_data

# ==================== SUBSCRIPTION ROUTES ====================
@app.get("/api/subscriptions")
async def get_subscriptions(user_email: str):
    subs = await subscriptions_collection.find({"user_email": user_email}).to_list(100)
    for sub in subs:
        sub["_id"] = str(sub["_id"])
    return subs

@app.post("/api/subscriptions")
async def create_subscription(sub_data: dict):
    sub_data["id"] = str(uuid.uuid4())
    sub_data["created_date"] = datetime.utcnow()
    result = await subscriptions_collection.insert_one(sub_data)
    sub_data["_id"] = str(result.inserted_id)
    return sub_data

# ==================== WORKSPACE ROUTES ====================
@app.get("/api/workspaces")
async def get_workspaces(user_email: str):
    workspaces = await workspaces_collection.find({
        "$or": [
            {"owner_email": user_email},
            {"members.email": user_email}
        ]
    }).to_list(100)
    for ws in workspaces:
        ws["_id"] = str(ws["_id"])
    return workspaces

@app.post("/api/workspaces")
async def create_workspace(workspace_data: dict):
    workspace_data["id"] = str(uuid.uuid4())
    workspace_data["created_date"] = datetime.utcnow()
    result = await workspaces_collection.insert_one(workspace_data)
    workspace_data["_id"] = str(result.inserted_id)
    return workspace_data

# ==================== NOTIFICATION ROUTES ====================
@app.get("/api/notifications")
async def get_notifications(user_email: str):
    notifications = await notifications_collection.find({"user_email": user_email}).sort("created_date", -1).to_list(100)
    for notif in notifications:
        notif["_id"] = str(notif["_id"])
    return notifications

@app.post("/api/notifications")
async def create_notification(notif_data: dict):
    notif_data["id"] = str(uuid.uuid4())
    notif_data["created_date"] = datetime.utcnow()
    result = await notifications_collection.insert_one(notif_data)
    notif_data["_id"] = str(result.inserted_id)
    return notif_data

@app.put("/api/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str):
    result = await notifications_collection.update_one(
        {"id": notif_id},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}

# ==================== CRYPTO ROUTES ====================
@app.get("/api/crypto/wallets")
async def get_wallets(user_email: str):
    wallets = await crypto_wallets_collection.find({"user_email": user_email}).to_list(100)
    for wallet in wallets:
        wallet["_id"] = str(wallet["_id"])
    return wallets

@app.get("/api/crypto/transactions")
async def get_transactions(user_email: str):
    transactions = await crypto_transactions_collection.find({"user_email": user_email}).sort("created_date", -1).to_list(100)
    for tx in transactions:
        tx["_id"] = str(tx["_id"])
    return transactions

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)