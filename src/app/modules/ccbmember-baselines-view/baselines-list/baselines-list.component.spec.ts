import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaselinesListComponent } from './baselines-list.component';

describe('BaselinesListComponent', () => {
  let component: BaselinesListComponent;
  let fixture: ComponentFixture<BaselinesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BaselinesListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BaselinesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
