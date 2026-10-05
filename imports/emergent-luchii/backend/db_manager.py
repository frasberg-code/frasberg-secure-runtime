import os
from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

import auth as auth_module

router = APIRouter(prefix="/dbm")

_default_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
DEFAULT_DB = os.environ["DB_NAME"]


def _jsonable(v):
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, datetime):
        return v.isoformat()
    if isinstance(v, dict):
        return {k: _jsonable(x) for k, x in v.items()}
    if isinstance(v, list):
        return [_jsonable(x) for x in v]
    if isinstance(v, bytes):
        return f"<binary · {len(v)} bytes>"
    return v


class DbmBody(BaseModel):
    app_name: str = ""
    mongo_url: str = ""
    collection: Optional[str] = None
    skip: int = 0
    limit: int = 20
    doc_id: Optional[str] = None
    update: Optional[dict] = None


def _resolve_db(body: DbmBody):
    url = body.mongo_url.strip()
    name = body.app_name.strip()
    if url:
        client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=6000)
        if not name:
            try:
                name = client.get_default_database().name
            except Exception:
                name = DEFAULT_DB
        return client[name]
    if not name:
        raise HTTPException(status_code=400, detail="Provide at least one: App Name or MongoDB URL")
    return _default_client[name]


@router.get("/info")
async def dbm_info(user: dict = Depends(auth_module.get_current_user)):
    return {"default_db": DEFAULT_DB}


@router.post("/connect")
async def dbm_connect(body: DbmBody, user: dict = Depends(auth_module.get_current_user)):
    db = _resolve_db(body)
    try:
        names = await db.list_collection_names()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not connect: {str(e)[:140]}")
    cols = []
    for n in sorted(names):
        try:
            count = await db[n].estimated_document_count()
        except Exception:
            count = 0
        cols.append({"name": n, "count": count})
    return {"db": db.name, "collections": cols}


@router.post("/docs")
async def dbm_docs(body: DbmBody, user: dict = Depends(auth_module.get_current_user)):
    if not body.collection:
        raise HTTPException(status_code=400, detail="collection required")
    db = _resolve_db(body)
    col = db[body.collection]
    limit = max(1, min(50, body.limit))
    try:
        total = await col.estimated_document_count()
        docs = await col.find({}).skip(max(0, body.skip)).limit(limit).to_list(limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Query failed: {str(e)[:140]}")
    return {"total": total, "docs": [_jsonable(d) for d in docs]}


def _id_query(doc_id: str):
    try:
        return {"$or": [{"_id": doc_id}, {"_id": ObjectId(doc_id)}]}
    except Exception:
        return {"_id": doc_id}


@router.post("/delete")
async def dbm_delete(body: DbmBody, user: dict = Depends(auth_module.get_current_user)):
    if not body.collection or not body.doc_id:
        raise HTTPException(status_code=400, detail="collection and doc_id required")
    db = _resolve_db(body)
    res = await db[body.collection].delete_one(_id_query(body.doc_id))
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"deleted": body.doc_id}


@router.post("/update")
async def dbm_update(body: DbmBody, user: dict = Depends(auth_module.get_current_user)):
    if not body.collection or not body.doc_id or not isinstance(body.update, dict):
        raise HTTPException(status_code=400, detail="collection, doc_id and update object required")
    db = _resolve_db(body)
    fields = {k: v for k, v in body.update.items() if k != "_id"}
    if not fields:
        raise HTTPException(status_code=400, detail="Nothing to update")
    res = await db[body.collection].update_one(_id_query(body.doc_id), {"$set": fields})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"updated": body.doc_id}
