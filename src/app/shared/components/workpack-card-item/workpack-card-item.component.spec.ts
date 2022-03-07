import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackCardItemComponent } from './workpack-card-item.component';

describe('WorkpackCardItemComponent', () => {
  let component: WorkpackCardItemComponent;
  let fixture: ComponentFixture<WorkpackCardItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackCardItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackCardItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
