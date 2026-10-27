import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GymService, WorkoutExercise, WorkoutSession } from '../../services/gym.service';

@Component({
  selector: 'app-workout-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrl: './workout-tracker.css',
  templateUrl: './workout-tracker.html',
})
export class WorkoutTrackerComponent implements OnInit {
  userId: number | null = null;
  workout = this.createWorkoutDraft();
  workoutHistory: WorkoutSession[] = [];
  saving = false;
  loadingHistory = true;
  errorMessage = '';
  historyErrorMessage = '';
  successMessage = '';

  private readonly gymService = inject(GymService);

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('user_id'));
    if (!Number.isInteger(userId) || userId < 1) {
      this.loadingHistory = false;
      this.errorMessage = 'Your account could not be identified. Please sign in again.';
      return;
    }

    this.userId = userId;
    this.loadHistory();
  }

  addExerciseRow(): void {
    this.workout.exercises.push({
      exercise_name: '',
      set_number: 0,
      reps: 0,
      weight_kg: 0,
    });
  }

  removeExerciseRow(index: number): void {
    this.workout.exercises.splice(index, 1);
  }

  onSubmitWorkout(): void {
    if (this.userId === null || this.saving) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    const invalidReason = this.getWorkoutValidationError();
    if (invalidReason) {
      this.errorMessage = invalidReason;
      return;
    }

    this.saving = true;
    this.gymService
      .logWorkout({
        ...this.workout,
        user_id: this.userId,
        session_name: this.workout.session_name.trim(),
        exercises: this.workout.exercises.map((exercise) => ({
          ...exercise,
          exercise_name: exercise.exercise_name.trim(),
        })),
      })
      .subscribe({
        next: (response) => {
          this.saving = false;
          if (!response.success) {
            this.errorMessage = response.message ?? 'Unable to save your workout.';
            return;
          }

          this.successMessage = response.message ?? 'Your workout has been saved.';
          this.workout = this.createWorkoutDraft();
          this.loadHistory();
        },
        error: (error: HttpErrorResponse) => {
          this.saving = false;
          this.errorMessage = this.getErrorMessage(error, 'Unable to save your workout.');
        },
      });
  }

  loadHistory(): void {
    if (this.userId === null) {
      return;
    }

    this.loadingHistory = true;
    this.historyErrorMessage = '';
    this.gymService.getWorkoutHistory(this.userId).subscribe({
      next: (history) => {
        this.workoutHistory = history;
        this.loadingHistory = false;
      },
      error: (error: HttpErrorResponse | Error) => {
        this.historyErrorMessage = this.getErrorMessage(
          error,
          'Unable to load your workout history.',
        );
        this.loadingHistory = false;
      },
    });
  }

  totalVolume(session: WorkoutSession): number {
    return session.exercises.reduce(
      (total, exercise) => total + exercise.reps * exercise.weight_kg,
      0,
    );
  }

  private createWorkoutDraft(): {
    session_name: string;
    workout_date: string;
    duration_minutes: number;
    notes: string;
    exercises: WorkoutExercise[];
  } {
    const today = new Date();
    const workoutDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    return {
      session_name: '',
      workout_date: workoutDate,
      duration_minutes: 0,
      notes: '',
      exercises: [],
    };
  }

  private getWorkoutValidationError(): string {
    if (!this.workout.session_name.trim()) {
      return 'Enter a name for this workout.';
    }
    if (!this.workout.workout_date) {
      return 'Choose a workout date.';
    }
    if (!Number.isInteger(this.workout.duration_minutes) || this.workout.duration_minutes < 1) {
      return 'Enter a duration of at least one minute.';
    }
    if (this.workout.exercises.length === 0) {
      return 'Add at least one exercise set to this workout.';
    }
    if (
      this.workout.exercises.some(
        (exercise) =>
          !exercise.exercise_name.trim() ||
          !Number.isInteger(exercise.set_number) ||
          exercise.set_number < 1 ||
          !Number.isInteger(exercise.reps) ||
          exercise.reps < 1 ||
          !Number.isFinite(exercise.weight_kg) ||
          exercise.weight_kg < 0,
      )
    ) {
      return 'Complete each exercise name, set number, reps, and valid weight.';
    }

    return '';
  }

  private getErrorMessage(error: HttpErrorResponse | Error, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const response = error.error as { message?: string } | null;
      return response?.message ?? fallback;
    }

    return error.message || fallback;
  }
}
