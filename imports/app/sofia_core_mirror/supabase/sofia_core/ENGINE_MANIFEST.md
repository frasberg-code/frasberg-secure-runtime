# Sofia Core — Engine Manifest

This manifest provides a unified, human‑readable overview of every engine in Sofia Core.  
It complements `VERSION_MAP.json` by offering descriptive, examiner‑ready context for each module.

Each engine listed here includes:
- Name  
- Version  
- Directory  
- Purpose  
- Dependencies  
- Registration key  
- Notes  

---

## 1. Deviation Engine

**Name:** deviation_engine  
**Version:** 1.0.1  
**Directory:** `supabase/sofia_core/deviation_engine`  
**Registration Key:** `deviation_engine`

### Purpose
Provides quantitative drift measurement for the entire system.  
Outputs deviation, direction, alert thresholds, stability scoring, and structured history events.

### Dependencies
- None (foundational engine)

### Consumed By
- membrane_engine  
- identity_filter  
- tonal_engine  

### Notes
This engine is the primary stability signal for Sofia Core.  
All other engines rely on its deviation and stability metrics.

---

## 2. Identity Filter Engine

**Name:** identity_filter  
**Version:** 1.0.0  
**Directory:** `supabase/sofia_core/identity_filter`  
**Registration Key:** `identity_filter`

### Purpose
Ensures all outputs remain aligned with Sofia’s identity constraints, persona boundaries, and behavioral rules.

### Dependencies
- deviation_engine (for stability‑aware filtering)

### Notes
Acts as the final gatekeeper before output leaves the system.

---

## 3. Membrane Engine

**Name:** membrane_engine  
**Version:** 1.0.0  
**Directory:** `supabase/sofia_core/membrane_engine`  
**Registration Key:** `membrane_engine`

### Purpose
Controls contextual permeability, conversational boundaries, and drift‑aware membrane tightening.

### Dependencies
- deviation_engine (for drift‑based membrane adjustments)

### Notes
Serves as the boundary layer between internal reasoning and external context.

---

## 4. Tonal Engine

**Name:** tonal_engine  
**Version:** 1.0.0  
**Directory:** `supabase/sofia_core/tonal_engine`  
**Registration Key:** `tonal_engine`

### Purpose
Modulates tone, emotional expression, and stylistic consistency across responses.

### Dependencies
- deviation_engine (for stability‑aware tone shaping)
- identity_filter (for persona alignment)

### Notes
Ensures expressive coherence while respecting identity constraints.

---

# Global Integration

All engines are registered in:

`supabase/sofia_core/sofia_core_index.ts`

This file exposes the unified engine map used by the entire Sofia Core pipeline.

---

# Version Source of Truth

Machine‑readable versions:  
`VERSION_MAP.json`

Human‑readable versions:  
`ENGINE_MANIFEST.md` (this file)

---

# System Version

**Sofia Core Version:** 1.0.1

This reflects the integration of the deviation engine and completion of Issue #2.
