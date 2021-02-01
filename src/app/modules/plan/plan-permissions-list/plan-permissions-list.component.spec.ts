import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanPermissionsListComponent } from './plan-permissions-list.component';

describe('PlanPermissionsListComponent', () => {
  let component: PlanPermissionsListComponent;
  let fixture: ComponentFixture<PlanPermissionsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlanPermissionsListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlanPermissionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
