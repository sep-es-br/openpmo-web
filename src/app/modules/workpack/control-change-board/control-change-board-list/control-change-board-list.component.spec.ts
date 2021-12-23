import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlChangeBoardListComponent } from './control-change-board-list.component';

describe('ControlChangeBoardListComponent', () => {
  let component: ControlChangeBoardListComponent;
  let fixture: ComponentFixture<ControlChangeBoardListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ControlChangeBoardListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlChangeBoardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
