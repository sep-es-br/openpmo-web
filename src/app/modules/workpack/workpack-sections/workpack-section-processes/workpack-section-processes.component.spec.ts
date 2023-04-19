import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackSectionProcessesComponent } from './workpack-section-processes.component';

describe('WorkpackSectionProcessesComponent', () => {
  let component: WorkpackSectionProcessesComponent;
  let fixture: ComponentFixture<WorkpackSectionProcessesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackSectionProcessesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackSectionProcessesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
