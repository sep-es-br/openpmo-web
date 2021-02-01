import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StakeholderOrganizationComponent } from './stakeholder-organization.component';

describe('StakeholderOrganizationComponent', () => {
  let component: StakeholderOrganizationComponent;
  let fixture: ComponentFixture<StakeholderOrganizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StakeholderOrganizationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StakeholderOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
