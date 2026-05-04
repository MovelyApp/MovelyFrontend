const API_BASE = "http://localhost:8080";

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("movely_token");
}

export function setToken(token: string): void {
    localStorage.setItem("movely_token", token);
}

export function clearToken(): void {
    localStorage.removeItem("movely_token");
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = getToken();
    const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
    };

    if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    });

    if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
        window.location.href = "/login";
    }
    }

    return res;
}