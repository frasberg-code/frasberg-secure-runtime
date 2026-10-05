from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import time

router = APIRouter(prefix="/api/v4/discovery", tags=["service-discovery"])

class Service(BaseModel):
    service_id: str
    service_name: str
    version: str
    endpoints: List[str]
    node_id: str
    region: str
    health_check_url: str
    registered_at: str

# Service registry
service_registry: Dict[str, Service] = {}

@router.post("/register", response_model=Service)
def register_service(
    service_name: str,
    version: str,
    endpoints: List[str],
    node_id: str,
    region: str,
    health_check_url: str
):
    """Register service in discovery registry"""
    
    service_id = f"{service_name}_{node_id}_{int(time.time())}"
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    service = Service(
        service_id=service_id,
        service_name=service_name,
        version=version,
        endpoints=endpoints,
        node_id=node_id,
        region=region,
        health_check_url=health_check_url,
        registered_at=timestamp
    )
    
    service_registry[service_id] = service
    
    return service

@router.get("/services/{service_name}")
def discover_service(service_name: str, region: Optional[str] = None):
    """Discover service instances"""
    
    instances = [
        s for s in service_registry.values()
        if s.service_name == service_name
    ]
    
    if region:
        instances = [s for s in instances if s.region == region]
    
    return {
        "service_name": service_name,
        "instances_found": len(instances),
        "instances": instances
    }

@router.get("/registry")
def get_full_registry():
    """Get complete service registry"""
    return {
        "total_services": len(service_registry),
        "services": list(service_registry.values())
    }

@router.delete("/deregister/{service_id}")
def deregister_service(service_id: str):
    """Deregister service"""
    
    if service_id not in service_registry:
        raise HTTPException(404, "Service not found")
    
    service = service_registry.pop(service_id)
    
    return {
        "service_id": service_id,
        "status": "deregistered",
        "remaining_services": len(service_registry)
    }
