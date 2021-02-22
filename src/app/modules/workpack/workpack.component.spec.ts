import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackComponent } from './workpack.component';

describe('WorkpackComponent', () => {
  let component: WorkpackComponent;
  let fixture: ComponentFixture<WorkpackComponent>;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
