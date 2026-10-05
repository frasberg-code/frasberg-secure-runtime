from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import hashlib
import time
import json

router = APIRouter(prefix="/api/v2/governance/audit", tags=["audit-logging"])

class AuditEntry(BaseModel):
    event_type: str
    actor: str
    action: str
    target: str
    metadata: dict
    timestamp: Optional[str] = None

class AuditChainResponse(BaseModel):
    entry_id: str
    previous_hash: str
    current_hash: str
    timestamp: str
    chain_valid: bool

# In-memory chain (in production: use database)
audit_chain = []

def hash_entry(entry: dict, previous_hash: str) -> str:
    """Create hash for audit entry"""
    entry_str = json.dumps(entry, sort_keys=True)
    data = f"{previous_hash}:{entry_str}"
    return hashlib.sha256(data.encode()).hexdigest()

@router.post("/log", response_model=AuditChainResponse)
def log_audit_event(entry: AuditEntry):
    """Log event to hash-chained audit log"""
    
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    entry.timestamp = timestamp
    
    # Get previous hash
    previous_hash = audit_chain[-1]["current_hash"] if audit_chain else "GENESIS"
    
    # Create entry dict
    entry_dict = entry.dict()
    entry_id = hashlib.sha256(f"{timestamp}:{entry.actor}".encode()).hexdigest()[:16]
    entry_dict["entry_id"] = entry_id
    
    # Calculate current hash
    current_hash = hash_entry(entry_dict, previous_hash)
    
    # Add to chain
    chain_entry = {
        "entry_id": entry_id,
        "previous_hash": previous_hash,
        "current_hash": current_hash,
        "timestamp": timestamp,
        "data": entry_dict
    }
    audit_chain.append(chain_entry)
    
    return AuditChainResponse(
        entry_id=entry_id,
        previous_hash=previous_hash,
        current_hash=current_hash,
        timestamp=timestamp,
        chain_valid=True
    )

@router.get("/chain")
def get_audit_chain():
    """Get complete audit chain"""
    return {
        "chain_length": len(audit_chain),
        "entries": audit_chain,
        "genesis_hash": audit_chain[0]["previous_hash"] if audit_chain else None
    }

@router.get("/verify")
def verify_audit_chain():
    """Verify integrity of audit chain"""
    if not audit_chain:
        return {"valid": True, "message": "Empty chain"}
    
    for i in range(1, len(audit_chain)):
        current = audit_chain[i]
        previous = audit_chain[i-1]
        
        # Verify hash chain
        if current["previous_hash"] != previous["current_hash"]:
            return {
                "valid": False,
                "error": f"Chain broken at entry {i}",
                "entry_id": current["entry_id"]
            }
    
    return {
        "valid": True,
        "chain_length": len(audit_chain),
        "message": "Audit chain integrity verified"
    }
