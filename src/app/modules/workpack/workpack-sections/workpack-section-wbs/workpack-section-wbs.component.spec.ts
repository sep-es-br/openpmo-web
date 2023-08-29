import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackSectionWBSComponent } from './workpack-section-wbs.component';

describe('WorkpackSectionWBSComponent', () => {
  let component: WorkpackSectionWBSComponent;
  let fixture: ComponentFixture<WorkpackSectionWBSComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackSectionWBSComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackSectionWBSComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
