import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyUnitSelectionComponent } from './property-unit-selection.component';

describe('PropertyUnitSelectionComponent', () => {
  let component: PropertyUnitSelectionComponent;
  let fixture: ComponentFixture<PropertyUnitSelectionComponent>;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyUnitSelectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyUnitSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
