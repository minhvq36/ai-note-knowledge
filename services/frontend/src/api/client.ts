import { hasError, resolveErrorMessage } from './contracts/base';
import { type ApiResponse } from './contracts/base';

type TokenProvider = () => string | null;

class ApiClient {
  private baseUrl: string;
  private getToken: TokenProvider;

  constructor(getToken: TokenProvider) {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    this.getToken = getToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {

    const url = `${this.baseUrl}${endpoint}`;

    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');

    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        this.handleUnauthorized();
      }

      if (response.status === 204) {
        return {
          success: true,
          data: null as T,
          error: null,
        };
      }

      const contentType = response.headers.get('content-type');

      if (!contentType?.includes('application/json')) {
        return {
          success: false,
          data: null,
          error: {
            code: 'INVALID_RESPONSE',
            message: `Unexpected response format (HTTP ${response.status})`,
          },
        };
      }

      const result: ApiResponse<T> = await response.json();

      if (import.meta.env.DEV && hasError(result)) {
        console.error(
          `[API Error] ${endpoint}:`,
          resolveErrorMessage(result.error)
        );
      }

      return result;

    } catch (err) {
      return {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_FAILURE',
          message: err instanceof Error
            ? err.message
            : 'Network failure',
        },
      };
    }
  }

  private handleUnauthorized(): void {
    localStorage.removeItem('access_token');

    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  public get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }

  public post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient(
  () => localStorage.getItem('access_token')
);
