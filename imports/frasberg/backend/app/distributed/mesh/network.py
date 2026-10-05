from fastapi import APIRouter, WebSocket, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import hashlib
import time
from enum import Enum

router = APIRouter(prefix="/api/v4/mesh", tags=["distributed-mesh"])

class NodeStatus(str, Enum):
    ACTIVE = "active"
    DEGRADED = "degraded"
    OFFLINE = "offline"
    JOINING = "joining"

class MeshNode(BaseModel):
    node_id: str
    hostname: str
    port: int
    region: str
    status: NodeStatus
    capabilities: List[str]
    load_percent: float
    last_heartbeat: str
    version: str

class MeshTopology(BaseModel):
    topology_id: str
    total_nodes: int
    active_nodes: int
    regions: List[str]
    nodes: List[MeshNode]
    mesh_health: float

# Active mesh nodes
mesh_nodes: Dict[str, MeshNode] = {}

def generate_node_id(hostname: str, port: int) -> str:
    """Generate unique node ID"""
    data = f"{hostname}:{port}:{time.time()}"
    return hashlib.sha256(data.encode()).hexdigest()[:16]

@router.post("/join", response_model=MeshNode)
def join_mesh(hostname: str, port: int, region: str, capabilities: List[str]):
    """Join the distributed mesh network"""
    
    node_id = generate_node_id(hostname, port)
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    node = MeshNode(
        node_id=node_id,
        hostname=hostname,
        port=port,
        region=region,
        status=NodeStatus.JOINING,
        capabilities=capabilities,
        load_percent=0.0,
        last_heartbeat=timestamp,
        version="4.0.0"
    )
    
    mesh_nodes[node_id] = node
    
    # Broadcast to other nodes (simplified)
    asyncio.create_task(broadcast_node_join(node))
    
    # Mark as active after sync
    node.status = NodeStatus.ACTIVE
    
    return node

async def broadcast_node_join(node: MeshNode):
    """Broadcast new node to mesh"""
    # In production: actual P2P broadcast
    await asyncio.sleep(0.1)
    print(f"Node {node.node_id} joined mesh in region {node.region}")

@router.post("/heartbeat/{node_id}")
def send_heartbeat(node_id: str, load_percent: float, status: NodeStatus):
    """Send heartbeat to maintain mesh presence"""
    
    if node_id not in mesh_nodes:
        raise HTTPException(404, "Node not found in mesh")
    
    node = mesh_nodes[node_id]
    node.load_percent = load_percent
    node.status = status
    node.last_heartbeat = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    return {
        "node_id": node_id,
        "heartbeat_received": True,
        "mesh_health": calculate_mesh_health()
    }

@router.get("/topology", response_model=MeshTopology)
def get_mesh_topology():
    """Get current mesh network topology"""
    
    active_nodes = [n for n in mesh_nodes.values() if n.status == NodeStatus.ACTIVE]
    regions = list(set(n.region for n in mesh_nodes.values()))
    
    topology_id = hashlib.sha256(
        f"{len(mesh_nodes)}:{time.time()}".encode()
    ).hexdigest()[:16]
    
    return MeshTopology(
        topology_id=topology_id,
        total_nodes=len(mesh_nodes),
        active_nodes=len(active_nodes),
        regions=regions,
        nodes=list(mesh_nodes.values()),
        mesh_health=calculate_mesh_health()
    )

def calculate_mesh_health() -> float:
    """Calculate overall mesh health score"""
    if not mesh_nodes:
        return 1.0
    
    active_count = sum(1 for n in mesh_nodes.values() if n.status == NodeStatus.ACTIVE)
    health = active_count / len(mesh_nodes)
    
    # Factor in load distribution
    if active_count > 0:
        avg_load = sum(n.load_percent for n in mesh_nodes.values() if n.status == NodeStatus.ACTIVE) / active_count
        load_factor = 1.0 - (avg_load / 100.0) * 0.3  # 30% max impact
        health *= load_factor
    
    return round(health, 3)

@router.get("/optimal-node")
def find_optimal_node(capability: str, preferred_region: Optional[str] = None):
    """Find optimal node for task execution"""
    
    candidates = [
        n for n in mesh_nodes.values()
        if n.status == NodeStatus.ACTIVE and capability in n.capabilities
    ]
    
    if preferred_region:
        regional_candidates = [n for n in candidates if n.region == preferred_region]
        if regional_candidates:
            candidates = regional_candidates
    
    if not candidates:
        raise HTTPException(404, "No suitable node found")
    
    # Select node with lowest load
    optimal = min(candidates, key=lambda n: n.load_percent)
    
    return {
        "node_id": optimal.node_id,
        "hostname": optimal.hostname,
        "port": optimal.port,
        "region": optimal.region,
        "load_percent": optimal.load_percent,
        "reason": "lowest_load"
    }

@router.websocket("/sync")
async def mesh_sync(websocket: WebSocket):
    """Real-time mesh synchronization"""
    await websocket.accept()
    
    try:
        while True:
            # Receive sync request
            data = await websocket.receive_json()
            
            if data.get("type") == "sync_request":
                # Send mesh state
                topology = get_mesh_topology()
                await websocket.send_json({
                    "type": "sync_response",
                    "topology": topology.dict()
                })
            
            elif data.get("type") == "node_update":
                # Process node update
                node_id = data.get("node_id")
                if node_id in mesh_nodes:
                    mesh_nodes[node_id].load_percent = data.get("load_percent", 0)
                    await websocket.send_json({
                        "type": "update_ack",
                        "node_id": node_id
                    })
    
    except Exception as e:
        await websocket.close()

@router.delete("/leave/{node_id}")
def leave_mesh(node_id: str):
    """Leave the mesh network gracefully"""
    
    if node_id not in mesh_nodes:
        raise HTTPException(404, "Node not found")
    
    node = mesh_nodes.pop(node_id)
    
    return {
        "node_id": node_id,
        "status": "left_mesh",
        "remaining_nodes": len(mesh_nodes)
    }
