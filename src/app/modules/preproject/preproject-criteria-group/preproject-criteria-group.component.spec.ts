import { SimpleChange } from '@angular/core';
import { PreprojectCriteriaGroupComponent } from './preproject-criteria-group.component';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';

describe('PreprojectCriteriaGroupComponent property integration', () => {
  it('adapts lists to the shared property type and propagates selected items', () => {
    const component = new PreprojectCriteriaGroupComponent();
    component.group = {
      title: 'Alinhamento', sortIndex: 1, weight: 1, operation: 'SUM',
      enablementKey: false, disabledValue: '', legend: '',
      properties: [{ id: 10, type: 'SdgListModel', name: 'ODS', label: 'ODS', active: true }]
    };
    component.ngOnChanges({ group: new SimpleChange(null, component.group, true) });
    const item = component.properties[0];
    expect(item.value instanceof PropertyTemplateModel).toBe(true);
    expect(item.value.type).toBe(TypePropertyModelEnum.ListModel);
    expect(item.value.listCatalog).toBe('ODS');

    item.value.selectedListItems = [{ id: 1, foreignKey: 'ods:1', name: 'ODS 1' }];
    component.propertyChanged(item);
    expect(component.group.properties[0].selectedListItems).toEqual(item.value.selectedListItems);
  });

  it('passes group toggles and read-only state to list properties', () => {
    const component = new PreprojectCriteriaGroupComponent();
    component.group = {
      title: 'Alinhamento', sortIndex: 1, weight: 1, operation: 'SUM',
      enablementKey: true, disabledValue: '', legend: '',
      properties: [{ id: 10, type: 'ChallengeListModel', name: 'Desafios', label: 'Desafios', active: true }]
    };
    component.ngOnInit();
    component.ngOnChanges({ group: new SimpleChange(null, component.group, true) });
    const disabledProperty = component.properties[0].value;
    expect(disabledProperty.disabled).toBe(true);
    component.cardProperties.onToggle.emit(true);
    expect(component.properties[0].value.disabled).toBe(false);
    expect(component.properties[0].value).not.toBe(disabledProperty);

    component.readOnly = true;
    component.ngOnChanges({ readOnly: new SimpleChange(false, true, false) });
    expect(component.properties[0].value.disabled).toBe(true);
    component.ngOnDestroy();
  });
});
