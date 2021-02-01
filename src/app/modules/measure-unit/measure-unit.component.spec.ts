import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeasureUnitComponent } from './measure-unit.component';

describe('MeasureUnitComponent', () => {
  let component: MeasureUnitComponent;
  let fixture: ComponentFixture<MeasureUnitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MeasureUnitComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MeasureUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
