import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("synapse_token"));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("synapse_token");
    localStorage.removeItem("synapse_user");
    setToken(null);
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    const t = localStorage.getItem("synapse_token");
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me", { timeout: 8000 });
      setUser(data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe, token]);

  const login = async (username, password) => {
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);
    const { data } = await api.post("/auth/login", body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    localStorage.setItem("synapse_token", data.access_token);
    setToken(data.access_token);
    const me = await api.get("/auth/me");
    localStorage.setItem("synapse_user", JSON.stringify(me.data));
    setUser(me.data);
    return me.data;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      loading,
      role: user?.role ?? null,
      refreshUser: fetchMe,
    }),
    [user, token, loading, fetchMe, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
