import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [CommonModule, FormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  readonly credentials = { identifier: '', password: '' };
  showPassword = false;
  errorMessage = '';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  onLogin(): void {
    const trimmedIdentifier = (this.credentials.identifier ?? '').trim();
    const trimmedPassword = (this.credentials.password ?? '').trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      this.errorMessage = 'Please enter your username/email and password.';
      return;
    }

    console.log('Login payload:', this.credentials);

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login response:', response);

        if (response.success) {
          this.errorMessage = '';
          void this.router.navigate(['/dashboard']);
          return;
        }

        this.errorMessage = response.message ?? 'Invalid username/email or password.';
      },
      error: (error: HttpErrorResponse) => {
        console.error('Login error:', error);
        const apiError = error.error as { message?: string; error?: string } | null;
        this.errorMessage = apiError?.message ?? apiError?.error ?? 'Invalid username/email or password.';
      },
    });
  }
}
