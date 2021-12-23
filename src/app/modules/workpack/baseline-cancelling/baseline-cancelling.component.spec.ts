import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaselineCancellingComponent } from './baseline-cancelling.component';

describe('BaselineCancellingComponent', () => {
  let component: BaselineCancellingComponent;
  let fixture: ComponentFixture<BaselineCancellingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BaselineCancellingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BaselineCancellingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
