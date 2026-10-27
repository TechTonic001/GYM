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
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorMessage = '';
          void this.router.navigate(['/dashboard']);
          return;
        }

        this.errorMessage = response.message ?? 'Unable to log in. Check your details and try again.';
      },
      error: (error: HttpErrorResponse) => {
        const apiError = error.error as { message?: string; error?: string } | null;
        this.errorMessage = apiError?.message ?? apiError?.error ?? 'Unable to log in. Please try again.';
      }
    });
  }
}
