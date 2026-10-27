import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  success?: boolean;
  message?: string;
  token?: string;
  user_id?: string | number;
  full_name?: string;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost/gym-backend/';

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  register(userData: unknown): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}register.php`, userData);
  }

  login(credentials: unknown): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}login.php`, credentials).pipe(
      tap((response) => {
        if (!response.token) {
          return;
        }

        localStorage.setItem('token', response.token);
        localStorage.setItem('user_id', String(response.user_id ?? ''));
        localStorage.setItem('full_name', response.full_name ?? '');
        localStorage.setItem('role', response.role ?? 'member');
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
