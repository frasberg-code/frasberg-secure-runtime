import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthContext = createContext(null);

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    let interval;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/auth/me`, { withCredentials: true });
        setUser(data);
      } catch {
        try {
          const { data } = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
          setUser(data);
        } catch {
          setUser(false);
        }
      }
      interval = setInterval(() => {
        axios.post(`${API}/auth/refresh`, {}, { withCredentials: true }).catch(() => {});
      }, 10 * 60 * 1000);
    })();
    return () => clearInterval(interval);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
    setUser(data);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password }, { withCredentials: true });
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await axios.post(`${API}/auth/logout`, {}, { withCredentials: true }); } catch {}
    setUser(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
