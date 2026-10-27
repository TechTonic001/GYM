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

export interface GymClass {
  class_id: number;
  title: string;
  trainer: string;
  day_of_week: number | string;
  start_time: string;
  end_time: string;
  available_spots: number;
}

export interface ClassBooking {
  booking_id: number;
  title: string;
  trainer: string;
  booking_date: string;
  start_time: string;
  end_time: string;
}

export interface ClassBookingRequest {
  user_id: number;
  class_id: number;
  booking_date: string;
}

interface ListResponse<T> {
  success?: boolean;
  message?: string;
  classes?: T[];
  bookings?: T[];
  data?: T[];
}

interface ClassBookingResponse {
  success: boolean;
  message?: string;
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

  getClasses(): Observable<GymClass[]> {
    return this.http
      .get<GymClass[] | ListResponse<GymClass>>(`${this.apiUrl}get_classes.php`)
      .pipe(
        map((response) => {
          if (Array.isArray(response)) {
            return response.map((gymClass) => ({
              ...gymClass,
              class_id: Number(gymClass.class_id),
              available_spots: Number(gymClass.available_spots),
            }));
          }

          if (response.success === false) {
            throw new Error(response.message ?? 'Unable to load gym classes.');
          }

          const classes = response.classes ?? response.data;
          if (!classes) {
            throw new Error('The classes API returned an invalid response.');
          }

          return classes.map((gymClass) => ({
            ...gymClass,
            class_id: Number(gymClass.class_id),
            available_spots: Number(gymClass.available_spots),
          }));
        }),
      );
  }

  bookClass(payload: ClassBookingRequest): Observable<ClassBookingResponse> {
    return this.http.post<ClassBookingResponse>(`${this.apiUrl}book_class.php`, payload);
  }

  getUserBookings(userId: number): Observable<ClassBooking[]> {
    const params = new HttpParams().set('user_id', userId);

    return this.http
      .get<ClassBooking[] | ListResponse<ClassBooking>>(
        `${this.apiUrl}get_user_bookings.php`,
        { params },
      )
      .pipe(
        map((response) => {
          if (Array.isArray(response)) {
            return response.map((booking) => ({
              ...booking,
              booking_id: Number(booking.booking_id),
            }));
          }

          if (response.success === false) {
            throw new Error(response.message ?? 'Unable to load your class bookings.');
          }

          const bookings = response.bookings ?? response.data;
          if (!bookings) {
            throw new Error('The bookings API returned an invalid response.');
          }

          return bookings.map((booking) => ({
            ...booking,
            booking_id: Number(booking.booking_id),
          }));
        }),
      );
  }

  cancelBooking(bookingId: number): Observable<ClassBookingResponse> {
    return this.http.post<ClassBookingResponse>(`${this.apiUrl}cancel_booking.php`, {
      booking_id: bookingId,
    });
  }
}
