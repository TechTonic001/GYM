import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideHttpClient(), provideRouter([])]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('toggles password visibility accessibly', () => {
    fixture.detectChanges();

    const passwordInput = fixture.nativeElement.querySelector(
      '#password',
    ) as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector(
      '.password-toggle',
    ) as HTMLButtonElement;

    expect(passwordInput.type).toBe('password');
    expect(toggle.getAttribute('aria-label')).toBe('Show password');
    toggle.click();
    fixture.detectChanges();

    expect(passwordInput.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Hide password');
  });
});
