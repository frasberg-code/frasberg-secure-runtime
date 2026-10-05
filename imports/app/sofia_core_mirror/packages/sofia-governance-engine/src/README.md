# Deviation Engine

The Deviation Engine computes directional drift, magnitude, and historical
deviation values for Sofia Core. It provides three primary operations:

### initialize()
Creates a new deviation state with baseline values.

### update(state, input)
Applies a delta to the deviation value and records the change in history.

### compute(state)
Returns the current deviation, magnitude, and full history.

This engine is refined under Issue #2 (v1.0.1).
