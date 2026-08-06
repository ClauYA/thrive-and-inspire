// Tiny API helpers shared by the blog + admin screens.

const TOKEN_KEY = "li-admin-token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Unauthenticated GET (public blog endpoints).
export async function apiGet(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// Authenticated request for admin endpoints. Clears the token on 401 so the
// caller can bounce the user back to the login screen.
export async function apiAuth(url, method = "GET", body) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearToken();
    const err = new Error(data.error || "Not authenticated");
    err.unauthorized = true;
    throw err;
  }
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
