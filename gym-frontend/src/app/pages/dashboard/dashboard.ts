import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  ClassBooking,
  ClassBookingRequest,
  GymClass,
  GymPlan,
  GymService,
  UserSubscription,
} from '../../services/gym.service';

@Component({
  imports: [CommonModule, FormsModule, RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  readonly classes: GymClass[] = [];
  readonly bookings: ClassBooking[] = [];
  readonly plans: GymPlan[] = [];
  fullName = 'Member';
  userId: number | null = null;
  currentSubscription: UserSubscription | null = null;
  loadingClasses = true;
  loadingBookings = false;
  bookingClassId: number | null = null;
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

    this.loadClasses();

    if (this.userId !== null) {
      this.loadSubscription(this.userId);
      this.loadUserBookings(this.userId);
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

  onBookClass(classId: number): void {
    if (this.userId === null) {
      this.errorMessage = 'Your account could not be identified. Please sign in again.';
      return;
    }
    const userId = this.userId;

    const gymClass = this.classes.find((item) => item.class_id === classId);
    if (!gymClass) {
      this.errorMessage = 'This class is no longer available. Refresh the page and try again.';
      return;
    }

    if (gymClass.available_spots < 1) {
      this.errorMessage = 'This class is full. Please choose another session.';
      return;
    }

    let payload: ClassBookingRequest;
    try {
      payload = {
        user_id: userId,
        class_id: classId,
        booking_date: this.getNextClassDate(gymClass),
      };
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to determine the class date.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.bookingClassId = classId;

    this.gymService.bookClass(payload).subscribe({
      next: (response) => {
        this.bookingClassId = null;
        if (!response.success) {
          this.errorMessage = response.message ?? 'Unable to reserve this class.';
          return;
        }

        this.successMessage = response.message ?? 'Your class has been reserved.';
        this.loadUserBookings(userId);
        this.loadClasses();
      },
      error: (error: HttpErrorResponse | Error) => {
        this.bookingClassId = null;
        this.errorMessage = this.getErrorMessage(error, 'Unable to reserve this class.');
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getClassDayLabel(dayOfWeek: number | string): string {
    const weekday = this.getWeekdayIndex(dayOfWeek);
    if (weekday === null) {
      return String(dayOfWeek);
    }

    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekday];
  }

  private loadClasses(): void {
    this.loadingClasses = true;
    this.gymService.getClasses().subscribe({
      next: (classes) => {
        this.classes.splice(0, this.classes.length, ...classes);
        this.loadingClasses = false;
      },
      error: (error: HttpErrorResponse | Error) => {
        this.loadingClasses = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to load weekly classes.');
      },
    });
  }

  private loadUserBookings(userId: number): void {
    this.loadingBookings = true;
    this.gymService.getUserBookings(userId).subscribe({
      next: (bookings) => {
        this.bookings.splice(0, this.bookings.length, ...bookings);
        this.loadingBookings = false;
      },
      error: (error: HttpErrorResponse | Error) => {
        this.loadingBookings = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to load your reserved classes.');
      },
    });
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

  private getNextClassDate(gymClass: GymClass): string {
    const day = this.getWeekdayIndex(gymClass.day_of_week);
    if (day === null) {
      throw new Error(`The schedule for ${gymClass.title} has an invalid weekday.`);
    }

    const now = new Date();
    let daysUntilClass = (day - now.getDay() + 7) % 7;
    const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(gymClass.start_time);
    if (!timeMatch) {
      throw new Error(`The schedule for ${gymClass.title} has an invalid start time.`);
    }

    const classMinutes = Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
    if (daysUntilClass === 0 && classMinutes <= now.getHours() * 60 + now.getMinutes()) {
      daysUntilClass = 7;
    }

    const classDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilClass);
    const year = classDate.getFullYear();
    const month = String(classDate.getMonth() + 1).padStart(2, '0');
    const date = String(classDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }

  private getWeekdayIndex(dayOfWeek: number | string): number | null {
    if (typeof dayOfWeek === 'number') {
      return Number.isInteger(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6
        ? dayOfWeek
        : null;
    }

    const normalized = dayOfWeek.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const weekdayIndex = weekdays.findIndex(
      (weekday) => weekday === normalized || weekday.startsWith(normalized),
    );
    if (weekdayIndex >= 0) {
      return weekdayIndex;
    }

    const numericDay = Number(normalized);
    return Number.isInteger(numericDay) && numericDay >= 0 && numericDay <= 6
      ? numericDay
      : null;
  }

  private getErrorMessage(error: HttpErrorResponse | Error, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const response = error.error as { message?: string } | null;
      return response?.message ?? fallback;
    }

    return error.message || fallback;
  }
}
