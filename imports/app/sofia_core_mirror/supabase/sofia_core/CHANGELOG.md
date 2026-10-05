# Sofia Core — Changelog

All notable changes to the Sofia Core system are documented here.  
This file follows semantic versioning and records engine additions, refinements, and structural updates.

---

## [1.0.1] — Deviation Engine Integration
**Date:** 2026‑01‑10  
**Status:** Complete

### Added
- Full implementation of `deviation_engine` including:
  - deviation tracking (−100 to 100)
  - direction detection
  - drift alert thresholds (high, critical)
  - stability scoring (0.0–1.0)
  - structured history events
- Complete specification file (`deviation_engine_spec.json`)
- Full test suite (`deviation_engine.test.ts`)
- Export wrapper (`index.ts`)
- Global registration in `sofia_core_index.ts`
- Documentation updates in `GLOBAL_README.md` and `MASTER_INDEX.md`

### Notes
This release finalizes Issue #2 and establishes the deviation engine as a foundational signal provider for membrane, identity, and tonal engines.

---

## [1.0.0] — Initial System Release
**Date:** 2026‑01‑01  
**Status:** Baseline

### Added
- Core engine architecture
- Identity Filter Engine
- Membrane Engine
- Tonal Engine
- Unified index system
- Initial documentation
