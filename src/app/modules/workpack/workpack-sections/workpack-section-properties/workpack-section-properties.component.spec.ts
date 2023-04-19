import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackSectionPropertiesComponent } from './workpack-section-properties.component';

describe('WorkpackSectionPropertiesComponent', () => {
  let component: WorkpackSectionPropertiesComponent;
  let fixture: ComponentFixture<WorkpackSectionPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackSectionPropertiesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackSectionPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
