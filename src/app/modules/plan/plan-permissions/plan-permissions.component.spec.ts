import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanPermissionsComponent } from './plan-permissions.component';

describe('PlanPermissionsComponent', () => {
  let component: PlanPermissionsComponent;
  let fixture: ComponentFixture<PlanPermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlanPermissionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlanPermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
