import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostAccountComponent } from './cost-account.component';

describe('CostAccountComponent', () => {
  let component: CostAccountComponent;
  let fixture: ComponentFixture<CostAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CostAccountComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CostAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
