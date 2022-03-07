import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripleConstraintDashboardComponent } from './triple-constraint-dashboard.component';

describe('TripleConstraintDashboardComponent', () => {
  let component: TripleConstraintDashboardComponent;
  let fixture: ComponentFixture<TripleConstraintDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TripleConstraintDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TripleConstraintDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
