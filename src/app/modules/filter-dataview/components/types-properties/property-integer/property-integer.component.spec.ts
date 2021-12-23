import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyIntegerComponent } from './property-integer.component';

describe('PropertyIntegerComponent', () => {
  let component: PropertyIntegerComponent;
  let fixture: ComponentFixture<PropertyIntegerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyIntegerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyIntegerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
