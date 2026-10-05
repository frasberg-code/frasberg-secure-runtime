export function recover(error: any) {
  return {
    recovered: true,
    fallback: 'text-only',
    reason: error?.message || 'unknown error',
  };
}
