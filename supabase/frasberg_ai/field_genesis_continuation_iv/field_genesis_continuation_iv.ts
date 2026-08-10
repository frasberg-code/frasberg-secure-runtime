export type FieldGenesisContinuationIVState<T> = {
  continued: boolean;
  value: T;
};

export function continueGenesisStateIV<T>(
  generationIV: T,
  continuer: (value: T) => T
): FieldGenesisContinuationIVState<T> {
  const value = continuer(generationIV);
  return {
    continued: true,
    value,
  };
}
