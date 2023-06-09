import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyToggleComponent } from './property-toggle.component';

describe('PropertyToggleComponent', () => {
  let component: PropertyToggleComponent;
  let fixture: ComponentFixture<PropertyToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyToggleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
