import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaselineComponent } from './baseline.component';

describe('BaselineComponent', () => {
  let component: BaselineComponent;
  let fixture: ComponentFixture<BaselineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BaselineComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BaselineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
