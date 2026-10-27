import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    localStorage.setItem('user_id', '7');
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();

    httpTestingController
      .expectOne('http://localhost/gym-backend/get_profile.php?user_id=7')
      .flush({
        age: 30,
        gender: 'female',
        height_cm: 170,
        weight_kg: 70,
        fitness_goal: 'lose_weight',
        target_weight_kg: 65,
      });
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('loads the profile and calculates BMI and category', () => {
    expect(fixture.componentInstance.profile.age).toBe(30);
    expect(fixture.componentInstance.bmi).toBeCloseTo(24.22, 2);
    expect(fixture.componentInstance.bmiCategory).toBe('Normal range');
    expect(fixture.componentInstance.bmiColor).toBe('green');
    expect(fixture.componentInstance.targetProgress).toBe(93);
    expect(fixture.componentInstance.fitnessGoalLabel).toBe('Lose weight');
  });

  it('posts profile updates for the logged-in user', () => {
    fixture.componentInstance.profile.weight_kg = 68;
    fixture.componentInstance.onSaveProfile();

    const request = httpTestingController.expectOne(
      'http://localhost/gym-backend/update_profile.php',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      user_id: 7,
      age: 30,
      gender: 'female',
      height_cm: 170,
      weight_kg: 68,
      fitness_goal: 'lose_weight',
      target_weight_kg: 65,
    });
    request.flush({ success: true, message: 'Profile saved.' });
    expect(fixture.componentInstance.successMessage).toBe('Profile saved.');
    expect(fixture.componentInstance.saving).toBe(false);
  });
});
