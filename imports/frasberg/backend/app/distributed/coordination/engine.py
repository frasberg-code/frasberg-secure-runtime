from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import time
import hashlib

router = APIRouter(prefix="/api/v4/coordination", tags=["distributed-coordination"])

class DistributedTask(BaseModel):
    task_id: str
    task_type: str
    assigned_nodes: List[str]
    status: str
    result_aggregation: str
    created_at: str

class TaskResult(BaseModel):
    task_id: str
    node_id: str
    result: Any
    confidence: float
    duration_seconds: float

# Active distributed tasks
distributed_tasks: Dict[str, DistributedTask] = {}
task_results: Dict[str, List[TaskResult]] = {}

@router.post("/task/create", response_model=DistributedTask)
def create_distributed_task(
    task_type: str,
    task_data: Dict[str, Any],
    num_nodes: int = 3,
    aggregation: str = "consensus"
):
    """Create distributed task across mesh nodes"""
    
    task_id = hashlib.sha256(
        f"{task_type}:{time.time()}".encode()
    ).hexdigest()[:16]
    
    # Select nodes (in production: actual mesh node selection)
    assigned_nodes = [f"node_{i}" for i in range(num_nodes)]
    
    task = DistributedTask(
        task_id=task_id,
        task_type=task_type,
        assigned_nodes=assigned_nodes,
        status="dispatched",
        result_aggregation=aggregation,
        created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    )
    
    distributed_tasks[task_id] = task
    task_results[task_id] = []
    
    return task

@router.post("/task/{task_id}/result")
def submit_task_result(task_id: str, node_id: str, result: Any, confidence: float, duration: float):
    """Submit result from node"""
    
    if task_id not in distributed_tasks:
        raise HTTPException(404, "Task not found")
    
    task_result = TaskResult(
        task_id=task_id,
        node_id=node_id,
        result=result,
        confidence=confidence,
        duration_seconds=duration
    )
    
    task_results[task_id].append(task_result)
    
    # Check if all results received
    task = distributed_tasks[task_id]
    if len(task_results[task_id]) >= len(task.assigned_nodes):
        task.status = "aggregating"
    
    return {
        "task_id": task_id,
        "result_received": True,
        "total_results": len(task_results[task_id]),
        "expected_results": len(task.assigned_nodes)
    }

@router.get("/task/{task_id}/aggregate")
def aggregate_results(task_id: str):
    """Aggregate results from all nodes"""
    
    if task_id not in distributed_tasks:
        raise HTTPException(404, "Task not found")
    
    task = distributed_tasks[task_id]
    results = task_results[task_id]
    
    if len(results) < len(task.assigned_nodes):
        return {
            "task_id": task_id,
            "status": "incomplete",
            "received": len(results),
            "expected": len(task.assigned_nodes)
        }
    
    # Aggregate based on strategy
    if task.result_aggregation == "consensus":
        # Majority voting
        result_counts = {}
        for r in results:
            result_str = str(r.result)
            result_counts[result_str] = result_counts.get(result_str, 0) + 1
        
        final_result = max(result_counts, key=result_counts.get)
        consensus_confidence = result_counts[final_result] / len(results)
    
    elif task.result_aggregation == "weighted_average":
        # Weight by confidence
        total_weight = sum(r.confidence for r in results)
        if total_weight > 0:
            final_result = sum(float(r.result) * r.confidence for r in results) / total_weight
            consensus_confidence = total_weight / len(results)
        else:
            final_result = None
            consensus_confidence = 0.0
    
    else:
        # Simple average
        final_result = sum(float(r.result) for r in results) / len(results)
        consensus_confidence = sum(r.confidence for r in results) / len(results)
    
    task.status = "completed"
    
    return {
        "task_id": task_id,
        "status": "completed",
        "final_result": final_result,
        "consensus_confidence": consensus_confidence,
        "node_results": [
            {
                "node_id": r.node_id,
                "result": r.result,
                "confidence": r.confidence
            }
            for r in results
        ]
    }

@router.get("/task/{task_id}/status")
def get_task_status(task_id: str):
    """Get distributed task status"""
    
    if task_id not in distributed_tasks:
        raise HTTPException(404, "Task not found")
    
    task = distributed_tasks[task_id]
    results = task_results[task_id]
    
    return {
        "task_id": task_id,
        "status": task.status,
        "assigned_nodes": len(task.assigned_nodes),
        "results_received": len(results),
        "completion_percent": (len(results) / len(task.assigned_nodes)) * 100
    }
