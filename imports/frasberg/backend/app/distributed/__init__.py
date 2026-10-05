from fastapi import APIRouter
from .mesh.network import router as mesh_router
from .coordination.engine import router as coordination_router
from .consensus.blockchain import router as consensus_router
from .discovery.registry import router as discovery_router

distributed_router = APIRouter()
distributed_router.include_router(mesh_router)
distributed_router.include_router(coordination_router)
distributed_router.include_router(consensus_router)
distributed_router.include_router(discovery_router)

@distributed_router.get("/api/v4/distributed/status")
def distributed_system_status():
    return {
        "distributed_system": "operational",
        "version": "4.0.0",
        "capabilities": {
            "mesh_networking": True,
            "distributed_coordination": True,
            "blockchain_consensus": True,
            "service_discovery": True,
            "p2p_communication": True,
            "zero_downtime_failover": True
        }
    }
