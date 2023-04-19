import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackSectionBaselinesComponent } from './workpack-section-baselines.component';

describe('WorkpackSectionBaselinesComponent', () => {
  let component: WorkpackSectionBaselinesComponent;
  let fixture: ComponentFixture<WorkpackSectionBaselinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackSectionBaselinesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackSectionBaselinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
