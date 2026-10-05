# Sofia Core — Release Notes v1.0.1

## Overview
Version 1.0.1 introduces the first fully integrated stability layer for Sofia Core.
This release finalizes the deviation engine, aligns all engine registrations, and establishes the documentation and versioning framework that will govern all future updates.

This version marks the transition from internal development to public availability.

---

## 🔧 Engine Updates

### 1. Deviation Engine — v1.0.1
**Status:** Fully implemented, tested, and integrated  
**Highlights:**
- Drift measurement (−100 to 100)
- Direction detection (positive / negative / neutral)
- Stability scoring (0.0–1.0)
- Alert thresholds (high / critical)
- Structured event history
- Full spec + test suite

This engine now serves as the stability signal for the entire system.

---

### 2. Identity Filter Engine — v1.0.0
**Status:** Integrated  
**Highlights:**
- Persona boundary enforcement
- Identity‑aligned output filtering
- Stability‑aware adjustments
- Full spec + test suite

Now consumes deviation metrics for stability‑aware filtering.

---

### 3. Membrane Engine — v1.0.0
**Status:** Integrated  
**Highlights:**
- Boundary enforcement
- Contextual permeability
- Drift‑aware membrane tightening
- Full spec + test suite

Now responds dynamically to deviation engine signals.

---

### 4. Tonal Engine — v1.0.0
**Status:** Integrated  
**Highlights:**
- Tone shaping
- Emotional modulation
- Style consistency
- Identity‑aligned expression
- Full spec + test suite

Now uses both identity and deviation signals for coherent tone shaping.

---

## 📁 Structural & Documentation Updates

### New Files
- `ENGINE_MANIFEST.md` — human‑readable engine registry  
- `VERSION_MAP.json` — machine‑readable version registry  
- `ROADMAP_v1.0.2.md` — development cycle plan  
- `GLOBAL_README.md` — public overview of the system  

### Cleanup
- Removed recursive folder duplication  
- Normalized directory structure under `supabase/sofia_core/`
- Ensured all engines follow the unified structure:
  - `src/*.ts`
  - `*_spec.json`
  - `*.test.ts`
  - `index.ts`
  - global registration

---

## 🔗 Integration, System Version, and Public Release Status

All engines are now registered in:
supabase/sofia_core/sofia_core_index.ts

This file exposes the unified engine map used by the entire Sofia Core pipeline.

**Sofia Core Version:** `1.0.1`  
This reflects the completion of Issue #2 and the activation of the deviation engine as the system’s stability foundation.

This release marks the first public‑ready version of Sofia Core.  
The system is now stable, documented, and ready for external developers.
