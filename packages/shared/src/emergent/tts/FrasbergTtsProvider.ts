export interface FrasbergTtsProvider {
  /** Returns a URL or local path to the generated audio. Rejects if synthesis fails. */
  synthesize(text: string): Promise<string>;
}