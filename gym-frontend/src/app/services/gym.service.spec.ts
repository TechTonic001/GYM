import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GymClass, GymService, WorkoutRequest } from './gym.service';

describe('GymService class booking methods', () => {
  let service: GymService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(GymService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('loads weekly classes and normalizes numeric fields', () => {
    let classes: GymClass[] = [];

    service.getClasses().subscribe((result) => (classes = result));

    const request = httpTestingController.expectOne(
      'http://localhost/gym-backend/get_classes.php',
    );
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        class_id: '12',
        title: 'Strength Circuit',
        trainer: 'Alex',
        day_of_week: 'Monday',
        start_time: '10:00:00',
        end_time: '11:00:00',
        available_spots: '4',
      },
    ]);

    expect(classes[0].class_id).toBe(12);
    expect(classes[0].available_spots).toBe(4);
  });

  it('sends the booking payload and loads a member’s bookings', () => {
    const payload = { user_id: 7, class_id: 12, booking_date: '2026-10-28' };
    service.bookClass(payload).subscribe();

    const bookingRequest = httpTestingController.expectOne(
      'http://localhost/gym-backend/book_class.php',
    );
    expect(bookingRequest.request.method).toBe('POST');
    expect(bookingRequest.request.body).toEqual(payload);
    bookingRequest.flush({ success: true });

    service.getUserBookings(7).subscribe();
    const bookingsRequest = httpTestingController.expectOne(
      (request) =>
        request.url === 'http://localhost/gym-backend/get_user_bookings.php' &&
        request.params.get('user_id') === '7',
    );
    expect(bookingsRequest.request.method).toBe('GET');
    bookingsRequest.flush([]);
  });

  it('posts the booking id when cancelling a reservation', () => {
    service.cancelBooking(5).subscribe();

    const request = httpTestingController.expectOne(
      'http://localhost/gym-backend/cancel_booking.php',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ booking_id: 5 });
    request.flush({ success: true });
  });

  it('posts a workout and loads normalized workout history', () => {
    const payload: WorkoutRequest = {
      user_id: 7,
      session_name: 'Leg Day',
      workout_date: '2026-10-27',
      duration_minutes: 45,
      notes: '',
      exercises: [
        { exercise_name: 'Squat', set_number: 1, reps: 10, weight_kg: 60 },
      ],
    };

    service.logWorkout(payload).subscribe((response) => {
      expect(response.success).toBe(true);
    });

    const saveRequest = httpTestingController.expectOne(
      'http://localhost/gym-backend/log_workout.php',
    );
    expect(saveRequest.request.method).toBe('POST');
    expect(saveRequest.request.body).toEqual(payload);
    saveRequest.flush({ success: true });

    service.getWorkoutHistory(7).subscribe((history) => {
      expect(history[0].session_id).toBe(21);
      expect(history[0].duration_minutes).toBe(45);
      expect(history[0].exercises[0].weight_kg).toBe(60);
    });

    const historyRequest = httpTestingController.expectOne(
      (request) =>
        request.url === 'http://localhost/gym-backend/get_workout_history.php' &&
        request.params.get('user_id') === '7',
    );
    expect(historyRequest.request.method).toBe('GET');
    historyRequest.flush({
      success: true,
      workouts: [
        {
          session_id: '21',
          session_name: 'Leg Day',
          workout_date: '2026-10-27',
          duration_minutes: '45',
          exercises: [
            {
              exercise_name: 'Squat',
              set_number: '1',
              reps: '10',
              weight_kg: '60',
            },
          ],
        },
      ],
    });
  });
});
