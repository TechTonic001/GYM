import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [CommonModule, FormsModule, RouterLink],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  readonly userData = { full_name: '', email: '', password: '' };
  errorMessage = '';
  successMessage = '';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  onRegister(): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.userData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message ?? 'Your account is ready. Redirecting to sign in...';
          window.setTimeout(() => void this.router.navigate(['/login']), 1200);
          return;
        }

        this.errorMessage = response.message ?? 'Unable to create your account. Please try again.';
      },
      error: (error: HttpErrorResponse) => {
        const apiError = error.error as { message?: string; error?: string } | null;
        this.errorMessage = apiError?.message ?? apiError?.error ?? 'Unable to create your account. Please try again.';
      }
    });
  }
}
