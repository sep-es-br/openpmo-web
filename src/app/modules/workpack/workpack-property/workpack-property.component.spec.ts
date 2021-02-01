import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackPropertyComponent } from './workpack-property.component';

describe('WorkpackPropertyComponent', () => {
  let component: WorkpackPropertyComponent;
  let fixture: ComponentFixture<WorkpackPropertyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackPropertyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackPropertyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
