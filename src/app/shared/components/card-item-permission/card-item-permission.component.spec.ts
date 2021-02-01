import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardItemPermissionComponent } from './card-item-permission.component';

describe('CardItemPermissionComponent', () => {
  let component: CardItemPermissionComponent;
  let fixture: ComponentFixture<CardItemPermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardItemPermissionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardItemPermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
