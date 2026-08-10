from fastapi import APIRouter
from pydantic import BaseModel
import hashlib
import time

router = APIRouter(prefix="/api/v2/voice/fingerprint", tags=["voice-fingerprint"])

class FingerprintRequest(BaseModel):
    audio_fingerprint: str
    metadata: dict

class FingerprintResponse(BaseModel):
    fingerprint_id: str
    hash_chain: str
    timestamp: str
    note: str

@router.post("/generate", response_model=FingerprintResponse)
def generate_fingerprint(request: FingerprintRequest):
    """Generate non-biometric voice fingerprint for audit purposes"""
    
    # Create fingerprint (NOT biometric identification)
    fingerprint_data = f"{request.audio_fingerprint}:{time.time()}"
    fingerprint_id = hashlib.sha256(fingerprint_data.encode()).hexdigest()
    
    # Create hash chain for audit
    metadata_hash = hashlib.sha256(str(request.metadata).encode()).hexdigest()
    hash_chain = hashlib.sha256(f"{fingerprint_id}:{metadata_hash}".encode()).hexdigest()
    
    return FingerprintResponse(
        fingerprint_id=fingerprint_id,
        hash_chain=hash_chain,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        note="Non-biometric fingerprint for audit/replay verification only"
    )
