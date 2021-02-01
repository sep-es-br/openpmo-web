import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackModelPropertyComponent } from './workpack-model-property.component';

describe('WorkpackModelPropertyComponent', () => {
  let component: WorkpackModelPropertyComponent;
  let fixture: ComponentFixture<WorkpackModelPropertyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackModelPropertyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackModelPropertyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
