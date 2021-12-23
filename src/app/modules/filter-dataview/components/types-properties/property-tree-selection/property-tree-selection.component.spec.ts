import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyTreeSelectionComponent } from './property-tree-selection.component';

describe('PropertyTreeSelectionComponent', () => {
  let component: PropertyTreeSelectionComponent;
  let fixture: ComponentFixture<PropertyTreeSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyTreeSelectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyTreeSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
