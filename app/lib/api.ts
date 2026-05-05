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

export function getFriendlyErrorMessage(
  message: string,
  fallback = "Não foi possível concluir agora. Tente novamente.",
) {
  let rawMessage = (message || "").trim();

  if (rawMessage.startsWith("{")) {
    try {
      const data = JSON.parse(rawMessage) as {
        message?: string;
        mensagem?: string;
        error?: string;
      };
      rawMessage = data.message ?? data.mensagem ?? data.error ?? rawMessage;
    } catch {
      // Keep the original text when it is not valid JSON.
    }
  }

  const normalizedMessage = rawMessage.toLowerCase();

  if (!rawMessage) {
    return fallback;
  }

  if (normalizedMessage.includes("<!doctype html") || normalizedMessage.includes("<html")) {
    return "O servidor respondeu de um jeito inesperado. Tente atualizar a página.";
  }

  if (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("networkerror") ||
    normalizedMessage.includes("load failed") ||
    normalizedMessage.includes("econnrefused")
  ) {
    return "Não consegui conectar ao servidor do Movely. Tente novamente em instantes.";
  }

  if (normalizedMessage.includes("bad gateway") || normalizedMessage.includes("502")) {
    return "O servidor do Movely não respondeu agora. Tente novamente em instantes.";
  }

  if (
    normalizedMessage.includes("bad credentials") ||
    normalizedMessage.includes("invalid credentials")
  ) {
    return "Email ou senha inválidos.";
  }

  if (
    normalizedMessage.includes("nao retornou um token") ||
    normalizedMessage.includes("não retornou um token")
  ) {
    return "Não consegui concluir seu login. Tente novamente.";
  }

  if (
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("jwt") ||
    normalizedMessage.includes("token") ||
    normalizedMessage.includes("401")
  ) {
    return "Sua sessão expirou. Entre novamente.";
  }

  if (normalizedMessage.includes("forbidden") || normalizedMessage.includes("403")) {
    return "Você não tem permissão para fazer essa ação.";
  }

  if (
    normalizedMessage.includes("email already exists") ||
    normalizedMessage.includes("user already exists") ||
    normalizedMessage.includes("already registered")
  ) {
    return "Esse email já está cadastrado. Tente entrar com ele.";
  }

  if (
    normalizedMessage.includes("given id must not be null") ||
    normalizedMessage.includes("usuario logado sem id") ||
    normalizedMessage.includes("usuário logado sem id") ||
    normalizedMessage.includes("user id must not be null")
  ) {
    return "Não consegui identificar sua conta. Saia e entre novamente.";
  }

  if (
    normalizedMessage.includes("failed to convert") ||
    normalizedMessage.includes("method parameter") ||
    normalizedMessage.includes("for input string")
  ) {
    return "Recebi um identificador inválido. Atualize a página e tente de novo.";
  }

  if (normalizedMessage.includes("method not allowed") || normalizedMessage.includes("405")) {
    return "Essa ação não está disponível nessa rota. Atualize a página e tente novamente.";
  }

  if (normalizedMessage.includes("group not found") || normalizedMessage.includes("grupo nao encontrado")) {
    return "Grupo não encontrado. Volte para a lista e tente de novo.";
  }

  if (
    normalizedMessage.includes("user not found") ||
    normalizedMessage.includes("usuario nao encontrado") ||
    normalizedMessage.includes("nenhum usuario encontrado")
  ) {
    return "Não encontrei uma conta com esse email.";
  }

  if (
    normalizedMessage.includes("already in group") ||
    normalizedMessage.includes("ja esta no grupo") ||
    normalizedMessage.includes("já está no grupo")
  ) {
    return "Essa pessoa já faz parte desse grupo.";
  }

  if (normalizedMessage.includes("not found") || normalizedMessage.includes("404")) {
    return "Não encontrei o que você tentou abrir. Atualize a página e tente de novo.";
  }

  if (normalizedMessage.includes("bad request") || normalizedMessage.includes("400")) {
    return "Alguma informação ficou inválida. Confira os campos e tente de novo.";
  }

  if (normalizedMessage.includes("internal server error") || normalizedMessage.includes("500")) {
    return "O servidor não conseguiu concluir essa ação agora. Tente novamente em instantes.";
  }

  if (
    normalizedMessage.includes("constraint") ||
    normalizedMessage.includes("database") ||
    normalizedMessage.includes("sql")
  ) {
    return "Não foi possível salvar agora. Tente novamente.";
  }

  return rawMessage;
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

  let response: Response;

  try {
    response = await fetch(getApiUrl(path), {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      getFriendlyErrorMessage(
        error instanceof Error ? error.message : "",
        "Não consegui conectar ao servidor do Movely. Tente novamente em instantes.",
      ),
    );
  }

  if (response.status === 401) {
    clearToken();
  }

  return response;
}

export async function readError(response: Response, fallback = "Não foi possível concluir agora.") {
  const text = await response.text();

  if (!text) {
    return getFriendlyErrorMessage(response.statusText, fallback);
  }

  try {
    const data = JSON.parse(text) as {
      message?: string;
      mensagem?: string;
      error?: string;
    };

    return getFriendlyErrorMessage(data.message ?? data.mensagem ?? data.error ?? "", fallback);
  } catch {
    return getFriendlyErrorMessage(text, fallback);
  }
}

export async function apiJson<T>(path: string, options: RequestInit = {}) {
  const response = await apiFetch(path, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(getFriendlyErrorMessage(text || response.statusText));
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

    throw new Error("Não consegui identificar sua conta. Saia e entre novamente.");
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
    throw new Error("Não consegui identificar sua conta. Saia e entre novamente.");
  }

  saveCurrentUser(user);
  return user;
}
