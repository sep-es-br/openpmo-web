import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostAssignmentCardItemComponent } from './cost-assignment-card-item.component';

describe('CostAssignmentCardItemComponent', () => {
  let component: CostAssignmentCardItemComponent;
  let fixture: ComponentFixture<CostAssignmentCardItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CostAssignmentCardItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CostAssignmentCardItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
