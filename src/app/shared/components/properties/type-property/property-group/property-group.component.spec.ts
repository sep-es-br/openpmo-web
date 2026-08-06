import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { PropertyGroupComponent } from './property-group.component';

describe('PropertyGroupComponent', () => {
  let component: PropertyGroupComponent;
  let fixture: ComponentFixture<PropertyGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyGroupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should order grouped properties by sortIndex without changing the source array', () => {
    const first = { name: 'First', sortIndex: 1 } as PropertyTemplateModel;
    const second = { name: 'Second', sortIndex: 2 } as PropertyTemplateModel;
    const withoutSortIndex = { name: 'Without sort index' } as PropertyTemplateModel;
    component.groupProperty = {
      groupedProperties: [second, withoutSortIndex, first]
    } as PropertyTemplateModel;

    expect(component.groupedProperties).toEqual([first, second, withoutSortIndex]);
    expect(component.groupProperty.groupedProperties).toEqual([second, withoutSortIndex, first]);
  });
});
