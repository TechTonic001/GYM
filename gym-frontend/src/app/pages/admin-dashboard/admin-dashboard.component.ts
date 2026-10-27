import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

interface RecentMember {
  user_id: number;
  subscription_id: number | null;
  full_name: string;
  email: string;
  plan: string;
  status: string;
}

interface AdminOverview {
  totalMembers?: number;
  total_members?: number;
  activeSubscriptions?: number;
  active_subscriptions?: number;
  totalRevenue?: number;
  total_revenue?: number;
  recentMembers?: RecentMember[];
  recent_members?: RecentMember[];
  data?: AdminOverview;
}

interface ToggleSubscriptionResponse {
  success: boolean;
  message?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  totalMembers = 0;
  activeSubscriptions = 0;
  totalRevenue = 0;
  recentMembers: RecentMember[] = [];
  loading = true;
  errorMessage = '';
  updatingSubscriptionId: number | null = null;

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost/gym-backend/';

  ngOnInit(): void {
    this.loadOverview();
  }

  toggleSubscription(member: RecentMember): void {
    if (member.subscription_id === null || this.updatingSubscriptionId !== null) {
      return;
    }

    const nextStatus = member.status.toLowerCase() === 'active' ? 'inactive' : 'active';
    this.errorMessage = '';
    this.updatingSubscriptionId = member.subscription_id;

    this.http
      .post<ToggleSubscriptionResponse>(`${this.apiUrl}admin_toggle_subscription.php`, {
        subscription_id: member.subscription_id,
        status: nextStatus,
      })
      .subscribe({
        next: (response) => {
          this.updatingSubscriptionId = null;

          if (!response.success) {
            this.errorMessage = response.message ?? 'Unable to update this subscription.';
            return;
          }

          const wasActive = member.status.toLowerCase() === 'active';
          member.status = nextStatus;
          this.activeSubscriptions += wasActive ? -1 : 1;
        },
        error: (error: HttpErrorResponse) => {
          this.updatingSubscriptionId = null;
          this.errorMessage = this.getErrorMessage(error, 'Unable to update this subscription.');
        },
      });
  }

  goToMemberDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }

  private loadOverview(): void {
    this.http.get<AdminOverview>(`${this.apiUrl}admin_overview.php`).subscribe({
      next: (response) => {
        const overview = response.data ?? response;
        this.totalMembers = overview.totalMembers ?? overview.total_members ?? 0;
        this.activeSubscriptions =
          overview.activeSubscriptions ?? overview.active_subscriptions ?? 0;
        this.totalRevenue = overview.totalRevenue ?? overview.total_revenue ?? 0;
        this.recentMembers = (overview.recentMembers ?? overview.recent_members ?? []).map(
          (member) => ({
            ...member,
            subscription_id: member.subscription_id ?? null,
            status: member.status ?? 'inactive',
          }),
        );
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.getErrorMessage(error, 'Unable to load the admin overview.');
        this.loading = false;
      },
    });
  }

  private getErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const response = error.error as { message?: string } | null;
    return response?.message ?? fallback;
  }
}
