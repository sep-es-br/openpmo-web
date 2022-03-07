import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpandedDashboardComponent } from './expanded-dashboard.component';

describe('ExpandedDashboardComponent', () => {
  let component: ExpandedDashboardComponent;
  let fixture: ComponentFixture<ExpandedDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpandedDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpandedDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
