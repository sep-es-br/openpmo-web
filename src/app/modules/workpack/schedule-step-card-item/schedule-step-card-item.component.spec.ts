import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleStepCardItemComponent } from './schedule-step-card-item.component';

describe('ScheduleStepCardItemComponent', () => {
  let component: ScheduleStepCardItemComponent;
  let fixture: ComponentFixture<ScheduleStepCardItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScheduleStepCardItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduleStepCardItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
