import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Landing } from './pages/landing/landing';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { WorkoutTrackerComponent } from './pages/workout-tracker/workout-tracker';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'workouts', component: WorkoutTrackerComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, adminGuard] },
];
