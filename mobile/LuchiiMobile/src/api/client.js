import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../config";

const TOKEN_KEY = "luchii.auth.token";

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
  return data;
}

export async function login(email, password) {
  const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  if (data.token) await AsyncStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function register(name, email, password) {
  const data = await request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
  if (data.token) await AsyncStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function me() {
  return request("/auth/me");
}

export async function logout() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function verifyMeshSignature(content, sig) {
  try {
    const data = await request("/mesh/verify", { method: "POST", body: JSON.stringify({ content, sig }) });
    return data.valid === true;
  } catch {
    return false;
  }
}
