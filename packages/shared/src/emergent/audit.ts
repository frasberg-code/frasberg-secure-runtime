export function audit(event: string, payload: any) {
  console.log(`[AUDIT] ${event}`, {
    timestamp: Date.now(),
    payload,
  });
}
