import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressBarCostAccountComponent } from './progress-bar-cost-account.component';

describe('ProgressBarCostAccountComponent', () => {
  let component: ProgressBarCostAccountComponent;
  let fixture: ComponentFixture<ProgressBarCostAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProgressBarCostAccountComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressBarCostAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
