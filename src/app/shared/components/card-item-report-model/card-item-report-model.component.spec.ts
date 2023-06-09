import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardItemReportModelComponent } from './card-item-report-model.component';

describe('CardItemReportModelComponent', () => {
  let component: CardItemReportModelComponent;
  let fixture: ComponentFixture<CardItemReportModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardItemReportModelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardItemReportModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
