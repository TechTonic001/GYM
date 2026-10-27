import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { WorkoutTrackerComponent } from './workout-tracker';

describe('WorkoutTracker', () => {
  let component: WorkoutTrackerComponent;
  let fixture: ComponentFixture<WorkoutTrackerComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem('user_id', '7');

    await TestBed.configureTestingModule({
      imports: [WorkoutTrackerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(WorkoutTrackerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpTestingController
      .expectOne('http://localhost/gym-backend/get_workout_history.php?user_id=7')
      .flush([]);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('validates and saves the workout, then reloads its history', () => {
    component.workout.session_name = 'Leg Day';
    component.workout.duration_minutes = 45;
    component.addExerciseRow();
    component.workout.exercises[0] = {
      exercise_name: 'Squat',
      set_number: 1,
      reps: 10,
      weight_kg: 60,
    };

    component.onSubmitWorkout();

    const saveRequest = httpTestingController.expectOne(
      'http://localhost/gym-backend/log_workout.php',
    );
    expect(saveRequest.request.method).toBe('POST');
    expect(saveRequest.request.body).toEqual({
      user_id: 7,
      session_name: 'Leg Day',
      workout_date: component.workout.workout_date,
      duration_minutes: 45,
      notes: '',
      exercises: [
        { exercise_name: 'Squat', set_number: 1, reps: 10, weight_kg: 60 },
      ],
    });
    saveRequest.flush({ success: true });

    expect(component.workout.session_name).toBe('');
    const historyRequest = httpTestingController.expectOne(
      'http://localhost/gym-backend/get_workout_history.php?user_id=7',
    );
    historyRequest.flush([]);
  });

  it('does not post an incomplete workout', () => {
    component.onSubmitWorkout();

    expect(component.errorMessage).toContain('name');
    httpTestingController.expectNone('http://localhost/gym-backend/log_workout.php');
  });
});
