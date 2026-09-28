import axios from "axios";

function resolveApiBaseUrl() {
  if (import.meta.env.VITE_API_RELATIVE === "1") return "";
  const raw = import.meta.env.VITE_API_URL;
  if (raw === "" || raw === "relative") return "";
  return (raw || "http://localhost:8000").replace(/\s+/g, "");
}

export const API_BASE_URL = resolveApiBaseUrl();

export function getWsBase() {
  if (API_BASE_URL) return API_BASE_URL.replace(/^http/, "ws");
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}`;
  }
  return "ws://localhost:8000";
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("synapse_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = String(err.config?.url || "");
    if (status === 401 && !url.includes("/auth/login")) {
      localStorage.removeItem("synapse_token");
      localStorage.removeItem("synapse_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
