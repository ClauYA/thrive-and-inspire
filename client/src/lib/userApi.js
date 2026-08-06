// Session helpers + fetch wrapper for the member (workout tracker) area.

const TOKEN_KEY = "li-user-token";
const USER_KEY = "li-user";

export const getUserToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const setSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Authenticated request for member endpoints.
export async function userApi(url, method = "GET", body) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getUserToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearSession();
    const err = new Error(data.error || "Not authenticated");
    err.unauthorized = true;
    throw err;
  }
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
