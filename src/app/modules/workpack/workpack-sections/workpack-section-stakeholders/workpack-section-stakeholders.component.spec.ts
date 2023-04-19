import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackSectionStakeholdersComponent } from './workpack-section-stakeholders.component';

describe('WorkpackSectionStakeholdersComponent', () => {
  let component: WorkpackSectionStakeholdersComponent;
  let fixture: ComponentFixture<WorkpackSectionStakeholdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackSectionStakeholdersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackSectionStakeholdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
