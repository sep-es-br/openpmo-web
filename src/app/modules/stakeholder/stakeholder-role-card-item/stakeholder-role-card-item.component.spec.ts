import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StakeholderRoleCardItemComponent } from './stakeholder-role-card-item.component';

describe('StakeholderRoleCardItemComponent', () => {
  let component: StakeholderRoleCardItemComponent;
  let fixture: ComponentFixture<StakeholderRoleCardItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StakeholderRoleCardItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StakeholderRoleCardItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
