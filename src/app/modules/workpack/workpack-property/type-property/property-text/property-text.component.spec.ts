import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyTextComponent } from './property-text.component';

describe('PropertyTextComponent', () => {
  let component: PropertyTextComponent;
  let fixture: ComponentFixture<PropertyTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyTextComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
