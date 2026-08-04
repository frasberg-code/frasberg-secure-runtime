import sodium from "libsodium-wrappers";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_STORE = "luchii.e2e.device_key";
let ready = false;

export async function initCrypto() {
  await sodium.ready;
  ready = true;
  return sodium;
}

async function deviceKey() {
  if (!ready) await initCrypto();
  let hex = await AsyncStorage.getItem(KEY_STORE);
  if (!hex) {
    const key = sodium.crypto_secretbox_keygen();
    hex = sodium.to_hex(key);
    await AsyncStorage.setItem(KEY_STORE, hex);
  }
  return sodium.from_hex(hex);
}

export async function encryptLocal(plaintext) {
  const key = await deviceKey();
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const cipher = sodium.crypto_secretbox_easy(sodium.from_string(plaintext), nonce, key);
  return `${sodium.to_hex(nonce)}:${sodium.to_hex(cipher)}`;
}

export async function decryptLocal(payload) {
  const key = await deviceKey();
  const [nonceHex, cipherHex] = payload.split(":");
  const plain = sodium.crypto_secretbox_open_easy(sodium.from_hex(cipherHex), sodium.from_hex(nonceHex), key);
  return sodium.to_string(plain);
}

// Sealed-box channel: encrypt to the mesh server public key so only the
// origin server (holding the private key) can read the payload in transit.
export async function sealForServer(plaintext, serverPubKeyHex) {
  if (!ready) await initCrypto();
  const sealed = sodium.crypto_box_seal(sodium.from_string(plaintext), sodium.from_hex(serverPubKeyHex));
  return sodium.to_hex(sealed);
}

export async function generateKxPair() {
  if (!ready) await initCrypto();
  const pair = sodium.crypto_kx_keypair();
  return { publicKey: sodium.to_hex(pair.publicKey), privateKey: sodium.to_hex(pair.privateKey) };
}
