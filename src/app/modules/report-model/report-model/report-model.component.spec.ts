import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportModelComponent } from './report-model.component';

describe('ReportModelComponent', () => {
  let component: ReportModelComponent;
  let fixture: ComponentFixture<ReportModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportModelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
