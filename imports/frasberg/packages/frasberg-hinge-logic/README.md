# @frasberg/hinge-logic

Hinge logic engine for Frasberg AI, enabling transitions, pivots, and identity-state shifts.

## Features

- **Hinge Logic**: State transition orchestration
- **Pivot Mechanics**: Smooth state-to-state pivots
- **Field Shifts**: Directional field state shifting
- **Transition Tracking**: Progress monitoring for state transitions

## Installation

```bash
pnpm add @frasberg/hinge-logic
```

## Usage

```typescript
import { hingeLogic, shiftFieldState } from '@frasberg/hinge-logic';

// Initialize a transition
const transition = hingeLogic.initializeTransition(
  { value: 'start' }, 
  { value: 'end' }
);

// Execute a pivot
const pivoted = hingeLogic.pivot(transition, 0.2);

// Check if complete
const complete = hingeLogic.isComplete(pivoted);

// Get current state
const current = hingeLogic.getCurrentState(pivoted);

// Shift field state
const shifted = shiftFieldState(
  { data: 'original' },
  (state) => ({ ...state, transformed: true })
);
```

## API

### `hingeLogic`

- `initializeTransition(from, to)`: Start a transition between states
- `pivot(transition, step)`: Execute a pivot with progress step
- `isComplete(transition)`: Check if transition is complete
- `getCurrentState(transition)`: Get current state during transition

### `shiftFieldState(modulated, shifter)`

Applies directional shift logic to produce shifted field state.

## License

UNLICENSED - Proprietary

**Creator:** Frasberg Selassie (Mr. Clayton-M. Bernard-Ex.)
