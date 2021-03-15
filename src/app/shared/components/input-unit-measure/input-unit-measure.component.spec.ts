import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputUnitMeasureComponent } from './input-unit-measure.component';

describe('InputUnitMeasureComponent', () => {
  let component: InputUnitMeasureComponent;
  let fixture: ComponentFixture<InputUnitMeasureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InputUnitMeasureComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InputUnitMeasureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
