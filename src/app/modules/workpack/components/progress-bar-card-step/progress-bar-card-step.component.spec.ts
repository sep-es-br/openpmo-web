import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressBarCardStepComponent } from './progress-bar-card-step.component';

describe('ProgressBarCardStepComponent', () => {
  let component: ProgressBarCardStepComponent;
  let fixture: ComponentFixture<ProgressBarCardStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProgressBarCardStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressBarCardStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
