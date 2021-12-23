import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaselineViewComponent } from './baseline-view.component';

describe('BaselineViewComponent', () => {
  let component: BaselineViewComponent;
  let fixture: ComponentFixture<BaselineViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BaselineViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BaselineViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
