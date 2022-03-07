import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScopeConstraintComponent } from './scope-constraint.component';

describe('ScopeConstraintComponent', () => {
  let component: ScopeConstraintComponent;
  let fixture: ComponentFixture<ScopeConstraintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScopeConstraintComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScopeConstraintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
