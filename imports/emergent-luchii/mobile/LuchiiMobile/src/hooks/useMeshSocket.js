import { useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useMeshStore } from '../store/meshStore';
import {
  initSodium,
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  signMessage,
  verifyMessage,
} from '../crypto/sodium';
import { WS_URL } from '../config';

const MAX_RETRIES = 10;

export function useMeshSocket() {
  const ws = useRef(null);
  const retryCount = useRef(0);
  const retryTimer = useRef(null);
  const {
    setConnected, setKeyPair, setClientId,
    addMessage, keyPair, serverPublicKey,
    currentVoice
  } = useMeshStore();

  // ─── INIT KEYS ──────────────────────────────────────────
  const initKeys = async () => {
    await initSodium();
    let storedPrivKey = await EncryptedStorage.getItem('luchii_priv_key');
    let storedPubKey = await EncryptedStorage.getItem('luchii_pub_key');
    if (!storedPrivKey || !storedPubKey) {
      const kp = await generateKeyPair();
      await EncryptedStorage.setItem('luchii_priv_key', JSON.stringify(Array.from(kp.privateKey)));
      await EncryptedStorage.setItem('luchii_pub_key', JSON.stringify(Array.from(kp.publicKey)));
      setKeyPair(kp);
    } else {
      setKeyPair({
        privateKey: new Uint8Array(JSON.parse(storedPrivKey)),
        publicKey: new Uint8Array(JSON.parse(storedPubKey)),
      });
    }
  };

  // ─── CONNECT ────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!keyPair) await initKeys();
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = async () => {
      setConnected(true);
      retryCount.current = 0;
      console.log('✅ Luchii Mesh connected');
      ws.current.send(JSON.stringify({
        type: 'handshake',
        publicKey: Array.from(keyPair?.publicKey || []),
        voice: currentVoice,
      }));
    };

    ws.current.onmessage = async (event) => {
      try {
        const envelope = JSON.parse(event.data);
        if (envelope.type === 'handshake_ack') {
          useMeshStore.getState().setServerPublicKey(
            new Uint8Array(envelope.serverPublicKey)
          );
          setClientId(envelope.clientId);
          return;
        }
        const { sig, ...payload } = envelope;
        const serverPubKey = useMeshStore.getState().serverPublicKey;
        if (serverPubKey && sig) {
          const valid = await verifyMessage(payload, sig, serverPubKey);
          if (!valid) {
            console.warn('⚠️ Tamper detected — dropping message');
            return;
          }
        }
        const currentKeyPair = useMeshStore.getState().keyPair;
        if (envelope.ciphertext && envelope.nonce && serverPubKey && currentKeyPair) {
          const decrypted = await decryptMessage(
            envelope.ciphertext,
            envelope.nonce,
            serverPubKey,
            currentKeyPair.privateKey
          );
          addMessage({ ...decrypted, direction: 'incoming' });
        } else if (envelope.content) {
          addMessage({ ...envelope, direction: 'incoming' });
        }
      } catch (err) {
        console.error('Message processing error:', err);
      }
    };

    ws.current.onclose = () => {
      setConnected(false);
      if (retryCount.current < MAX_RETRIES) {
        const delay = Math.pow(1.5, retryCount.current) * 1000;
        retryCount.current++;
        console.warn(`🔄 Reconnecting in ${(delay / 1000).toFixed(1)}s...`);
        retryTimer.current = setTimeout(connect, delay);
      }
    };

    ws.current.onerror = () => ws.current?.close();
  }, [keyPair, currentVoice]);

  // ─── SEND MESSAGE ───────────────────────────────────────
  const sendMessage = useCallback(async (content) => {
    const state = useMeshStore.getState();
    const { keyPair: kp, serverPublicKey: serverPubKey } = state;
    const payload = {
      role: 'user',
      content,
      timestamp: Date.now(),
      voice: state.currentVoice,
    };
    let packet;
    if (kp && serverPubKey) {
      const { ciphertext, nonce } = await encryptMessage(payload, serverPubKey, kp.privateKey);
      const envelope = { ciphertext, nonce, type: 'message' };
      const sig = await signMessage(envelope, kp.privateKey);
      packet = JSON.stringify({ ...envelope, sig });
    } else {
      packet = JSON.stringify(payload);
    }
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(packet);
      addMessage({ ...payload, direction: 'outgoing' });
    } else {
      const queue = JSON.parse(await AsyncStorage.getItem('offline_queue') || '[]');
      queue.push(packet);
      await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
      console.log('📦 Message queued offline');
    }
  }, []);

  // ─── FLUSH OFFLINE QUEUE ────────────────────────────────
  const flushOfflineQueue = useCallback(async () => {
    const queue = JSON.parse(await AsyncStorage.getItem('offline_queue') || '[]');
    if (!queue.length) return;
    for (const packet of queue) {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(packet);
      }
    }
    await AsyncStorage.removeItem('offline_queue');
    console.log(`📤 Flushed ${queue.length} offline messages`);
  }, []);

  useEffect(() => {
    initKeys().then(connect);
    return () => {
      clearTimeout(retryTimer.current);
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    if (useMeshStore.getState().connected) {
      flushOfflineQueue();
    }
  }, [useMeshStore.getState().connected]);

  return { sendMessage };
}
