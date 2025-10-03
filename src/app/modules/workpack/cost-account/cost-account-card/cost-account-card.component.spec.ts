import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostAccountCardComponent } from './cost-account-card.component';

describe('CostAccountCardComponent', () => {
  let component: CostAccountCardComponent;
  let fixture: ComponentFixture<CostAccountCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CostAccountCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CostAccountCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
