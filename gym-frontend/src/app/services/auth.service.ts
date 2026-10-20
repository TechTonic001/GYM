import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  token?: string;
  user_id?: string | number;
  full_name?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost/gym-backend';

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  register(userData: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/register.php`, userData);
  }

  login(credentials: unknown): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login.php`, credentials).pipe(
      tap((response) => {
        if (!response.token) {
          return;
        }

        localStorage.setItem('token', response.token);
        localStorage.setItem('user_id', String(response.user_id ?? ''));
        localStorage.setItem('full_name', response.full_name ?? '');
      })
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