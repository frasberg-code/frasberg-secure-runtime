"""
Database abstraction layer for Sofia AI Platform
Uses Supabase as primary database with MongoDB as temporary fallback
"""
import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import uuid

logger = logging.getLogger(__name__)

# Initialize Supabase as primary
supabase = None
supabase_admin = None
Tables = None
USE_SUPABASE = False

try:
    from db.supabase_client import get_supabase_client, get_supabase_admin_client, Tables as SupabaseTables
    supabase = get_supabase_client()
    supabase_admin = get_supabase_admin_client()
    Tables = SupabaseTables
    USE_SUPABASE = True
    logger.info("Supabase initialized as primary database")
except Exception as e:
    logger.warning(f"Supabase initialization failed: {e}")

# MongoDB fallback (to be deprecated)
mongo_db = None
if not USE_SUPABASE:
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        mongo_client = AsyncIOMotorClient(mongo_url)
        mongo_db = mongo_client[os.environ.get('DB_NAME', 'sofia_db')]
        logger.info("MongoDB initialized as fallback database")
    except Exception as e:
        logger.error(f"Failed to initialize MongoDB fallback: {e}")


class Database:
    """Unified database interface for Sofia AI Platform - Supabase Primary"""
    
    @staticmethod
    def _serialize_datetime(data: Dict) -> Dict:
        """Convert datetime objects to ISO strings for Supabase"""
        result = {}
        for key, value in data.items():
            if isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = Database._serialize_datetime(value)
            elif isinstance(value, list):
                result[key] = [
                    Database._serialize_datetime(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                result[key] = value
        return result
    
    @staticmethod
    def _supabase_write(table: str, operation: str, data: Dict = None, filters: Dict = None):
        """Execute Supabase write operation with service role"""
        if not USE_SUPABASE or not supabase_admin:
            return None
        
        try:
            serialized = Database._serialize_datetime(data) if data else {}
            
            if operation == "insert":
                result = supabase_admin.table(table).insert(serialized).execute()
            elif operation == "update":
                query = supabase_admin.table(table).update(serialized)
                for key, value in (filters or {}).items():
                    query = query.eq(key, value)
                result = query.execute()
            elif operation == "upsert":
                result = supabase_admin.table(table).upsert(serialized).execute()
            elif operation == "delete":
                query = supabase_admin.table(table).delete()
                for key, value in (filters or {}).items():
                    query = query.eq(key, value)
                result = query.execute()
            else:
                return None
            
            return result.data[0] if result.data and len(result.data) > 0 else result.data
        except Exception as e:
            logger.error(f"Supabase {operation} error on {table}: {e}")
            return None
    
    @staticmethod
    def _supabase_read(table: str, filters: Dict = None, order_by: str = None, desc: bool = True, limit: int = None):
        """Execute Supabase read operation"""
        if not USE_SUPABASE or not supabase:
            return None
        
        try:
            query = supabase.table(table).select("*")
            
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            
            if order_by:
                query = query.order(order_by, desc=desc)
            
            if limit:
                query = query.limit(limit)
            
            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Supabase read error on {table}: {e}")
            return []
    
    # ==========================================
    # Conversations
    # ==========================================
    
    @staticmethod
    async def create_conversation(session_id: str, title: str, user_id: str = None) -> Dict:
        """Create a new conversation"""
        now = datetime.now(timezone.utc)
        doc = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "user_id": user_id,
            "title": title,
            "messages": [],
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
        
        if USE_SUPABASE:
            result = Database._supabase_write(Tables.CONVERSATIONS, "insert", doc)
            return result if result else doc
        elif mongo_db:
            await mongo_db.conversations.insert_one(doc)
        return doc
    
    @staticmethod
    async def get_conversation(session_id: str) -> Optional[Dict]:
        """Get a conversation by session_id"""
        if USE_SUPABASE:
            results = Database._supabase_read(Tables.CONVERSATIONS, {"session_id": session_id}, limit=1)
            return results[0] if results else None
        elif mongo_db:
            return await mongo_db.conversations.find_one({"session_id": session_id}, {"_id": 0})
        return None
    
    @staticmethod
    async def update_conversation(session_id: str, messages: List[Dict]) -> bool:
        """Update conversation messages"""
        now = datetime.now(timezone.utc).isoformat()
        
        if USE_SUPABASE:
            result = Database._supabase_write(
                Tables.CONVERSATIONS, 
                "update", 
                {"messages": messages, "updated_at": now},
                {"session_id": session_id}
            )
            return result is not None
        elif mongo_db:
            result = await mongo_db.conversations.update_one(
                {"session_id": session_id},
                {"$set": {"messages": messages, "updated_at": now}}
            )
            return result.modified_count > 0
        return False
    
    @staticmethod
    async def get_all_conversations(limit: int = 100, user_id: str = None) -> List[Dict]:
        """Get all conversations"""
        if USE_SUPABASE:
            filters = {"user_id": user_id} if user_id else None
            return Database._supabase_read(Tables.CONVERSATIONS, filters, "updated_at", True, limit) or []
        elif mongo_db:
            query = {"user_id": user_id} if user_id else {}
            return await mongo_db.conversations.find(query, {"_id": 0}).to_list(limit)
        return []
    
    @staticmethod
    async def delete_conversation(session_id: str) -> bool:
        """Delete a conversation"""
        if USE_SUPABASE:
            result = Database._supabase_write(Tables.CONVERSATIONS, "delete", filters={"session_id": session_id})
            return result is not None
        elif mongo_db:
            result = await mongo_db.conversations.delete_one({"session_id": session_id})
            return result.deleted_count > 0
        return False
    
    # ==========================================
    # Calls (Video Calling)
    # ==========================================
    
    @staticmethod
    async def create_call(room_name: str, room_url: str, initiator_name: str, privacy: str = "public") -> Dict:
        """Create a new call room"""
        now = datetime.now(timezone.utc)
        doc = {
            "id": str(uuid.uuid4()),
            "room_name": room_name,
            "room_url": room_url,
            "initiator_name": initiator_name,
            "privacy": privacy,
            "status": "active",
            "created_at": now.isoformat(),
            "participants": [initiator_name]
        }
        
        if USE_SUPABASE:
            result = Database._supabase_write(Tables.CALLS, "insert", doc)
            return result if result else doc
        elif mongo_db:
            await mongo_db.calls.insert_one(doc)
        return doc
    
    @staticmethod
    async def get_call(room_name: str) -> Optional[Dict]:
        """Get a call by room name"""
        if USE_SUPABASE:
            results = Database._supabase_read(Tables.CALLS, {"room_name": room_name}, limit=1)
            return results[0] if results else None
        elif mongo_db:
            return await mongo_db.calls.find_one({"room_name": room_name}, {"_id": 0})
        return None
    
    @staticmethod
    async def add_participant_to_call(room_name: str, participant_name: str) -> bool:
        """Add a participant to a call"""
        call = await Database.get_call(room_name)
        if not call:
            return False
        
        participants = call.get("participants", [])
        if participant_name not in participants:
            participants.append(participant_name)
        
        now = datetime.now(timezone.utc).isoformat()
        
        if USE_SUPABASE:
            result = Database._supabase_write(
                Tables.CALLS, "update",
                {"participants": participants, "updated_at": now},
                {"room_name": room_name}
            )
            return result is not None
        elif mongo_db:
            result = await mongo_db.calls.update_one(
                {"room_name": room_name},
                {"$set": {"participants": participants, "updated_at": now}}
            )
            return result.modified_count > 0
        return False
    
    @staticmethod
    async def end_call(room_name: str) -> bool:
        """End a call"""
        now = datetime.now(timezone.utc).isoformat()
        
        if USE_SUPABASE:
            result = Database._supabase_write(
                Tables.CALLS, "update",
                {"status": "ended", "ended_at": now},
                {"room_name": room_name}
            )
            return result is not None
        elif mongo_db:
            result = await mongo_db.calls.update_one(
                {"room_name": room_name},
                {"$set": {"status": "ended", "ended_at": now}}
            )
            return result.modified_count > 0
        return False
    
    # ==========================================
    # Generated Music
    # ==========================================
    
    @staticmethod
    async def create_music(prompt: str, duration: int, genre: str = None, user_id: str = None) -> Dict:
        """Create a new music generation record"""
        now = datetime.now(timezone.utc)
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "prompt": prompt,
            "duration": duration,
            "genre": genre or "AI Generated",
            "status": "completed",
            "bpm": 120,
            "created_at": now.isoformat()
        }
        
        if USE_SUPABASE:
            result = Database._supabase_write(Tables.GENERATED_MUSIC, "insert", doc)
            return result if result else doc
        elif mongo_db:
            await mongo_db.generated_music.insert_one(doc)
        return doc
    
    @staticmethod
    async def get_music_library(limit: int = 100, user_id: str = None) -> List[Dict]:
        """Get music library"""
        if USE_SUPABASE:
            filters = {"user_id": user_id} if user_id else None
            return Database._supabase_read(Tables.GENERATED_MUSIC, filters, "created_at", True, limit) or []
        elif mongo_db:
            query = {"user_id": user_id} if user_id else {}
            return await mongo_db.generated_music.find(query, {"_id": 0}).to_list(limit)
        return []
    
    # ==========================================
    # Generated Videos
    # ==========================================
    
    @staticmethod
    async def create_video(prompt: str, duration: int, aspect_ratio: str, quality: str, style: str, user_id: str = None) -> Dict:
        """Create a new video generation record"""
        now = datetime.now(timezone.utc)
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "prompt": prompt,
            "duration": duration,
            "aspect_ratio": aspect_ratio,
            "quality": quality,
            "style": style,
            "status": "completed",
            "created_at": now.isoformat()
        }
        
        if USE_SUPABASE:
            result = Database._supabase_write(Tables.GENERATED_VIDEOS, "insert", doc)
            return result if result else doc
        elif mongo_db:
            await mongo_db.generated_videos.insert_one(doc)
        return doc
    
    @staticmethod
    async def get_video_library(limit: int = 100, user_id: str = None) -> List[Dict]:
        """Get video library"""
        if USE_SUPABASE:
            filters = {"user_id": user_id} if user_id else None
            return Database._supabase_read(Tables.GENERATED_VIDEOS, filters, "created_at", True, limit) or []
        elif mongo_db:
            query = {"user_id": user_id} if user_id else {}
            return await mongo_db.generated_videos.find(query, {"_id": 0}).to_list(limit)
        return []
    
    # ==========================================
    # Voice Events
    # ==========================================
    
    @staticmethod
    async def log_voice_event(event_type: str, voice_profile: str, caller: str, text_hash: str = None) -> Dict:
        """Log a voice event"""
        now = datetime.now(timezone.utc)
        doc = {
            "id": str(uuid.uuid4()),
            "type": event_type,
            "voice_profile": voice_profile,
            "caller": caller,
            "text_hash": text_hash,
            "timestamp": now.isoformat()
        }
        
        if USE_SUPABASE:
            result = Database._supabase_write(Tables.VOICE_EVENTS, "insert", doc)
            return result if result else doc
        elif mongo_db:
            await mongo_db.voice_events.insert_one(doc)
        return doc
    
    @staticmethod
    async def get_voice_events(limit: int = 50) -> List[Dict]:
        """Get recent voice events"""
        if USE_SUPABASE:
            return Database._supabase_read(Tables.VOICE_EVENTS, None, "timestamp", True, limit) or []
        elif mongo_db:
            return await mongo_db.voice_events.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
        return []
    
    # ==========================================
    # Sofia Core Files
    # ==========================================
    
    @staticmethod
    async def upsert_sofia_core_file(file_data: Dict) -> Dict:
        """Upsert a Sofia Core file"""
        if USE_SUPABASE:
            result = Database._supabase_write(Tables.SOFIA_CORE_FILES, "upsert", file_data)
            return result if result else file_data
        elif mongo_db:
            await mongo_db.sofia_core_files.update_one(
                {"path": file_data["path"], "branch": file_data["branch"]},
                {"$set": file_data},
                upsert=True
            )
        return file_data
    
    @staticmethod
    async def get_sofia_core_files(deployed: bool = None, path_prefix: str = None) -> List[Dict]:
        """Get Sofia Core files"""
        if USE_SUPABASE:
            filters = {}
            if deployed is not None:
                filters["is_deployed"] = deployed
            return Database._supabase_read(Tables.SOFIA_CORE_FILES, filters if filters else None) or []
        elif mongo_db:
            query = {}
            if deployed is not None:
                query["is_deployed"] = deployed
            if path_prefix:
                query["path"] = {"$regex": f"^{path_prefix}"}
            return await mongo_db.sofia_core_files.find(query, {"_id": 0}).to_list(1000)
        return []
    
    @staticmethod
    async def get_sofia_core_file(file_id: str) -> Optional[Dict]:
        """Get a specific Sofia Core file"""
        if USE_SUPABASE:
            results = Database._supabase_read(Tables.SOFIA_CORE_FILES, {"id": file_id}, limit=1)
            return results[0] if results else None
        elif mongo_db:
            return await mongo_db.sofia_core_files.find_one({"id": file_id}, {"_id": 0})
        return None
    
    @staticmethod
    async def mark_files_deployed(file_ids: List[str]) -> Dict[str, str]:
        """Mark files as deployed"""
        results = {}
        now = datetime.now(timezone.utc).isoformat()
        
        for file_id in file_ids:
            try:
                if USE_SUPABASE:
                    result = Database._supabase_write(
                        Tables.SOFIA_CORE_FILES, "update",
                        {"is_deployed": True, "deployed_at": now},
                        {"id": file_id}
                    )
                    results[file_id] = "deployed" if result else "not found"
                elif mongo_db:
                    result = await mongo_db.sofia_core_files.update_one(
                        {"id": file_id},
                        {"$set": {"is_deployed": True, "deployed_at": now}}
                    )
                    results[file_id] = "deployed" if result.modified_count > 0 else "not found"
            except Exception as e:
                results[file_id] = f"error: {e}"
        
        return results
    
    # ==========================================
    # Sync Status
    # ==========================================
    
    @staticmethod
    async def update_sync_status(status_data: Dict) -> Dict:
        """Update Sofia Core sync status"""
        status_data["id"] = "main"
        
        if USE_SUPABASE:
            result = Database._supabase_write(Tables.SOFIA_CORE_SYNC_STATUS, "upsert", status_data)
            return result if result else status_data
        elif mongo_db:
            await mongo_db.sofia_core_sync_status.update_one({}, {"$set": status_data}, upsert=True)
        return status_data
    
    @staticmethod
    async def get_sync_status() -> Optional[Dict]:
        """Get Sofia Core sync status"""
        if USE_SUPABASE:
            results = Database._supabase_read(Tables.SOFIA_CORE_SYNC_STATUS, {"id": "main"}, limit=1)
            return results[0] if results else None
        elif mongo_db:
            return await mongo_db.sofia_core_sync_status.find_one({}, {"_id": 0})
        return None
    
    # ==========================================
    # Status Checks
    # ==========================================
    
    @staticmethod
    async def create_status_check(client_name: str) -> Dict:
        """Create a status check"""
        now = datetime.now(timezone.utc)
        doc = {
            "id": str(uuid.uuid4()),
            "client_name": client_name,
            "timestamp": now.isoformat()
        }
        
        if USE_SUPABASE:
            result = Database._supabase_write(Tables.STATUS_CHECKS, "insert", doc)
            return result if result else doc
        elif mongo_db:
            await mongo_db.status_checks.insert_one(doc)
        return doc
    
    @staticmethod
    async def get_status_checks(limit: int = 1000) -> List[Dict]:
        """Get status checks"""
        if USE_SUPABASE:
            return Database._supabase_read(Tables.STATUS_CHECKS, None, "timestamp", True, limit) or []
        elif mongo_db:
            return await mongo_db.status_checks.find({}, {"_id": 0}).to_list(limit)
        return []
    
    # ==========================================
    # Phase 2: Persona Evolution System
    # ==========================================
    
    @staticmethod
    async def get_persona_settings(user_id: str) -> Optional[Dict]:
        """Get persona settings for a user"""
        if USE_SUPABASE:
            results = Database._supabase_read(Tables.PERSONA_SETTINGS, {"user_id": user_id}, limit=1)
            return results[0] if results else None
        elif mongo_db:
            return await mongo_db.persona_settings.find_one({"user_id": user_id}, {"_id": 0})
        return None
    
    @staticmethod
    async def save_persona_settings(user_id: str, settings: Dict) -> Dict:
        """Save persona settings for a user"""
        now = datetime.now(timezone.utc)
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            **settings,
            "updated_at": now.isoformat()
        }
        
        if USE_SUPABASE:
            # Check if exists
            existing = await Database.get_persona_settings(user_id)
            if existing:
                doc["id"] = existing["id"]
                result = Database._supabase_write(
                    Tables.PERSONA_SETTINGS, "update", doc, {"user_id": user_id}
                )
            else:
                doc["created_at"] = now.isoformat()
                result = Database._supabase_write(Tables.PERSONA_SETTINGS, "insert", doc)
            return result if result else doc
        elif mongo_db:
            await mongo_db.persona_settings.update_one(
                {"user_id": user_id},
                {"$set": doc},
                upsert=True
            )
        return doc
    
    @staticmethod
    async def get_user_memory(user_id: str, limit: int = 100) -> List[Dict]:
        """Get user memory entries"""
        if USE_SUPABASE:
            return Database._supabase_read(Tables.USER_MEMORY, {"user_id": user_id}, "created_at", True, limit) or []
        elif mongo_db:
            return await mongo_db.user_memory.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(limit)
        return []
    
    @staticmethod
    async def save_user_memory(user_id: str, memory_type: str, content: str, metadata: Dict = None) -> Dict:
        """Save a user memory entry"""
        now = datetime.now(timezone.utc)
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "memory_type": memory_type,
            "content": content,
            "metadata": metadata or {},
            "importance": 0.5,
            "created_at": now.isoformat()
        }
        
        if USE_SUPABASE:
            result = Database._supabase_write(Tables.USER_MEMORY, "insert", doc)
            return result if result else doc
        elif mongo_db:
            await mongo_db.user_memory.insert_one(doc)
        return doc
    
    @staticmethod
    async def get_relationship_bond(user_id: str) -> Optional[Dict]:
        """Get relationship bond data for a user"""
        if USE_SUPABASE:
            results = Database._supabase_read(Tables.RELATIONSHIP_BONDS, {"user_id": user_id}, limit=1)
            return results[0] if results else None
        elif mongo_db:
            return await mongo_db.relationship_bonds.find_one({"user_id": user_id}, {"_id": 0})
        return None
    
    @staticmethod
    async def update_relationship_bond(user_id: str, bond_data: Dict) -> Dict:
        """Update relationship bond for a user"""
        now = datetime.now(timezone.utc)
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            **bond_data,
            "updated_at": now.isoformat()
        }
        
        if USE_SUPABASE:
            existing = await Database.get_relationship_bond(user_id)
            if existing:
                doc["id"] = existing["id"]
                result = Database._supabase_write(
                    Tables.RELATIONSHIP_BONDS, "update", doc, {"user_id": user_id}
                )
            else:
                doc["created_at"] = now.isoformat()
                result = Database._supabase_write(Tables.RELATIONSHIP_BONDS, "insert", doc)
            return result if result else doc
        elif mongo_db:
            await mongo_db.relationship_bonds.update_one(
                {"user_id": user_id},
                {"$set": doc},
                upsert=True
            )
        return doc
    
    @staticmethod
    async def get_user_training(user_id: str) -> List[Dict]:
        """Get user training data"""
        if USE_SUPABASE:
            return Database._supabase_read(Tables.USER_TRAINING, {"user_id": user_id}, "created_at", True) or []
        elif mongo_db:
            return await mongo_db.user_training.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return []
    
    @staticmethod
    async def save_user_training(user_id: str, training_type: str, data: Dict) -> Dict:
        """Save user training data"""
        now = datetime.now(timezone.utc)
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "training_type": training_type,
            "data": data,
            "created_at": now.isoformat()
        }
        
        if USE_SUPABASE:
            result = Database._supabase_write(Tables.USER_TRAINING, "insert", doc)
            return result if result else doc
        elif mongo_db:
            await mongo_db.user_training.insert_one(doc)
        return doc


# Export the database instance
db = Database()
