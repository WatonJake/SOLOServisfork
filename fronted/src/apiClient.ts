const API_GATEWAY_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  accessToken?: string;
}

export async function apiRequest<T>(
  fallbackBaseUrl: string,
  path: string,
  init?: RequestInit,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const baseUrl = (API_GATEWAY_URL ?? fallbackBaseUrl).replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });

  if (!response.ok) {
    let message = `Error ${response.status} al consultar ${path}`;
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      // Keep the HTTP status message when an endpoint does not return JSON.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
