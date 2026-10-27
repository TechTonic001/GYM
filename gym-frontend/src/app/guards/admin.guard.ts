import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (localStorage.getItem('role') === 'admin') {
    return true;
  }

  void router.navigate(['/dashboard']);
  return false;
};
