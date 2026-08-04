const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('cc_accessToken');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private async handleResponse<T>(res: Response, url: string): Promise<T> {
    if (res.status === 401 && typeof window !== 'undefined' && !url.includes('/auth/login')) {
      localStorage.removeItem('cc_accessToken');
      window.location.href = '/login';
      throw new Error('Session expiree');
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Erreur reseau' }));
      const rawMsg = Array.isArray(error.message) ? error.message[0] : (error.message || `Erreur ${res.status}`);
      throw new Error(rawMsg);
    }
    return res.json();
  }

  async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return this.handleResponse<T>(res, url);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res, url);
  }
}

export const api = new ApiClient(API_URL);
