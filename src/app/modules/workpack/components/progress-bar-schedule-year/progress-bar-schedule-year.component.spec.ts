import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressBarScheduleYearComponent } from './progress-bar-schedule-year.component';

describe('ProgressBarScheduleYearComponent', () => {
  let component: ProgressBarScheduleYearComponent;
  let fixture: ComponentFixture<ProgressBarScheduleYearComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProgressBarScheduleYearComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressBarScheduleYearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
