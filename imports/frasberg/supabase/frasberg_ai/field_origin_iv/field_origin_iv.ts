export type FieldOriginIVState<T> = {
  originated: boolean;
  value: T;
};

export function originateFieldStateIV<T>(
  seed: T,
  originFn: (value: T) => T
): FieldOriginIVState<T> {
  const value = originFn(seed);
  return {
    originated: true,
    value,
  };
}
