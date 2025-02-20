import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackSectionIndicatorsComponent } from './workpack-section-indicators.component';

describe('WorkpackSectionCostAccountsComponent', () => {
  let component: WorkpackSectionIndicatorsComponent;
  let fixture: ComponentFixture<WorkpackSectionIndicatorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackSectionIndicatorsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackSectionIndicatorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
