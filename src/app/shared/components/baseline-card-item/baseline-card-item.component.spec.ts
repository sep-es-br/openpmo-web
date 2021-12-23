import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaselineCardItemComponent } from './baseline-card-item.component';

describe('BaselineCardItemComponent', () => {
  let component: BaselineCardItemComponent;
  let fixture: ComponentFixture<BaselineCardItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BaselineCardItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BaselineCardItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
