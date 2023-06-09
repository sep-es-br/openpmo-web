import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyOrganizationSelectionComponent } from './property-organization-selection.component';

describe('PropertyOrganizationSelectionComponent', () => {
  let component: PropertyOrganizationSelectionComponent;
  let fixture: ComponentFixture<PropertyOrganizationSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyOrganizationSelectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyOrganizationSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
