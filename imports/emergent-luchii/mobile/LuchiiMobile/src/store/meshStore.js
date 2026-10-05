import { create } from 'zustand';

export const useMeshStore = create((set) => ({
  messages: [],
  connected: false,
  currentVoice: 'lyra',
  clientId: null,
  keyPair: null,
  serverPublicKey: null,
  setConnected: (val) => set({ connected: val }),
  setKeyPair: (kp) => set({ keyPair: kp }),
  setServerPublicKey: (key) => set({ serverPublicKey: key }),
  setClientId: (id) => set({ clientId: id }),
  setVoice: (voice) => set({ currentVoice: voice }),
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg]
  })),
  clearMessages: () => set({ messages: [] }),
}));
