"""
Supabase Client Configuration for Sofia AI Platform
Primary database for all operations
"""
import os
from supabase import create_client, Client
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# Initialize Supabase clients
_supabase_client: Optional[Client] = None
_supabase_admin_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """Get Supabase client with anon key (for read operations)"""
    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise ValueError("Supabase credentials not configured")
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        logger.info("Supabase client initialized (anon)")
    return _supabase_client

def get_supabase_admin_client() -> Client:
    """Get Supabase client with service role key (for write operations)"""
    global _supabase_admin_client
    if _supabase_admin_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("Supabase admin credentials not configured")
        _supabase_admin_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        logger.info("Supabase admin client initialized (service_role)")
    return _supabase_admin_client

# Table names
class Tables:
    USERS = "users"
    CONVERSATIONS = "conversations"
    MESSAGES = "messages"
    VOICE_EVENTS = "voice_events"
    VOICE_METRICS = "voice_metrics"
    EMOTION_STATES = "emotion_states"
    SOFIA_CORE_FILES = "sofia_core_files"
    SOFIA_CORE_SYNC_STATUS = "sofia_core_sync_status"
    CALLS = "calls"
    GENERATED_MUSIC = "generated_music"
    GENERATED_VIDEOS = "generated_videos"
    STATUS_CHECKS = "status_checks"
    
    # Phase 2: Persona Evolution System Tables
    PERSONA_SETTINGS = "persona_settings"
    PERSONA_EMOTIONAL_RANGE = "persona_emotional_range"
    PERSONA_TRIGGERS = "persona_triggers"
    PERSONA_LEARNING_STYLE = "persona_learning_style"
    USER_MEMORY = "user_memory"
    USER_MEMORY_TIMELINE = "user_memory_timeline"
    USER_TRAINING = "user_training"
    USER_PREFERENCES = "user_preferences"
    RELATIONSHIP_BONDS = "relationship_bonds"
    
    # Future Tables
    REAL_ESTATE_LISTINGS = "real_estate_listings"
    REAL_ESTATE_VALUATIONS = "real_estate_valuations"
    CONTENT_PROJECTS = "content_projects"
    MUSIC_PROJECTS = "music_projects"
    STREAM_SESSIONS = "stream_sessions"
    CRYPTO_WALLETS = "crypto_wallets"
    CRYPTO_TRANSACTIONS = "crypto_transactions"
    TRADING_ORDERS = "trading_orders"
    TRADING_POSITIONS = "trading_positions"
