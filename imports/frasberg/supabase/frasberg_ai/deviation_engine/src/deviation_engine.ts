// Thresholds for drift alerts
const HIGH_DRIFT_THRESHOLD = 40;
const CRITICAL_DRIFT_THRESHOLD = 75;

export const deviationEngine = {
  initialize() {
    return {
      baseline: 0,
      deviation: 0,
      direction: "neutral",
      alert: null,
      stability: 1.0,
      history: []
    };
  },

  update(state: any, input: any) {
    const delta = input?.delta ?? 0;

    // compute next deviation
    let next = state.deviation + delta;

    // clamp to safe range
    if (next > 100) next = 100;
    if (next < -100) next = -100;

    // determine direction
    let direction = "neutral";
    if (next > state.deviation) direction = "positive";
    if (next < state.deviation) direction = "negative";

    // drift alert logic
    let alert = null;
    const magnitude = Math.abs(next);

    if (magnitude >= CRITICAL_DRIFT_THRESHOLD) {
      alert = "critical_drift";
    } else if (magnitude >= HIGH_DRIFT_THRESHOLD) {
      alert = "high_drift";
    }

    // stability scoring
    let stability = 1 - magnitude / 100;

    // penalties for alerts
    if (alert === "high_drift") stability -= 0.15;
    if (alert === "critical_drift") stability -= 0.35;

    // clamp stability
    if (stability < 0) stability = 0;
    if (stability > 1) stability = 1;

    // event record
    const event = {
      previous: state.deviation,
      next,
      delta,
      direction,
      alert,
      stability,
      timestamp: Date.now()
    };

    return {
      ...state,
      deviation: next,
      direction,
      alert,
      stability,
      history: [...state.history, event]
    };
  },

  compute(state: any) {
    return {
      deviation: state.deviation,
      magnitude: Math.abs(state.deviation),
      direction: state.direction,
      alert: state.alert ?? null,
      stability: state.stability,
      history: state.history
    };
  }
};
