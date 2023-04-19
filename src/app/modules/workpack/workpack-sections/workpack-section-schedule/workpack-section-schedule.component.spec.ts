import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackSectionScheduleComponent } from './workpack-section-schedule.component';

describe('WorkpackSectionScheduleComponent', () => {
  let component: WorkpackSectionScheduleComponent;
  let fixture: ComponentFixture<WorkpackSectionScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackSectionScheduleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackSectionScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
