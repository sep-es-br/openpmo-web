import { TranslateService } from '@ngx-translate/core';
import { TreeNode } from 'primeng/api';
import { TypePropertyModelEnum } from '../enums/TypePropertyModelEnum';
import { IProperty } from '../interfaces/IProperty';
import { IWorkpackProperty } from '../interfaces/IWorkpackProperty';

export class PropertyTemplateModel implements IProperty {
  id?: number;
  type: string;
  idPropertyModel: number;
  active: boolean;
  fullLine?: boolean;
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  session?: string;
  sortIndex?: number;
  defaultValue?: number | string | boolean | string[] | number[] | Date;
  defaults?: number | number[];
  min?: number | string;
  max?: number | string;
  possibleValues?: { label: string; value: string }[];
  possibleValuesIds?: { label: string; value: number }[];
  multipleSelection?: boolean;
  rows?: number;
  decimals?: number;
  localityList?: TreeNode[];
  idDomain?: number;
  localitiesSelected?: TreeNode | TreeNode[];
  value?: string | number | boolean | string[] | Date | number[];
  selectedValues?: number[] | number;
  selectedValue?: number;
  invalid?: boolean;
  message?: string;

  getValues() {
    const {
      id,
      idPropertyModel,
      type,
      value,
      selectedValue,
      selectedValues,
      multipleSelection,
      localitiesSelected,
      idDomain
    } = this;
    const property: IWorkpackProperty = {
      id,
      idPropertyModel,
      type
    };
    switch (this.type) {
      case TypePropertyModelEnum.DateModel:
        property.value = value as Date;
        break;
      case TypePropertyModelEnum.SelectionModel:
        const selectedOptions = multipleSelection && value as string[];
        const stringValue = selectedOptions ? selectedOptions.join(',') : value as string;
        property.value = stringValue;
        break;
      case TypePropertyModelEnum.UnitSelectionModel:
        property.selectedValue = selectedValue;
        break;
      case TypePropertyModelEnum.OrganizationSelectionModel:
        const selectedOrganization = !multipleSelection && selectedValues as number;
        property.selectedValues = selectedOrganization ? [selectedOrganization] : selectedValues as number[];
        break;
      case TypePropertyModelEnum.LocalitySelectionModel:
        if (!multipleSelection) {
          const selectedLocality = localitiesSelected as TreeNode;
          property.selectedValues = [selectedLocality.data];
        }
        if (multipleSelection) {
          const selectedLocality = localitiesSelected as TreeNode[];
          property.selectedValues = selectedLocality.filter(locality => locality.data !== idDomain)
            .map(l => l.data);
        }
        break;
      case TypePropertyModelEnum.CurrencyModel:
        property.value = value as number;
        break;
      case TypePropertyModelEnum.NumberModel:
        property.value = value as number;
        break;
      case TypePropertyModelEnum.IntegerModel:
        property.value = value as number;
        break;
      default:
        property.value = value as string;
        break;
    }
    return property;
  }
}
