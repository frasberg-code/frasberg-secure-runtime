export function useIdentity() {
  return {
    owner: import.meta.env.VITE_FRASBERG_OWNER
  };
}
