import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostConstraintComponent } from './cost-constraint.component';

describe('CostConstraintComponent', () => {
  let component: CostConstraintComponent;
  let fixture: ComponentFixture<CostConstraintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CostConstraintComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CostConstraintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
