export type LuchiiModel =
  'luchii-chat' | 'luchii-vision' | 'luchii-music' | 'gt6-runtime';

const RULES: Array<[RegExp, LuchiiModel]> = [
  [/\b(music|song|beat|melody)\b/i, 'luchii-music'],
  [/\b(image|photo|picture|vision|see)\b/i, 'luchii-vision'],
  [/\b(race|simulate|physics|gt6)\b/i, 'gt6-runtime'],
];

export class LuchiiModelRouter {
  route(input: string): LuchiiModel {
    for (const [pattern, model] of RULES) {
      if (pattern.test(input)) return model;
    }
    return 'luchii-chat';
  }
}
