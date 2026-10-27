import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    localStorage.clear();
    localStorage.setItem('user_id', '7');
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpTestingController.expectOne('http://localhost/gym-backend/get_plans.php').flush([]);
    httpTestingController.expectOne('http://localhost/gym-backend/get_classes.php').flush([]);
    httpTestingController
      .expectOne('http://localhost/gym-backend/get_user_subscription.php?user_id=7')
      .flush({ subscription: null });
    httpTestingController
      .expectOne('http://localhost/gym-backend/get_user_bookings.php?user_id=7')
      .flush([]);
    httpTestingController
      .expectOne('http://localhost/gym-backend/get_workout_analytics.php?user_id=7')
      .flush({
        labels: ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'],
        frequency: [0, 0, 0, 0, 0, 0, 0],
        volume: [0, 0, 0, 0, 0, 0, 0],
      });
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.hasWorkoutAnalytics).toBe(false);
  });

  it('books the next occurrence and reloads class availability and personal bookings', () => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const expectedDate = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, '0'),
      String(tomorrow.getDate()).padStart(2, '0'),
    ].join('-');
    component.classes.push({
      class_id: 12,
      title: 'Strength Circuit',
      trainer: 'Alex',
      day_of_week: tomorrow.getDay(),
      start_time: '23:59:00',
      end_time: '23:59:59',
      available_spots: 4,
    });

    component.onBookClass(12);

    const bookingRequest = httpTestingController.expectOne(
      'http://localhost/gym-backend/book_class.php',
    );
    expect(bookingRequest.request.method).toBe('POST');
    expect(bookingRequest.request.body).toEqual({
      user_id: 7,
      class_id: 12,
      booking_date: expectedDate,
    });
    bookingRequest.flush({ success: true, message: 'Class booked successfully.' });

    httpTestingController
      .expectOne('http://localhost/gym-backend/get_user_bookings.php?user_id=7')
      .flush([
        {
          booking_id: 5,
          title: 'Strength Circuit',
          trainer: 'Alex',
          booking_date: expectedDate,
          start_time: '23:59:00',
          end_time: '23:59:59',
        },
      ]);
    httpTestingController
      .expectOne('http://localhost/gym-backend/get_classes.php')
      .flush([]);

    expect(component.successMessage).toBe('Class booked successfully.');
    expect(component.bookings).toHaveLength(1);
    expect(component.loadingClasses).toBe(false);
    expect(component.loadingBookings).toBe(false);
  });
});
