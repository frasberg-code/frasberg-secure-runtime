from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Literal
import uuid
from datetime import datetime, timezone
import asyncio
import time
import base64
import io
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import database layer
from db.database import db, Database

# Import LLM service
from services.llm_service import llm_service, SOFIA_SYSTEM_PROMPT, ADMIN_EMAILS

# Import routes
from routes.persona import router as persona_router

# Create the main app
app = FastAPI(title="Sofia Console API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================
# Models
# ============================================

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    session_id: str
    message: str
    model: str = "gpt-4o"
    provider: str = "openai"

class ChatResponse(BaseModel):
    id: str
    session_id: str
    message: ChatMessage
    created_at: datetime

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    title: str
    messages: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TTSRequest(BaseModel):
    text: str
    voice_id: str = "sofia"

class TTSResponse(BaseModel):
    audio_url: str
    text: str

class STTResponse(BaseModel):
    transcribed_text: str
    filename: str

class SofiaCoreFile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    path: str
    repo: str
    branch: str
    sha: str
    size: int
    content: Optional[str] = None
    last_synced_at: datetime
    status: str
    last_error: Optional[str] = None
    is_deployed: bool = False
    deployed_at: Optional[datetime] = None

class SofiaCoreSyncStatus(BaseModel):
    last_run_at: Optional[datetime] = None
    last_success_at: Optional[datetime] = None
    last_error_at: Optional[datetime] = None
    last_error: Optional[str] = None
    files_synced: int = 0
    files_failed: int = 0
    duration_seconds: Optional[float] = None

class DeployRequest(BaseModel):
    file_ids: List[str]

# ============================================
# ElevenLabs Integration
# ============================================

ELEVENLABS_VOICE_MAP = {
    "shimmer": "JBFqnCBsd6RMkjVDRZzb",
    "nova": "pFZP5JQG7iQjIQuC4Bku",
    "alloy": "21m00Tcm4TlvDq8ikWAM",
    "echo": "VR6AewLTigWG4xSOukaG",
    "fable": "jsCqWAovK2LkecY7zXl4",
    "onyx": "ErXwobaYiN019PkySvjV",
    "sofia": "JBFqnCBsd6RMkjVDRZzb",
}

DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"

async def text_to_speech(text: str, voice_id: str = None) -> bytes:
    """Convert text to speech using ElevenLabs"""
    try:
        from elevenlabs import ElevenLabs
        from elevenlabs.types import VoiceSettings
        
        api_key = os.environ.get('ELEVENLABS_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
        
        eleven_client = ElevenLabs(api_key=api_key)
        
        if voice_id:
            actual_voice_id = ELEVENLABS_VOICE_MAP.get(voice_id.lower(), voice_id)
        else:
            actual_voice_id = DEFAULT_VOICE_ID
        
        voice_settings = VoiceSettings(
            stability=0.45,
            similarity_boost=0.80,
            style=0.35,
            use_speaker_boost=True
        )
        
        logger.info(f"TTS: Using voice ID {actual_voice_id} for text: {text[:50]}...")
        
        audio_generator = eleven_client.text_to_speech.convert(
            text=text,
            voice_id=actual_voice_id,
            model_id="eleven_multilingual_v2",
            voice_settings=voice_settings
        )
        
        audio_data = b""
        for chunk in audio_generator:
            audio_data += chunk
        
        logger.info(f"TTS: Generated {len(audio_data)} bytes of audio")
        return audio_data
        
    except Exception as e:
        logger.error(f"TTS error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

async def speech_to_text(audio_content: bytes, filename: str = "audio.wav") -> str:
    """Convert speech to text using ElevenLabs"""
    try:
        from elevenlabs import ElevenLabs
        
        api_key = os.environ.get('ELEVENLABS_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
        
        logger.info(f"STT: Processing {len(audio_content)} bytes of audio from {filename}")
        
        eleven_client = ElevenLabs(api_key=api_key)
        
        audio_file = io.BytesIO(audio_content)
        audio_file.name = filename
        
        transcription_response = eleven_client.speech_to_text.convert(
            file=audio_file,
            model_id="scribe_v1"
        )
        
        if hasattr(transcription_response, 'text'):
            transcribed_text = transcription_response.text
        else:
            transcribed_text = str(transcription_response)
        
        logger.info(f"STT: Transcribed text: {transcribed_text[:100] if transcribed_text else 'empty'}...")
        return transcribed_text
        
    except Exception as e:
        logger.error(f"STT error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"STT error: {str(e)}")

# ============================================
# Sofia Core GitHub Sync
# ============================================

SOFIA_CORE_REPO = os.environ.get("SOFIA_CORE_REPO", "emeraldorbit/sofia-core-backend")
SOFIA_CORE_BRANCH = os.environ.get("SOFIA_CORE_BRANCH", "main")
SOFIA_CORE_GITHUB_TOKEN = os.environ.get("SOFIA_CORE_GITHUB_TOKEN")
DEPLOY_ROOT = Path("/app/sofia_core_mirror")
TEXT_EXTENSIONS = {".ts", ".tsx", ".js", ".json", ".md", ".yml", ".yaml", ".py"}
MAX_CONTENT_LEN = 200_000

def _is_text_file(path: str) -> bool:
    return Path(path).suffix in TEXT_EXTENSIONS

async def sync_sofia_core_repo() -> SofiaCoreSyncStatus:
    """Sync files from Sofia Core GitHub repository"""
    start = time.monotonic()
    files_synced = 0
    files_failed = 0
    last_error: Optional[str] = None
    
    if not SOFIA_CORE_GITHUB_TOKEN:
        return SofiaCoreSyncStatus(
            last_run_at=datetime.now(timezone.utc),
            last_error="GitHub token not configured",
            last_error_at=datetime.now(timezone.utc)
        )
    
    headers = {
        "Authorization": f"Bearer {SOFIA_CORE_GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
    }
    
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            tree_resp = await http_client.get(
                f"https://api.github.com/repos/{SOFIA_CORE_REPO}/git/trees/{SOFIA_CORE_BRANCH}",
                params={"recursive": "1"},
                headers=headers,
            )
            tree_resp.raise_for_status()
            tree = tree_resp.json()
            
            for item in tree.get("tree", []):
                if item.get("type") != "blob":
                    continue
                path = item["path"]
                if not _is_text_file(path):
                    continue
                
                try:
                    content_resp = await http_client.get(
                        f"https://api.github.com/repos/{SOFIA_CORE_REPO}/contents/{path}",
                        headers=headers,
                    )
                    content_resp.raise_for_status()
                    content_json = content_resp.json()
                    
                    raw_bytes = base64.b64decode(content_json["content"])
                    text = raw_bytes.decode("utf-8", errors="replace")
                    
                    truncated = False
                    if len(text) > MAX_CONTENT_LEN:
                        text = text[:MAX_CONTENT_LEN]
                        truncated = True
                    
                    doc = {
                        "id": str(uuid.uuid4()),
                        "path": path,
                        "repo": SOFIA_CORE_REPO,
                        "branch": SOFIA_CORE_BRANCH,
                        "sha": content_json["sha"],
                        "size": content_json["size"],
                        "content": text,
                        "last_synced_at": datetime.now(timezone.utc),
                        "status": "truncated" if truncated else "ok",
                        "is_deployed": False,
                    }
                    
                    await db.upsert_sofia_core_file(doc)
                    files_synced += 1
                except Exception as e:
                    files_failed += 1
                    last_error = str(e)
                    logger.error(f"Error syncing file {path}: {e}")
        except Exception as e:
            last_error = str(e)
            logger.error(f"Error fetching repo tree: {e}")
    
    duration = time.monotonic() - start
    now = datetime.now(timezone.utc)
    
    status_doc = {
        "last_run_at": now,
        "duration_seconds": duration,
        "files_synced": files_synced,
        "files_failed": files_failed,
    }
    if last_error:
        status_doc["last_error"] = last_error
        status_doc["last_error_at"] = now
    else:
        status_doc["last_success_at"] = now
    
    await db.update_sync_status(status_doc)
    return SofiaCoreSyncStatus(**status_doc)

async def deploy_files(file_ids: List[str]) -> Dict[str, str]:
    """Deploy selected files to local mirror"""
    DEPLOY_ROOT.mkdir(parents=True, exist_ok=True)
    results: Dict[str, str] = {}
    
    for file_id in file_ids:
        try:
            doc = await db.get_sofia_core_file(file_id)
            if not doc:
                results[file_id] = "not found"
                continue
            
            target_path = DEPLOY_ROOT / doc["path"]
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(doc.get("content", ""), encoding="utf-8")
            
            deploy_result = await db.mark_files_deployed([file_id])
            results[file_id] = deploy_result.get(file_id, "deployed")
        except Exception as e:
            results[file_id] = f"error: {e}"
    
    return results

# ============================================
# API Routes - Basic
# ============================================

@api_router.get("/")
async def root():
    return {"message": "Sofia Console API", "status": "healthy", "database": "supabase" if os.environ.get('SUPABASE_URL') else "mongodb"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    doc = await db.create_status_check(input.client_name)
    return StatusCheck(
        id=doc["id"],
        client_name=doc["client_name"],
        timestamp=datetime.fromisoformat(doc["timestamp"]) if isinstance(doc["timestamp"], str) else doc["timestamp"]
    )

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    checks = await db.get_status_checks()
    result = []
    for check in checks:
        ts = check.get('timestamp')
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts)
        result.append(StatusCheck(
            id=check.get('id', str(uuid.uuid4())),
            client_name=check['client_name'],
            timestamp=ts
        ))
    return result

# ============================================
# API Routes - Chat
# ============================================

@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a chat message and get AI response"""
    try:
        # Get or create conversation
        conversation = await db.get_conversation(request.session_id)
        
        if not conversation:
            conversation = await db.create_conversation(
                request.session_id,
                request.message[:50] + "..." if len(request.message) > 50 else request.message
            )
        
        # Get existing messages
        messages = conversation.get("messages", [])
        
        # Add user message
        user_message = {"role": "user", "content": request.message}
        messages.append(user_message)
        
        # Get LLM response using the LLM service
        response_text = await llm_service.get_response(
            messages,
            model=request.model,
            provider=request.provider
        )
        
        # Add assistant message
        assistant_message = {"role": "assistant", "content": response_text}
        messages.append(assistant_message)
        
        # Update conversation
        await db.update_conversation(request.session_id, messages)
        
        return ChatResponse(
            id=str(uuid.uuid4()),
            session_id=request.session_id,
            message=ChatMessage(role="assistant", content=response_text),
            created_at=datetime.now(timezone.utc)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/conversations")
async def get_conversations():
    """Get all conversations"""
    return await db.get_all_conversations()

@api_router.get("/conversations/{session_id}")
async def get_conversation(session_id: str):
    """Get a specific conversation"""
    conversation = await db.get_conversation(session_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@api_router.delete("/conversations/{session_id}")
async def delete_conversation(session_id: str):
    """Delete a conversation"""
    result = await db.delete_conversation(session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation deleted"}

# ============================================
# API Routes - Voice (TTS/STT)
# ============================================

@api_router.post("/tts")
async def generate_tts(request: TTSRequest):
    """Generate text-to-speech audio"""
    audio_data = await text_to_speech(request.text, request.voice_id)
    audio_b64 = base64.b64encode(audio_data).decode()
    
    return TTSResponse(
        audio_url=f"data:audio/mpeg;base64,{audio_b64}",
        text=request.text
    )

@api_router.post("/tts/stream")
async def stream_tts(request: TTSRequest):
    """Stream text-to-speech audio"""
    audio_data = await text_to_speech(request.text, request.voice_id)
    
    return StreamingResponse(
        io.BytesIO(audio_data),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "attachment; filename=speech.mp3"}
    )

@api_router.post("/stt", response_model=STTResponse)
async def transcribe_audio(audio_file: UploadFile = File(...)):
    """Transcribe audio to text using ElevenLabs STT"""
    audio_content = await audio_file.read()
    filename = audio_file.filename or "recording.wav"
    
    logger.info(f"STT endpoint: Received {len(audio_content)} bytes from {filename}")
    
    transcribed_text = await speech_to_text(audio_content, filename)
    
    return STTResponse(
        transcribed_text=transcribed_text,
        filename=filename
    )

@api_router.get("/voices")
async def get_voices():
    """Get available voices"""
    return [
        {"id": "sofia", "name": "Sofia", "description": "Default - Young, warm, expressive", "language": "en"},
        {"id": "shimmer", "name": "Shimmer", "description": "Soft and expressive feminine voice", "language": "en"},
        {"id": "nova", "name": "Nova", "description": "Friendly and upbeat", "language": "en"},
        {"id": "alloy", "name": "Alloy", "description": "Warm and professional", "language": "en"},
        {"id": "fable", "name": "Fable", "description": "British feminine accent", "language": "en"},
        {"id": "echo", "name": "Echo", "description": "Deep masculine voice", "language": "en"},
        {"id": "onyx", "name": "Onyx", "description": "Deep and authoritative", "language": "en"},
    ]

# ============================================
# API Routes - Advanced Voice System
# ============================================

from voice_layer import (
    VOICE_CAPABILITIES, VOICE_PROFILES, PERSONAS, VOICE_MAP,
    VoiceProfile, VoiceSession, VoiceMetrics, VoiceEvent,
    load_voice_profile, resolve_voice, assign_variant,
    compute_text_hash, EmotionalState
)

voice_sessions: Dict[str, VoiceSession] = {}

class VoiceSpeakRequest(BaseModel):
    text: str
    voice_profile: str = "v_conv_neutral"
    persona: str = "default"
    user_id: Optional[str] = None

class VoiceTuneRequest(BaseModel):
    voice_id: str
    prosody: Optional[Dict] = None
    emotion_bias: Optional[Dict] = None

class VoiceSessionRequest(BaseModel):
    user_id: str
    persona: str = "default"

@api_router.get("/voice/capabilities")
async def get_voice_capabilities():
    return VOICE_CAPABILITIES

@api_router.get("/voice/profiles")
async def get_voice_profiles():
    return {k: v.model_dump() for k, v in VOICE_PROFILES.items()}

@api_router.get("/voice/personas")
async def get_personas():
    return PERSONAS

@api_router.get("/voice/map")
async def get_voice_map():
    return VOICE_MAP

@api_router.post("/voice/speak")
async def speak(request: VoiceSpeakRequest):
    """Generate speech with persona and emotional awareness"""
    try:
        user_id = request.user_id or str(uuid.uuid4())
        if user_id not in voice_sessions:
            voice_sessions[user_id] = VoiceSession(user_id)
        
        session = voice_sessions[user_id]
        voice = session.get_voice(request.persona)
        backend_voice_id = VOICE_MAP.get(request.voice_profile, "bk_voice_conv_v1")
        
        audio_data = await text_to_speech(request.text)
        audio_b64 = base64.b64encode(audio_data).decode()
        
        await db.log_voice_event(
            event_type="TTS",
            voice_profile=backend_voice_id,
            caller="voice/speak",
            text_hash=compute_text_hash(request.text)
        )
        
        return {
            "status": "ok",
            "audio_url": f"data:audio/mpeg;base64,{audio_b64}",
            "voice_profile": backend_voice_id,
            "persona": request.persona,
            "text_hash": compute_text_hash(request.text)
        }
    except Exception as e:
        logger.error(f"Voice speak error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/voice/tune")
async def tune_voice(request: VoiceTuneRequest):
    """Live tune voice parameters (admin)"""
    try:
        if request.voice_id not in VOICE_PROFILES:
            raise HTTPException(status_code=404, detail="Voice profile not found")
        
        profile = VOICE_PROFILES[request.voice_id]
        
        if request.prosody:
            for key, value in request.prosody.items():
                if hasattr(profile.prosody, key):
                    setattr(profile.prosody, key, value)
        
        if request.emotion_bias:
            for key, value in request.emotion_bias.items():
                if hasattr(profile.emotion_bias, key):
                    setattr(profile.emotion_bias, key, value)
        
        await db.log_voice_event(
            event_type="TUNE",
            voice_profile=request.voice_id,
            caller="voice/tune"
        )
        
        return {"status": "updated", "voice": profile.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice tune error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/voice/session/start")
async def start_voice_session(request: VoiceSessionRequest):
    session = VoiceSession(request.user_id)
    voice_sessions[request.user_id] = session
    
    return {
        "user_id": request.user_id,
        "variant": session.variant,
        "voice_id": session.current_voice_id,
        "emotion_state": session.emotion_state.model_dump()
    }

@api_router.post("/voice/session/interrupt/{user_id}")
async def interrupt_voice(user_id: str):
    if user_id in voice_sessions:
        voice_sessions[user_id].interrupt()
        return {"status": "interrupted"}
    return {"status": "no_session"}

@api_router.get("/voice/session/{user_id}")
async def get_voice_session(user_id: str):
    if user_id not in voice_sessions:
        raise HTTPException(status_code=404, detail="Voice session not found")
    
    session = voice_sessions[user_id]
    return {
        "user_id": user_id,
        "speaking": session.speaking,
        "variant": session.variant,
        "voice_id": session.current_voice_id,
        "emotion_state": session.emotion_state.model_dump()
    }

@api_router.get("/voice/ab_metrics")
async def get_ab_metrics():
    return []  # TODO: Implement metrics retrieval

@api_router.get("/voice/emotion_history/{user_id}")
async def get_emotion_history(user_id: str):
    return []  # TODO: Implement emotion history

@api_router.get("/voice/events")
async def get_voice_events(limit: int = 50):
    return await db.get_voice_events(limit)

# ============================================
# API Routes - Sofia Core Admin
# ============================================

@api_router.get("/admin/sofia-core/sync/status", response_model=SofiaCoreSyncStatus)
async def get_sync_status():
    doc = await db.get_sync_status()
    if not doc:
        return SofiaCoreSyncStatus()
    return SofiaCoreSyncStatus(**doc)

@api_router.post("/admin/sofia-core/sync/run", response_model=SofiaCoreSyncStatus)
async def run_sync():
    return await sync_sofia_core_repo()

@api_router.get("/admin/sofia-core/files", response_model=List[SofiaCoreFile])
async def list_files(
    deployed: Optional[bool] = None,
    path_prefix: Optional[str] = None,
):
    files = await db.get_sofia_core_files(deployed, path_prefix)
    result = []
    for doc in files:
        try:
            result.append(SofiaCoreFile(**doc))
        except Exception as e:
            logger.error(f"Error parsing file doc: {e}")
    return result

@api_router.get("/admin/sofia-core/files/{file_id}", response_model=SofiaCoreFile)
async def get_file(file_id: str):
    doc = await db.get_sofia_core_file(file_id)
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")
    return SofiaCoreFile(**doc)

@api_router.post("/admin/sofia-core/deploy")
async def deploy_endpoint(req: DeployRequest):
    results = await deploy_files(req.file_ids)
    return results

# ============================================
# API Routes - Video Calling (Daily.co)
# ============================================

DAILY_API_KEY = os.environ.get("DAILY_API_KEY", "")
DAILY_DOMAIN = os.environ.get("DAILY_DOMAIN", "sofia")
DAILY_API_URL = "https://api.daily.co/v1"

class RoomCreate(BaseModel):
    room_name: str
    participant_name: str
    privacy: str = "public"

class JoinRoomRequest(BaseModel):
    participant_name: str

@api_router.post("/calls/rooms")
async def create_call_room(request: RoomCreate):
    """Create a new video call room"""
    try:
        room_name = f"{request.room_name}-{str(uuid.uuid4())[:8]}"
        room_url = f"https://{DAILY_DOMAIN}.daily.co/{room_name}"
        
        call_record = await db.create_call(
            room_name=room_name,
            room_url=room_url,
            initiator_name=request.participant_name,
            privacy=request.privacy
        )
        
        return {
            "room_url": room_url,
            "room_name": room_name,
            "token": f"mock-token-{uuid.uuid4().hex[:16]}",
            "created_at": call_record["created_at"]
        }
        
    except Exception as e:
        logger.error(f"Error creating call room: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/calls/rooms/{room_name}/join")
async def join_call_room(room_name: str, request: JoinRoomRequest):
    """Join an existing call room"""
    try:
        call = await db.get_call(room_name)
        
        if not call:
            raise HTTPException(status_code=404, detail="Room not found")
        
        await db.add_participant_to_call(room_name, request.participant_name)
        
        return {
            "room_url": call["room_url"],
            "room_name": room_name,
            "token": f"mock-token-{uuid.uuid4().hex[:16]}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining room: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/calls/rooms/{room_name}/end")
async def end_call(room_name: str):
    """End a call"""
    try:
        result = await db.end_call(room_name)
        
        if not result:
            raise HTTPException(status_code=404, detail="Call not found")
        
        return {"status": "ended", "room_name": room_name}
        
    except Exception as e:
        logger.error(f"Error ending call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/calls/rooms/{room_name}/participants")
async def get_room_participants(room_name: str):
    """Get participants in a room"""
    call = await db.get_call(room_name)
    
    if not call:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return {
        "room_name": room_name,
        "participants": call.get("participants", []),
        "participant_count": len(call.get("participants", []))
    }

# ============================================
# API Routes - Music Generation
# ============================================

class MusicGenerateRequest(BaseModel):
    prompt: str
    duration: int = 30
    genre: Optional[str] = None

@api_router.post("/music/generate")
async def generate_music(request: MusicGenerateRequest):
    """Generate music using AI"""
    try:
        music_record = await db.create_music(
            prompt=request.prompt,
            duration=request.duration,
            genre=request.genre
        )
        
        return {
            "id": music_record["id"],
            "status": "completed",
            "bpm": music_record["bpm"],
            "message": "Music generation feature is being configured. Demo track created."
        }
        
    except Exception as e:
        logger.error(f"Music generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/music/library")
async def get_music_library():
    """Get user's generated music library"""
    return await db.get_music_library()

# ============================================
# API Routes - Video Generation (Sora 2)
# ============================================

class VideoGenerateRequest(BaseModel):
    prompt: str
    duration: int = 5
    aspect_ratio: str = "16:9"
    quality: str = "high"
    style: str = "realistic"

@api_router.post("/video/generate")
async def generate_video(request: VideoGenerateRequest):
    """Generate video using Sora 2"""
    try:
        video_record = await db.create_video(
            prompt=request.prompt,
            duration=request.duration,
            aspect_ratio=request.aspect_ratio,
            quality=request.quality,
            style=request.style
        )
        
        return {
            "id": video_record["id"],
            "status": "completed",
            "message": "Video generation with Sora 2 is being configured. Demo video created."
        }
        
    except Exception as e:
        logger.error(f"Video generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/video/library")
async def get_video_library():
    """Get user's generated video library"""
    return await db.get_video_library()

# ============================================
# Include Router and Middleware
# ============================================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Startup/Shutdown Events
# ============================================

@app.on_event("startup")
async def startup_event():
    """Start background tasks"""
    logger.info("Starting Sofia Console API...")
    logger.info(f"Database: {'Supabase' if os.environ.get('SUPABASE_URL') else 'MongoDB'}")
    
    async def periodic_sync():
        while True:
            try:
                if SOFIA_CORE_GITHUB_TOKEN:
                    logger.info("Running periodic Sofia Core sync...")
                    await sync_sofia_core_repo()
            except Exception as e:
                logger.error(f"Periodic sync error: {e}")
            await asyncio.sleep(3600)
    
    asyncio.create_task(periodic_sync())

@app.on_event("shutdown")
async def shutdown_db_client():
    """Cleanup on shutdown"""
    logger.info("Shutting down Sofia Console API...")
