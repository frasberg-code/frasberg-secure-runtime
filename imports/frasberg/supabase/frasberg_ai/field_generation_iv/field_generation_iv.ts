export type FieldGenerationIVState<T> = {
  generated: boolean;
  value: T;
};

export function generateFieldStateIV<T>(
  originIV: T,
  generator: (value: T) => T
): FieldGenerationIVState<T> {
  const value = generator(originIV);
  return {
    generated: true,
    value,
  };
}
