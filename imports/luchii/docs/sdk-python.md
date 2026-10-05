# Python SDK

## Install

```bash
pip install frasberg-luchii
```

## Initialize

```python
from luchii import Luchii

luchii = Luchii(api_key="<LUCHII_KEY>", client_id="creator-22")
```

## Market

```python
signal = luchii.market.signal("BTCUSDT")
print(signal)
```

## Lead Routing

```python
route = luchii.lead.route({
    "lead_id": "L-8821",
    "pressure": 0.64
})
```

## Coaching

```python
nbl = luchii.coach.next_line({
    "context": "I need to explain impact clearly.",
    "persona": "confident"
})
```

## Memory

```python
luchii.memory.store({
    "memory_type": "session",
    "content": {"event": "next-line-generated", "topic": "hook"},
    "tags": ["coaching"]
})
```

## ASSISIS Rep

```python
reply = luchii.assist.rep({
    "intent": "follow_up",
    "context": "Can you send details after the call?"
})
```

## Persona Skin

```python
luchii.skin.persona({
    "persona_id": "executive",
    "traits": {"tone": "direct", "style": "operator"}
})
```

## Runtime Pipeline Example

```python
signal = luchii.market.signal("BTCUSDT")
route = luchii.lead.route({"lead_id": "L-8821", "pressure": signal.get("confidence", 0.5)})
nbl = luchii.coach.next_line({"context": "Transition to CTA", "persona": "executive"})
luchii.memory.store({"memory_type": "session", "content": {"signal": signal, "route": route, "nbl": nbl}})
```
