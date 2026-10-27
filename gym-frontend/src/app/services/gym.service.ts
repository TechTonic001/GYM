import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface GymPlan {
  plan_id: number;
  name: string;
  monthly_price: number;
  features: string[];
}

export interface SubscriptionRequest {
  user_id: number;
  plan_id: number;
}

export interface UserSubscription {
  sub_id?: number;
  user_id: number;
  plan_id: number;
  plan_name?: string;
  name?: string;
  start_date?: string;
  end_date?: string;
  status: string;
}

interface PlansResponse {
  success?: boolean;
  message?: string;
  plans?: Array<Omit<GymPlan, 'features'> & { features: string | string[] }>;
  data?: Array<Omit<GymPlan, 'features'> & { features: string | string[] }>;
}

interface SubscriptionResponse {
  success?: boolean;
  message?: string;
  subscription?: UserSubscription | null;
  data?: UserSubscription | null;
}

@Injectable({ providedIn: 'root' })
export class GymService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost/gym-backend/';

  getPlans(): Observable<GymPlan[]> {
    return this.http
      .get<Array<Omit<GymPlan, 'features'> & { features: string | string[] }> | PlansResponse>(
        `${this.apiUrl}get_plans.php`,
      )
      .pipe(
        map((response) => {
          if (!Array.isArray(response) && response.success === false) {
            throw new Error(response.message ?? 'Unable to load membership plans.');
          }

          const plans = Array.isArray(response) ? response : (response.plans ?? response.data);

          if (!plans) {
            throw new Error('The plans API returned an invalid response.');
          }

          return plans.map((plan) => ({
            ...plan,
            monthly_price: Number(plan.monthly_price),
            features: Array.isArray(plan.features)
              ? plan.features
              : plan.features
                  .split(/\r?\n|,/)
                  .map((feature) => feature.trim())
                  .filter(Boolean),
          }));
        }),
      );
  }

  subscribe(data: SubscriptionRequest): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(
      `${this.apiUrl}subscribe.php`,
      data,
    );
  }

  getUserSubscription(userId: number): Observable<UserSubscription | null> {
    const params = new HttpParams().set('user_id', userId);

    return this.http
      .get<UserSubscription | SubscriptionResponse>(`${this.apiUrl}get_user_subscription.php`, {
        params,
      })
      .pipe(
        map((response) => {
          if ('user_id' in response) {
            return response;
          }

          if (response.success === false) {
            throw new Error(response.message ?? 'Unable to load your membership status.');
          }

          if ('subscription' in response) {
            return response.subscription ?? null;
          }

          return response.data ?? null;
        }),
      );
  }
}
