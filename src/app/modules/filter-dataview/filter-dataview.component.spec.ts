import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterDataviewComponent } from './filter-dataview.component';

describe('FilterDataviewComponent', () => {
  let component: FilterDataviewComponent;
  let fixture: ComponentFixture<FilterDataviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterDataviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterDataviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
