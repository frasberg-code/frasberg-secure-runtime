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
    let cancelled = false;
    (async () => {
      // Persistent session boot: only a real 401/403 logs the user out.
      // Network errors / 5xx are retried so a flaky connection never drops the session.
      for (let tryNum = 0; tryNum < 3 && !cancelled; tryNum++) {
        try {
          const { data } = await axios.get(`${API}/auth/me`, { withCredentials: true });
          if (!cancelled) setUser(data);
          break;
        } catch (e1) {
          const authFail = e1.response && (e1.response.status === 401 || e1.response.status === 403);
          if (authFail) {
            try {
              const { data } = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
              if (!cancelled) setUser(data);
              break;
            } catch (e2) {
              const refreshAuthFail = e2.response && (e2.response.status === 401 || e2.response.status === 403);
              if (refreshAuthFail || tryNum === 2) { if (!cancelled) setUser(false); break; }
            }
          } else if (tryNum === 2) {
            if (!cancelled) setUser(false);
            break;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
      interval = setInterval(() => {
        axios.post(`${API}/auth/refresh`, {}, { withCredentials: true }).catch(() => {});
      }, 10 * 60 * 1000);
    })();
    return () => { cancelled = true; clearInterval(interval); };
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

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(data);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
