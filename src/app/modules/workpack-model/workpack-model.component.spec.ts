import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackModelComponent } from './workpack-model.component';

describe('WorkpackModelComponent', () => {
  let component: WorkpackModelComponent;
  let fixture: ComponentFixture<WorkpackModelComponent>;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackModelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
