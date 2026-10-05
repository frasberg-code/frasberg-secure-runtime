from fastapi import APIRouter
from .encryption.pqc import router as encryption_router
from .zkp.proofs import router as zkp_router

quantum_router = APIRouter()
quantum_router.include_router(encryption_router)
quantum_router.include_router(zkp_router)

@quantum_router.get("/api/v4/quantum/status")
def quantum_system_status():
    return {
        "quantum_cryptography": "operational",
        "version": "4.0.0",
        "capabilities": {
            "post_quantum_encryption": True,
            "algorithms": ["CRYSTALS-Kyber", "NTRU"],
            "quantum_safe_signatures": True,
            "signature_algorithms": ["CRYSTALS-Dilithium", "FALCON"],
            "zero_knowledge_proofs": True,
            "zkp_types": ["ZK-SNARKs", "ZK-STARKs", "Bulletproofs"],
            "future_proof": True
        }
    }
