import sodium from 'react-native-libsodium';

let initialized = false;

export async function initSodium() {
  if (!initialized) {
    await sodium.ready;
    initialized = true;
  }
}

// ─── KEY GENERATION ───────────────────────────────────────
export async function generateKeyPair() {
  await initSodium();
  return sodium.crypto_box_keypair();
  // Returns { publicKey: Uint8Array, privateKey: Uint8Array }
}

export async function generateSymmetricKey() {
  await initSodium();
  return sodium.crypto_secretbox_keygen();
}

// ─── ENCRYPT MESSAGE (Box — asymmetric) ──────────────────
export async function encryptMessage(message, recipientPublicKey, senderPrivateKey) {
  await initSodium();
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const messageBytes = sodium.from_string(JSON.stringify(message));
  const ciphertext = sodium.crypto_box_easy(
    messageBytes,
    nonce,
    recipientPublicKey,
    senderPrivateKey
  );
  return {
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
  };
}

// ─── DECRYPT MESSAGE ──────────────────────────────────────
export async function decryptMessage(ciphertext, nonce, senderPublicKey, recipientPrivateKey) {
  await initSodium();
  const decrypted = sodium.crypto_box_open_easy(
    sodium.from_base64(ciphertext),
    sodium.from_base64(nonce),
    senderPublicKey,
    recipientPrivateKey
  );
  return JSON.parse(sodium.to_string(decrypted));
}

// ─── SIGN & VERIFY ────────────────────────────────────────
export async function signMessage(message, privateKey) {
  await initSodium();
  const msgBytes = sodium.from_string(JSON.stringify(message));
  const signature = sodium.crypto_sign_detached(msgBytes, privateKey);
  return sodium.to_base64(signature);
}

export async function verifyMessage(message, signature, publicKey) {
  await initSodium();
  const msgBytes = sodium.from_string(JSON.stringify(message));
  return sodium.crypto_sign_verify_detached(
    sodium.from_base64(signature),
    msgBytes,
    publicKey
  );
}
