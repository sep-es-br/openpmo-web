import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSlideMenuComponent } from './user-slide-menu.component';

describe('UserSlideMenuComponent', () => {
  let component: UserSlideMenuComponent;
  let fixture: ComponentFixture<UserSlideMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserSlideMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserSlideMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
