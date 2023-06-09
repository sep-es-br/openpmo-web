import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyTextareaComponent } from './property-textarea.component';

describe('PropertyTextareaComponent', () => {
  let component: PropertyTextareaComponent;
  let fixture: ComponentFixture<PropertyTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyTextareaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
