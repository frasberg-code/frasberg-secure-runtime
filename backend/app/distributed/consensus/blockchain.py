from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import hashlib
import time

router = APIRouter(prefix="/api/v4/consensus", tags=["blockchain-consensus"])

class Block(BaseModel):
    block_number: int
    timestamp: str
    data: Dict[str, Any]
    previous_hash: str
    current_hash: str
    nonce: int

class Blockchain(BaseModel):
    chain: List[Block]
    pending_data: List[Dict[str, Any]]
    difficulty: int

# Global blockchain
frasberg_chain = Blockchain(
    chain=[],
    pending_data=[],
    difficulty=4
)

def calculate_hash(block_number: int, timestamp: str, data: str, previous_hash: str, nonce: int) -> str:
    """Calculate block hash"""
    block_string = f"{block_number}{timestamp}{data}{previous_hash}{nonce}"
    return hashlib.sha256(block_string.encode()).hexdigest()

def create_genesis_block():
    """Create the first block"""
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    genesis_hash = calculate_hash(0, timestamp, "Genesis Block", "0", 0)
    
    genesis = Block(
        block_number=0,
        timestamp=timestamp,
        data={"type": "genesis", "message": "Frasberg v4.0.0 Blockchain Initialized"},
        previous_hash="0",
        current_hash=genesis_hash,
        nonce=0
    )
    
    frasberg_chain.chain.append(genesis)

# Initialize blockchain
if not frasberg_chain.chain:
    create_genesis_block()

@router.get("/chain")
def get_blockchain():
    """Get complete blockchain"""
    return {
        "chain_length": len(frasberg_chain.chain),
        "blocks": frasberg_chain.chain,
        "pending_count": len(frasberg_chain.pending_data)
    }

@router.post("/transaction")
def add_transaction(transaction_data: Dict[str, Any]):
    """Add transaction to pending pool"""
    
    transaction_data["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    frasberg_chain.pending_data.append(transaction_data)
    
    return {
        "status": "pending",
        "transaction": transaction_data,
        "pending_count": len(frasberg_chain.pending_data)
    }

@router.post("/mine")
def mine_block(miner_id: str):
    """Mine a new block (proof of work)"""
    
    if not frasberg_chain.pending_data:
        raise HTTPException(400, "No pending transactions to mine")
    
    last_block = frasberg_chain.chain[-1]
    new_block_number = last_block.block_number + 1
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    # Combine pending data
    block_data = {
        "transactions": frasberg_chain.pending_data,
        "miner": miner_id
    }
    
    data_string = str(block_data)
    nonce = 0
    
    # Proof of work
    while True:
        hash_attempt = calculate_hash(
            new_block_number,
            timestamp,
            data_string,
            last_block.current_hash,
            nonce
        )
        
        # Check if hash meets difficulty (starts with N zeros)
        if hash_attempt.startswith('0' * frasberg_chain.difficulty):
            break
        
        nonce += 1
        
        # Limit iterations for demo
        if nonce > 100000:
            break
    
    new_block = Block(
        block_number=new_block_number,
        timestamp=timestamp,
        data=block_data,
        previous_hash=last_block.current_hash,
        current_hash=hash_attempt,
        nonce=nonce
    )
    
    frasberg_chain.chain.append(new_block)
    frasberg_chain.pending_data = []
    
    return {
        "status": "mined",
        "block": new_block,
        "chain_length": len(frasberg_chain.chain)
    }

@router.get("/verify")
def verify_blockchain():
    """Verify blockchain integrity"""
    
    for i in range(1, len(frasberg_chain.chain)):
        current = frasberg_chain.chain[i]
        previous = frasberg_chain.chain[i-1]
        
        # Verify hash chain
        if current.previous_hash != previous.current_hash:
            return {
                "valid": False,
                "error": f"Hash chain broken at block {i}"
            }
        
        # Verify current hash
        recalculated = calculate_hash(
            current.block_number,
            current.timestamp,
            str(current.data),
            current.previous_hash,
            current.nonce
        )
        
        if current.current_hash != recalculated:
            return {
                "valid": False,
                "error": f"Hash mismatch at block {i}"
            }
    
    return {
        "valid": True,
        "chain_length": len(frasberg_chain.chain),
        "message": "Blockchain integrity verified"
    }
