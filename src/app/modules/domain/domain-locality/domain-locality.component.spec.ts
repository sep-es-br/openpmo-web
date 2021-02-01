import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DomainLocalityComponent } from './domain-locality.component';

describe('DomainLocalityComponent', () => {
  let component: DomainLocalityComponent;
  let fixture: ComponentFixture<DomainLocalityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DomainLocalityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DomainLocalityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
