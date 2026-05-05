const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function normalizePath(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function getBackendPath(path: string) {
  const normalizedPath = normalizePath(path);

  if (!API_BASE_URL || /^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  if (normalizedPath === "/api/me") {
    return "/me";
  }

  if (normalizedPath.startsWith("/api/goals")) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith("/api/")) {
    return normalizedPath.replace(/^\/api/, "");
  }

  return normalizedPath;
}

export function getApiUrl(path: string) {
  const requestPath = getBackendPath(path);

  if (/^https?:\/\//i.test(requestPath)) {
    return requestPath;
  }

  return `${API_BASE_URL}${requestPath}`;
}

export type CurrentUser = {
  id: number;
  username: string;
  email?: string | null;
  role?: string;
  weight?: number;
  height?: number;
  createdAt?: string;
};

type PageResponse<T> = {
  content?: T[];
  items?: T[];
  data?: T[];
};

function getPageItems<T>(response: PageResponse<T> | T[] | null) {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  return response.content ?? response.items ?? response.data ?? [];
}

function normalizeIdentity(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function sameUserIdentity(user: CurrentUser, identity: string) {
  const normalizedIdentity = normalizeIdentity(identity);

  return (
    normalizeIdentity(user.username) === normalizedIdentity ||
    normalizeIdentity(user.email) === normalizedIdentity
  );
}

export function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const token = (
    window.localStorage.getItem("movely_token") ??
    window.localStorage.getItem("token") ??
    window.sessionStorage.getItem("movely_token") ??
    window.sessionStorage.getItem("token") ??
    ""
  );

  return token.replace(/^Bearer\s+/i, "").trim();
}

export function saveCurrentUser(user: CurrentUser) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("movely_user", JSON.stringify(user));
  window.localStorage.setItem("movely_user_id", String(user.id));
}

export function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = window.localStorage.getItem("movely_user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as CurrentUser;
  } catch {
    return null;
  }
}

export function clearToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("movely_token");
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("movely_user");
  window.localStorage.removeItem("movely_user_id");
  window.sessionStorage.removeItem("movely_token");
  window.sessionStorage.removeItem("token");
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
  }

  return response;
}

export async function readError(response: Response, fallback = "Nao foi possivel concluir agora.") {
  const text = await response.text();

  if (!text) {
    return fallback;
  }

  try {
    const data = JSON.parse(text) as {
      message?: string;
      mensagem?: string;
      error?: string;
    };

    return data.message ?? data.mensagem ?? data.error ?? fallback;
  } catch {
    return text;
  }
}

export async function apiJson<T>(path: string, options: RequestInit = {}) {
  const response = await apiFetch(path, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || response.statusText);
  }

  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export async function getCurrentUser() {
  const user = await apiJson<CurrentUser | string>("/api/me");
  const storedUser = getStoredUser();

  if (typeof user === "string") {
    const identity = normalizeIdentity(user);

    if (storedUser?.id && sameUserIdentity(storedUser, identity)) {
      return storedUser;
    }

    const users = await apiJson<PageResponse<CurrentUser> | CurrentUser[]>("/api/users");
    const currentUser = getPageItems(users).find((item) => sameUserIdentity(item, identity));

    if (currentUser?.id) {
      saveCurrentUser(currentUser);
      return currentUser;
    }

    const storedId =
      typeof window === "undefined"
        ? 0
        : Number(window.localStorage.getItem("movely_user_id") ?? 0);

    if (storedId > 0) {
      return {
        id: storedId,
        username: user,
      };
    }

    throw new Error("Usuario logado sem ID.");
  }

  if (!user.id && storedUser?.id && sameUserIdentity(storedUser, user.username || user.email || "")) {
    return {
      ...storedUser,
      ...user,
      id: storedUser.id,
    };
  }

  if (!user.id && (user.username || user.email)) {
    const identity = normalizeIdentity(user.email || user.username);
    const users = await apiJson<PageResponse<CurrentUser> | CurrentUser[]>("/api/users");
    const currentUser = getPageItems(users).find((item) => sameUserIdentity(item, identity));

    if (currentUser?.id) {
      saveCurrentUser(currentUser);
      return currentUser;
    }
  }

  if (!user.id) {
    throw new Error("Usuario logado sem ID.");
  }

  saveCurrentUser(user);
  return user;
}
