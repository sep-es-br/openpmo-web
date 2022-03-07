import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarnedValueAnalysisDashboardComponent } from './earned-value-analysis-dashboard.component';

describe('EarnedValueAnalysisDashboardComponent', () => {
  let component: EarnedValueAnalysisDashboardComponent;
  let fixture: ComponentFixture<EarnedValueAnalysisDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EarnedValueAnalysisDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EarnedValueAnalysisDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
