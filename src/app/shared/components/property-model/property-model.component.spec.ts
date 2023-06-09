import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyModelComponent } from './property-model.component';

describe('PropertyModelComponent', () => {
  let component: PropertyModelComponent;
  let fixture: ComponentFixture<PropertyModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyModelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
