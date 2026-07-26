import asyncio
import base64
import io
import logging
import os
import tempfile
import threading
import wave

os.environ.setdefault("COQUI_TOS_AGREED", "1")

logger = logging.getLogger(__name__)

WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "large-v3")
COQUI_MODEL = os.environ.get("COQUI_MODEL", "tts_models/en/vctk/vits")

TONE_SPEAKERS = {"warm": "p335", "business": "p226", "firm": "p251"}
DEFAULT_SPEAKER = "p273"

VOICES = [
    {"id": "p273", "name": "Orion", "description": "Balanced & clear", "default": True},
    {"id": "p335", "name": "Lyra", "description": "Warm & friendly"},
    {"id": "p226", "name": "Atlas", "description": "Composed business tone"},
    {"id": "p251", "name": "Vega", "description": "Firm & direct"},
    {"id": "p225", "name": "Nova", "description": "Bright & youthful"},
    {"id": "p234", "name": "Selene", "description": "Calm & soft-spoken"},
    {"id": "p245", "name": "Rhea", "description": "Deep & thoughtful"},
    {"id": "p326", "name": "Titan", "description": "Bold & resonant"},
]
VOICE_IDS = {v["id"] for v in VOICES}

_state = {"stt": "idle", "tts": "idle"}
_whisper = None
_tts = None
_stt_lock = threading.Lock()
_tts_lock = threading.Lock()


def _load_whisper():
    global _whisper
    try:
        _state["stt"] = "loading"
        from faster_whisper import WhisperModel
        _whisper = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
        _state["stt"] = "ready"
        logger.info("Sovereign STT ready: whisper-%s", WHISPER_MODEL)
    except Exception:
        logger.exception("Sovereign STT failed to load")
        _state["stt"] = "unavailable"


def _load_tts():
    global _tts
    try:
        _state["tts"] = "loading"
        from TTS.api import TTS
        _tts = TTS(COQUI_MODEL, progress_bar=False)
        _state["tts"] = "ready"
        logger.info("Sovereign TTS ready: %s", COQUI_MODEL)
    except Exception:
        logger.exception("Sovereign TTS failed to load")
        _state["tts"] = "unavailable"


def preload():
    if _state["stt"] == "idle":
        threading.Thread(target=_load_whisper, daemon=True).start()
    if _state["tts"] == "idle":
        threading.Thread(target=_load_tts, daemon=True).start()


def preload_sync():
    if _state["stt"] in ("idle", "unavailable"):
        _load_whisper()
    if _state["tts"] in ("idle", "unavailable"):
        _load_tts()


def status():
    return {
        "sovereign": True,
        "provider": "Frasberg Sovereign Voice Engine",
        "stt": {"model": f"whisper-{WHISPER_MODEL}", "status": _state["stt"]},
        "tts": {"model": COQUI_MODEL, "status": _state["tts"]},
    }


async def transcribe(raw: bytes, suffix: str):
    if _state["stt"] != "ready":
        return None

    def run():
        with _stt_lock:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
                tmp.write(raw)
                tmp.flush()
                segments, _info = _whisper.transcribe(tmp.name, vad_filter=True, beam_size=5)
                return " ".join(s.text.strip() for s in segments).strip()

    return await asyncio.to_thread(run)


async def speak(text: str, tone=None, voice=None):
    if _state["tts"] != "ready":
        return None
    if voice and voice in VOICE_IDS:
        speaker = voice
    else:
        speaker = TONE_SPEAKERS.get((tone or "").lower(), DEFAULT_SPEAKER)

    def run():
        import numpy as np
        with _tts_lock:
            wav = _tts.tts(text=text, speaker=speaker)
            sr = _tts.synthesizer.output_sample_rate
        arr = (np.clip(np.asarray(wav, dtype=np.float32), -1.0, 1.0) * 32767).astype(np.int16)
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sr)
            w.writeframes(arr.tobytes())
        return base64.b64encode(buf.getvalue()).decode("utf-8")

    return await asyncio.to_thread(run)
