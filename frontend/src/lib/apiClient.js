import { supabase } from "./supabaseClient";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const getAccessToken = async () => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
};

export const apiFetch = async (path, options = {}) => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Missing auth token");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed");
  }

  return response.json();
};
