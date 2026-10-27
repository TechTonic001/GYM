import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MemberProfile, GymService } from '../../services/gym.service';

type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'endurance' | 'maintenance';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  readonly fitnessGoals: { value: FitnessGoal; label: string }[] = [
    { value: 'weight_loss', label: 'Lose weight' },
    { value: 'muscle_gain', label: 'Build muscle' },
    { value: 'endurance', label: 'Improve endurance' },
    { value: 'maintenance', label: 'Maintain my weight' },
  ];

  readonly profile: MemberProfile = {
    age: null,
    gender: '',
    height_cm: null,
    weight_kg: null,
    fitness_goal: 'endurance',
    target_weight_kg: null,
  };

  userId: number | null = null;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  private readonly gymService = inject(GymService);

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('user_id'));
    if (!Number.isInteger(userId) || userId < 1) {
      this.loading = false;
      this.errorMessage = 'Your account could not be identified. Please sign in again.';
      return;
    }

    this.userId = userId;
    this.gymService.getProfile(userId).subscribe({
      next: (profile) => {
        if (profile) {
          Object.assign(this.profile, {
            ...profile,
            gender: profile.gender ?? '',
            fitness_goal: profile.fitness_goal || 'endurance',
          });
        }
        this.loading = false;
      },
      error: (error: HttpErrorResponse | Error) => {
        this.errorMessage = this.getErrorMessage(error, 'Unable to load your profile.');
        this.loading = false;
      },
    });
  }

  get bmi(): number | null {
    const heightCm = Number(this.profile.height_cm);
    const weightKg = Number(this.profile.weight_kg);

    if (
      !Number.isFinite(heightCm) ||
      heightCm <= 0 ||
      !Number.isFinite(weightKg) ||
      weightKg <= 0
    ) {
      return null;
    }

    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  }

  get bmiCategory(): string {
    const bmi = this.bmi;
    if (bmi === null) {
      return 'Enter your measurements';
    }
    if (bmi < 18.5) {
      return 'Underweight';
    }
    if (bmi < 25) {
      return 'Normal range';
    }
    if (bmi < 30) {
      return 'Overweight';
    }
    if (bmi < 35) {
      return 'Obesity class I';
    }
    if (bmi < 40) {
      return 'Obesity class II';
    }
    return 'Obesity class III';
  }

  get bmiColor(): string {
    const bmi = this.bmi;
    if (bmi === null) {
      return 'neutral';
    }
    if (bmi < 18.5) {
      return 'blue';
    }
    if (bmi < 25) {
      return 'green';
    }
    if (bmi < 30) {
      return 'yellow';
    }
    return 'red';
  }

  get targetProgress(): number | null {
    const currentWeight = Number(this.profile.weight_kg);
    const targetWeight = Number(this.profile.target_weight_kg);

    if (
      !Number.isFinite(currentWeight) ||
      currentWeight <= 0 ||
      !Number.isFinite(targetWeight) ||
      targetWeight <= 0
    ) {
      return null;
    }

    if (currentWeight === targetWeight) {
      return 100;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (Math.min(currentWeight, targetWeight) / Math.max(currentWeight, targetWeight)) * 100,
        ),
      ),
    );
  }

  get weightDifference(): number | null {
    const currentWeight = Number(this.profile.weight_kg);
    const targetWeight = Number(this.profile.target_weight_kg);

    if (
      !Number.isFinite(currentWeight) ||
      currentWeight <= 0 ||
      !Number.isFinite(targetWeight) ||
      targetWeight <= 0
    ) {
      return null;
    }

    return Math.abs(currentWeight - targetWeight);
  }

  get fitnessTip(): string {
    switch (this.profile.fitness_goal as FitnessGoal) {
      case 'weight_loss':
        return 'Build consistency with a balanced mix of strength training, cardio, and sustainable nutrition habits.';
      case 'muscle_gain':
        return 'Focus on progressive strength training, recovery, and balanced meals with enough protein.';
      case 'maintenance':
        return 'A steady routine and balanced meals can help you maintain your progress while staying energized.';
      case 'endurance':
        return 'Build your cardiovascular base gradually with regular sessions, recovery days, and steady progress.';
      default:
        return 'Set a routine you enjoy, increase activity gradually, and celebrate consistent effort.';
    }
  }

  get fitnessGoalLabel(): string {
    return (
      this.fitnessGoals.find((goal) => goal.value === this.profile.fitness_goal)?.label ??
      'Build healthy habits'
    );
  }

  onSaveProfile(): void {
    if (this.userId === null || this.saving) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.saving = true;

    this.gymService.updateProfile({ ...this.profile, user_id: this.userId }).subscribe({
      next: (response) => {
        this.saving = false;
        if (!response.success) {
          this.errorMessage = response.message ?? 'Unable to save your profile.';
          return;
        }

        this.successMessage = response.message ?? 'Your profile has been saved.';
        window.alert(this.successMessage);
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to save your profile.');
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
