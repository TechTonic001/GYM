import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    localStorage.clear();
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => localStorage.clear());

  it('allows users with the admin role', () => {
    localStorage.setItem('role', 'admin');

    expect(executeGuard({} as never, {} as never)).toBe(true);
  });

  it('redirects users without the admin role to the member dashboard', async () => {
    expect(executeGuard({} as never, {} as never)).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
