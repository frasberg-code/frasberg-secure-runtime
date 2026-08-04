export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "https://frasberg.com";
export const API = `${BACKEND_URL}/api`;
export const MESH_WS_BASE = (process.env.EXPO_PUBLIC_MESH_WS_URL || `${BACKEND_URL.replace(/^http/, "ws")}/api`) + "/ws/mesh";
