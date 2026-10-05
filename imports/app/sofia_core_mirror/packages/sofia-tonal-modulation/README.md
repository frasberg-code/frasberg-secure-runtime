# @emeraldorbit/sofia-tonal-modulation

Tonal modulation engine for Sofia Core, governing affective resonance and expressive coherence.

## Features

- **Tonal Engine**: Affective resonance modeling and expressive coherence validation
- **Resonance Conductor**: Unifies outputs from multiple engines into harmonized composites
- **Register Management**: Supports ceremonial, operational, and conceptual registers
- **Tonal Shaping**: Modulates tonal qualities and intensity

## Installation

```bash
pnpm add @emeraldorbit/sofia-tonal-modulation
```

## Usage

```typescript
import { tonalEngine, conductResonance } from '@emeraldorbit/sofia-tonal-modulation';

// Initialize tonal state
const state = tonalEngine.initialize();

// Shape tonal qualities
const shaped = tonalEngine.shape(state, { 
  register: 'ceremonial', 
  intensity: 0.8 
});

// Conduct resonance across signals
const result = conductResonance([1, 2, 3, 4, 5], 'average');
```

## API

### `tonalEngine`

- `initialize()`: Initialize tonal engine state
- `shape(state, input)`: Shape tonal qualities
- `modulate(state, target)`: Modulate affective resonance
- `validate(state)`: Validate expressive coherence

### `conductResonance(signals, strategy)`

Conducts resonance across multiple signals using 'average', 'first', or 'last' strategy.

## License

MIT
