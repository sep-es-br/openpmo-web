import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackSectionDashboardComponent } from './workpack-section-dashboard.component';

describe('WorkpackSectionDashboardComponent', () => {
  let component: WorkpackSectionDashboardComponent;
  let fixture: ComponentFixture<WorkpackSectionDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackSectionDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackSectionDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
