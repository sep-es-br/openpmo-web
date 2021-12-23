import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskResponseComponent } from './risk-response.component';

describe('RiskResponseComponent', () => {
  let component: RiskResponseComponent;
  let fixture: ComponentFixture<RiskResponseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskResponseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskResponseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
