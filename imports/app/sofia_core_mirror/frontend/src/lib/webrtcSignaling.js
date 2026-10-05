import { supabase } from '../api/supabaseClient';

// WebRTC signaling via Supabase Realtime

export function createSignalingChannel(callId, onSignal) {
  if (!supabase) {
    console.warn('Supabase not configured for signaling');
    return null;
  }

  const channel = supabase
    .channel(`call:${callId}`)
    .on('broadcast', { event: 'signal' }, ({ payload }) => {
      onSignal(payload);
    })
    .subscribe();

  return channel;
}

export async function sendSignal(callId, signal) {
  if (!supabase) return;

  await supabase.channel(`call:${callId}`).send({
    type: 'broadcast',
    event: 'signal',
    payload: signal,
  });
}
