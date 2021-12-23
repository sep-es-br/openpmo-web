import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyDateComponent } from './property-date.component';

describe('PropertyDateComponent', () => {
  let component: PropertyDateComponent;
  let fixture: ComponentFixture<PropertyDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyDateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
