import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterRuleCardItemComponent } from './filter-rule-card-item.component';

describe('FilterRuleCardItemComponent', () => {
  let component: FilterRuleCardItemComponent;
  let fixture: ComponentFixture<FilterRuleCardItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterRuleCardItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterRuleCardItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
