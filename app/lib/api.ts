import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    window.localStorage.getItem("movely_token") ??
    window.sessionStorage.getItem("movely_token") ??
    ""
  );
}

export function clearToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("movely_token");
  window.sessionStorage.removeItem("movely_token");
}

// export async function apiFetch(path: string, options: RequestInit = {}) {
//   const token = getToken();
//   const headers = new Headers(options.headers);

//   if (!headers.has("Content-Type") && options.body) {
//     headers.set("Content-Type", "application/json");
//   }

//   if (token) {
//     headers.set("Authorization", `Bearer ${token}`);
//   }

//   const response = await fetch(`${API_BASE_URL}${path}`, {
//     ...options,
//     headers,
//   });

//   if (response.status === 401) {
//     clearToken();
//   }

//   return response;
// }

export const apiFetch = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiFetch.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});


apiFetch.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  },
);

export function getFriendlyError(message: string): string {
  if (message.includes("Network Error")) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão.";
  }
  return "Ocorreu um erro inesperado. Tente novamente mais tarde.";
}