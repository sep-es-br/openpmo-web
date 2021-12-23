import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertySelectionComponent } from './property-selection.component';

describe('PropertySelectionComponent', () => {
  let component: PropertySelectionComponent;
  let fixture: ComponentFixture<PropertySelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertySelectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertySelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
