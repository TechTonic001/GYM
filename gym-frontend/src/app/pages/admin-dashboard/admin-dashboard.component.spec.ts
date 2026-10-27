import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();

    httpTestingController.expectOne('http://localhost/gym-backend/admin_overview.php').flush({
      total_members: 12,
      active_subscriptions: 8,
      total_revenue: 420,
      recent_members: [],
    });
    await fixture.whenStable();
  });

  afterEach(() => httpTestingController.verify());

  it('loads the admin overview', () => {
    expect(fixture.componentInstance.totalMembers).toBe(12);
    expect(fixture.componentInstance.activeSubscriptions).toBe(8);
    expect(fixture.componentInstance.totalRevenue).toBe(420);
    expect(fixture.componentInstance.recentMembers).toEqual([]);
  });
});
