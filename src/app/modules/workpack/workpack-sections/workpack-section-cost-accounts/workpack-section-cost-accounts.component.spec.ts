import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackSectionCostAccountsComponent } from './workpack-section-cost-accounts.component';

describe('WorkpackSectionCostAccountsComponent', () => {
  let component: WorkpackSectionCostAccountsComponent;
  let fixture: ComponentFixture<WorkpackSectionCostAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackSectionCostAccountsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackSectionCostAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
