import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackSectionRisksComponent } from './workpack-section-risks.component';

describe('WorkpackSectionRisksComponent', () => {
  let component: WorkpackSectionRisksComponent;
  let fixture: ComponentFixture<WorkpackSectionRisksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackSectionRisksComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackSectionRisksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
