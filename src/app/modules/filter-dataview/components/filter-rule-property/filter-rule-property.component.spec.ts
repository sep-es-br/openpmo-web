import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterRulePropertyComponent } from './filter-rule-property.component';

describe('FilterRulePropertyComponent', () => {
  let component: FilterRulePropertyComponent;
  let fixture: ComponentFixture<FilterRulePropertyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterRulePropertyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterRulePropertyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
