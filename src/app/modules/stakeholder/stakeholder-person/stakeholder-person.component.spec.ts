import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StakeholderPersonComponent } from './stakeholder-person.component';

describe('StakeholderPersonComponent', () => {
  let component: StakeholderPersonComponent;
  let fixture: ComponentFixture<StakeholderPersonComponent>;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [ StakeholderPersonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StakeholderPersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
