import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyGroupComponent } from './property-group.component';

describe('PropertyGroupComponent', () => {
  let component: PropertyGroupComponent;
  let fixture: ComponentFixture<PropertyGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyGroupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
