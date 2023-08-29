import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostAccountModelComponent } from './cost-account-model.component';

describe('CostAccountModelComponent', () => {
  let component: CostAccountModelComponent;
  let fixture: ComponentFixture<CostAccountModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CostAccountModelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CostAccountModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
