import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export interface AuthResponse {
  success?: boolean;
  status?: string;
  message?: string;
  token?: string;
  user_id?: string | number;
  full_name?: string;
  role?: string;
  user?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  register(userData: unknown): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register.php`, userData, {
      headers: JSON_HEADERS,
    });
  }

  login(credentials: unknown): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login.php`, credentials, {
        headers: JSON_HEADERS,
      })
      .pipe(
        tap((response) => {
          const user = (response.user ?? response.data ?? {}) as Record<string, unknown>;
          const userId = response.user_id ?? (user['user_id'] as string | number | undefined) ?? '';
          const fullName = response.full_name ?? (user['full_name'] as string | undefined) ?? '';
          const role = response.role ?? (user['role'] as string | undefined) ?? 'member';
          const token = response.token ?? '';

          if (!token) {
            return;
          }

          localStorage.setItem('token', token);
          localStorage.setItem('user_id', String(userId ?? ''));
          localStorage.setItem('full_name', String(fullName ?? ''));
          localStorage.setItem('role', String(role ?? 'member'));
        }),
      );
  }

  isLoggedIn(): boolean {
    return Boolean(localStorage.getItem('token'));
  }

  logout(): void {
    localStorage.clear();
    void this.router.navigate(['/login']);
  }
}
