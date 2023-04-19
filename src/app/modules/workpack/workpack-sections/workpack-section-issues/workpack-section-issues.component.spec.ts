import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackSectionIssuesComponent } from './workpack-section-issues.component';

describe('WorkpackSectionIssuesComponent', () => {
  let component: WorkpackSectionIssuesComponent;
  let fixture: ComponentFixture<WorkpackSectionIssuesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackSectionIssuesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackSectionIssuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
