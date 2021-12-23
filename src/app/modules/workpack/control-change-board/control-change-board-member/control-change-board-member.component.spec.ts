import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlChangeBoardMemberComponent } from './control-change-board-member.component';

describe('ControlChangeBoardMemberComponent', () => {
  let component: ControlChangeBoardMemberComponent;
  let fixture: ComponentFixture<ControlChangeBoardMemberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ControlChangeBoardMemberComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlChangeBoardMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
