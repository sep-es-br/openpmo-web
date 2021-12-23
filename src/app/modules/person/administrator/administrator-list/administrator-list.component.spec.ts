import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministratorListComponent } from './administrator-list.component';

describe('AdministratorListComponent', () => {
  let component: AdministratorListComponent;
  let fixture: ComponentFixture<AdministratorListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdministratorListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdministratorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
