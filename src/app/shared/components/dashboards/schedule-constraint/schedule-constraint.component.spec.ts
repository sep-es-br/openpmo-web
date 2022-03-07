import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleConstraintComponent } from './schedule-constraint.component';

describe('ScheduleConstraintComponent', () => {
  let component: ScheduleConstraintComponent;
  let fixture: ComponentFixture<ScheduleConstraintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScheduleConstraintComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduleConstraintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
