import { PropertyTemplateModel } from './PropertyTemplateModel';
import { TypePropertyModelEnum } from '../enums/TypePropertyModelEnum';
import { TypePropertModelEnum } from '../enums/TypePropertModelEnum';
import { hasPropertyWeight } from '../utils/property-weight.util';

describe('Shared property values', () => {
  it('preserves list serialization and stable fallback keys', () => {
    const property = Object.assign(new PropertyTemplateModel(), {
      type: TypePropertyModelEnum.ListModel,
      idPropertyModel: 42,
      selectedListItems: [{ id: -1, name: 'ODS 1' }]
    });
    expect(property.getValues().items).toEqual([{
      foreignKey: 'criteria-42-1', label: 'ODS 1', fullName: undefined
    }]);
  });

  it('keeps the serialization of existing property types', () => {
    const property = Object.assign(new PropertyTemplateModel(), {
      type: TypePropertyModelEnum.SelectionModel,
      multipleSelection: true,
      value: ['A', 'B']
    });
    expect(property.getValues().value).toBe('A,B');
    expect(property.getValues().items).toBeUndefined();
  });

  it('limits property weights to multivalue selection, ODS and challenges', () => {
    const weighted = [
      TypePropertModelEnum.CriteriaSelectionModel,
      TypePropertModelEnum.ChallengeListModel,
      TypePropertModelEnum.SdgListModel
    ];
    Object.values(TypePropertModelEnum).forEach(type => {
      expect(hasPropertyWeight(type)).toBe(weighted.includes(type));
    });
  });
});
