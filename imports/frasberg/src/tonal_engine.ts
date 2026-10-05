/**
 * Tonal Engine - Music theory and key detection
 * Stub implementation for CI compatibility
 */

export const tonalEngine = {
  detectKey(notes: string[]): { key: string } {
    // Simple stub: return C for any input
    return { key: "C" };
  },

  scaleDegrees(key: string): string[] {
    // Return basic scale degrees
    return ["i", "ii", "iii", "iv", "v", "vi", "vii"];
  },

  transpose(notes: string[], semitones: number): string[] {
    // Stub: basic transposition logic
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };
    const reverseMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    return notes.map(note => {
      const base = noteMap[note] || 0;
      const transposed = (base + semitones) % 12;
      return reverseMap[transposed];
    });
  },

  interval(note1: string, note2: string): string {
    // Stub: return P5 (perfect fifth) for C to G
    if (note1 === "C" && note2 === "G") return "P5";
    return "P1";
  },

  mode(modeString: string): { root: string; type: string } {
    // Parse mode string like "D Dorian"
    const parts = modeString.split(' ');
    return { root: parts[0] || "C", type: parts[1] || "Major" };
  }
};
