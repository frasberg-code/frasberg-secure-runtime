"""Frasberg AI Webhook Server"""

from fastapi import FastAPI, Request, BackgroundTasks
import httpx
import hmac
import hashlib

app = FastAPI(title="Frasberg Webhooks")

async def send_webhook(url: str, event: str, data: dict):
    """Send webhook to external service"""
    async with httpx.AsyncClient() as client:
        await client.post(url, json={
            "event": event,
            "data": data,
            "source": "frasberg-ai"
        })

@app.post("/webhooks/register")
async def register_webhook(url: str, events: list):
    """Register webhook endpoint"""
    # Store in database
    return {
        "webhook_id": "wh_123",
        "url": url,
        "events": events,
        "status": "active"
    }

@app.post("/webhooks/trigger")
async def trigger_webhook(event: str, data: dict, background_tasks: BackgroundTasks):
    """Trigger webhooks for event"""
    # Get all webhooks subscribed to this event
    webhooks = []  # Query from database
    
    for webhook in webhooks:
        background_tasks.add_task(send_webhook, webhook['url'], event, data)
    
    return {"triggered": len(webhooks)}
