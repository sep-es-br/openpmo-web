import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOfficeConfigComponent } from './admin-office-config.component';

describe('AdminOfficeConfigComponent', () => {
  let component: AdminOfficeConfigComponent;
  let fixture: ComponentFixture<AdminOfficeConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminOfficeConfigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminOfficeConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
