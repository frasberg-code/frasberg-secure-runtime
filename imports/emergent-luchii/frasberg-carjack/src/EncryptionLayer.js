// ── Frasberg Carjack — EncryptionLayer (libsodium crypto_box E2E) ─────────────
// Keypair generated on init. Shared secret derived after key exchange with the
// server. encrypt() → nonce + ciphertext (base64). Falls back to plaintext
// before the handshake completes (safe for the key exchange message itself).

import sodium from 'libsodium-wrappers';

export class EncryptionLayer {
  constructor() {
    this.ready        = false;
    this.keypair      = null;
    this.sharedSecret = null;
  }

  async init() {
    await sodium.ready;
    this.keypair = sodium.crypto_box_keypair();
    this.ready   = true;
    console.log('[EncryptionLayer] 🔐 Keypair generated.');
  }

  get publicKeyB64() {
    return this.ready ? sodium.to_base64(this.keypair.publicKey) : null;
  }

  get established() {
    return !!this.sharedSecret;
  }

  deriveSharedSecret(serverPublicKeyB64) {
    if (!this.ready) return false;
    try {
      this.sharedSecret = sodium.crypto_box_beforenm(
        sodium.from_base64(serverPublicKeyB64),
        this.keypair.privateKey
      );
      console.log('[EncryptionLayer] 🔐 Shared secret derived.');
      return true;
    } catch (e) {
      console.error('[EncryptionLayer] Key derivation failed:', e.message);
      return false;
    }
  }

  // Returns encrypted envelope { __enc, n, c } — or the plain object pre-handshake
  encrypt(obj) {
    if (!this.sharedSecret) return obj;
    const nonce  = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    const cipher = sodium.crypto_box_easy_afternm(
      JSON.stringify(obj), nonce, this.sharedSecret
    );
    return { __enc: 1, n: sodium.to_base64(nonce), c: sodium.to_base64(cipher) };
  }

  // Accepts an envelope or a plain object; returns verified plaintext object
  decrypt(env) {
    if (!env || !env.__enc) return env;
    if (!this.sharedSecret) return null;
    try {
      const plain = sodium.crypto_box_open_easy_afternm(
        sodium.from_base64(env.c), sodium.from_base64(env.n), this.sharedSecret
      );
      return JSON.parse(sodium.to_string(plain));
    } catch (e) {
      console.error('[EncryptionLayer] Decrypt failed (tampered?):', e.message);
      return null;
    }
  }

  destroy() {
    this.sharedSecret = null;
    this.keypair      = null;
    this.ready        = false;
  }
}
