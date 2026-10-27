import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GymPlan, GymService, UserSubscription } from '../../services/gym.service';

@Component({
  imports: [CommonModule, FormsModule, RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  readonly plans: GymPlan[] = [];
  fullName = 'Member';
  userId: number | null = null;
  currentSubscription: UserSubscription | null = null;
  loadingPlans = true;
  isSelectingPlan = false;
  errorMessage = '';
  successMessage = '';

  private readonly authService = inject(AuthService);
  private readonly gymService = inject(GymService);

  ngOnInit(): void {
    this.fullName = localStorage.getItem('full_name')?.trim() || 'Member';
    const storedUserId = Number(localStorage.getItem('user_id'));
    this.userId = Number.isInteger(storedUserId) && storedUserId > 0 ? storedUserId : null;

    this.gymService.getPlans().subscribe({
      next: (plans) => {
        this.plans.splice(0, this.plans.length, ...plans);
        this.loadingPlans = false;
      },
      error: (error: HttpErrorResponse | Error) => {
        this.loadingPlans = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to load membership plans.');
      },
    });

    if (this.userId !== null) {
      this.loadSubscription(this.userId);
    }
  }

  get hasActiveMembership(): boolean {
    return this.currentSubscription?.status.toLowerCase() === 'active';
  }

  onSelectPlan(planId: number): void {
    if (this.userId === null) {
      this.errorMessage = 'Your account could not be identified. Please sign in again.';
      return;
    }

    const userId = this.userId;
    this.errorMessage = '';
    this.successMessage = '';
    this.isSelectingPlan = true;

    this.gymService.subscribe({ user_id: this.userId, plan_id: planId }).subscribe({
      next: (response) => {
        this.isSelectingPlan = false;

        if (!response.success) {
          this.errorMessage = response.message ?? 'Unable to activate this plan.';
          return;
        }

        this.successMessage = response.message ?? 'Your membership has been activated.';
        this.loadSubscription(userId);
      },
      error: (error: HttpErrorResponse) => {
        this.isSelectingPlan = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to activate this plan.');
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  private loadSubscription(userId: number): void {
    this.gymService.getUserSubscription(userId).subscribe({
      next: (subscription) => {
        this.currentSubscription =
          subscription?.status.toLowerCase() === 'active' ? subscription : null;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.getErrorMessage(error, 'Unable to load your membership status.');
      },
    });
  }

  private getErrorMessage(error: HttpErrorResponse | Error, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const response = error.error as { message?: string } | null;
      return response?.message ?? fallback;
    }

    return error.message || fallback;
  }
}
