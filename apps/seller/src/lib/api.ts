const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('seller_accessToken');
  }

  private getHeaders(isFormData = false): HeadersInit {
    const headers: HeadersInit = {};
    if (!isFormData) headers['Content-Type'] = 'application/json';
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private translateError(msg: string): string {
    if (!msg) return 'Erreur inconnue';
    // NestJS validation pipe errors
    if (msg.includes('should not exist')) {
      const prop = msg.match(/property (\w+)/)?.[1];
      return prop ? `Le champ "${prop}" n'est pas autorise` : 'Un champ envoye n\'est pas autorise';
    }
    if (msg.includes('must be a string')) return 'Un champ doit etre du texte';
    if (msg.includes('must be a number')) return 'Un champ doit etre un nombre';
    if (msg.includes('must not be empty')) return 'Un champ obligatoire est vide';
    if (msg.includes('should not be empty')) return 'Un champ obligatoire est vide';
    if (msg.includes('must be an array')) return 'Format de donnees invalide';
    if (msg.includes('Forbidden')) return 'Acces interdit';
    if (msg.includes('Unauthorized')) return 'Non autorise — veuillez vous reconnecter';
    if (msg.includes('Not Found')) return 'Ressource introuvable';
    if (msg.includes('already exists')) return 'Ce produit existe deja';
    if (msg.includes('Bad Request')) return 'Requete invalide — verifiez les champs';
    // If array of messages (NestJS validation)
    return msg;
  }

  private async handleResponse<T>(res: Response, url: string): Promise<T> {
    if (res.status === 401 && typeof window !== 'undefined' && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      localStorage.removeItem('seller_accessToken');
      localStorage.removeItem('seller_refreshToken');
      window.location.href = '/login';
      throw new Error('Session expiree');
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Erreur reseau' }));
      const rawMsg = Array.isArray(error.message) ? error.message[0] : (error.message || `Erreur ${res.status}`);
      throw new Error(this.translateError(rawMsg));
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

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res, url);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res, url);
  }

  async delete<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(res, url);
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    return this.handleResponse<T>(res, url);
  }

  async uploadImage(file: File | Blob, fileName?: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file, fileName || 'image.jpg');
    const res = await this.upload<{ result: boolean; data: { url: string } }>('/upload', formData);
    // Return full URL
    return `${this.baseUrl.replace('/api/v1', '')}${res.data.url}`;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const api = new ApiClient(API_URL);
