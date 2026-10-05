# Sofia Core — Master Index

This index lists every active engine in Sofia Core, along with its purpose and integration status.

---

## deviation_engine

**Path:** `supabase/sofia_core/deviation_engine`  
**Version:** 1.0.1  
**Purpose:**  
Tracks conversational drift by computing deviation, direction, alert thresholds, stability scoring, and structured history events.

**Inputs:**  
- `delta` — numeric change applied to deviation.

**State Fields:**  
- `deviation` — current drift value (clamped −100 to 100)  
- `direction` — positive, negative, or neutral  
- `alert` — `high_drift`, `critical_drift`, or null  
- `stability` — normalized score (0.0–1.0)  
- `history[]` — timestamped drift events  

**Outputs (compute):**  
- deviation  
- magnitude  
- direction  
- alert  
- stability  
- history  

**Thresholds:**  
- HIGH_DRIFT_THRESHOLD = 40  
- CRITICAL_DRIFT_THRESHOLD = 75  

**Integration:**  
Registered in `sofia_core_index.ts` under key:  
