import { IWorkpackModelProperty } from './IWorkpackModelProperty';
import { IOffice } from './IOffice';

export type CriteriaOperation = 'AVERAGE' | 'SUM';

export interface CriteriaSelectionOption {
  value: number;
  label: string;
  position: number;
  default?: boolean;
}

export interface PreProjectListItem {
  foreignKey: string;
  label: string;
}

export interface CriteriaModelBase {
  id?: number;
  active: boolean;
  name: string;
  label: string;
  sortIndex: number;
  fullLine?: boolean;
  required?: boolean;
  helpText?: string;
}

export interface CriteriaPropertyModel extends IWorkpackModelProperty {
  propertyModelType?: 'CriteriaSelectionModel' | 'CriteriaListModel';
  weight?: number;
  itemValue?: number;
  selectionOptions?: CriteriaSelectionOption[];
}

export interface CriteriaGroupModel {
  propertyModelType?: 'CriteriaGroupModel';
  title: string;
  sortIndex: number;
  weight: number;
  operation: CriteriaOperation;
  enablementKey: boolean;
  disabledValue: string;
  legend: string;
  properties: CriteriaPropertyModel[];
}

export interface CriteriaTabModel {
  propertyModelType?: 'CriteriaTabModel';
  id: number;
  name: string;
  active?: boolean;
  position: number;
  icon: string;
  weight: number;
  operation: CriteriaOperation;
  properties: CriteriaPropertyModel[];
  groups: CriteriaGroupModel[];
}

export interface CriteriaPropertyBase {
  id?: number;
  propertyType: 'CriteriaList' | 'CriteriaSelection' | 'CriteriaGroup' | 'CriteriaTab';
  idPropertyModel?: number;
}

export interface CriteriaList extends CriteriaPropertyBase {
  propertyType: 'CriteriaList';
  items: PreProjectListItem[];
}

export interface CriteriaSelection extends CriteriaPropertyBase {
  propertyType: 'CriteriaSelection';
  values: CriteriaSelectionOption[];
  selectedValues: number[];
}

export interface CriteriaGroup extends CriteriaPropertyBase {
  propertyType: 'CriteriaGroup';
  enabled: boolean;
  properties: CriteriaProperty[];
}

export interface CriteriaTab extends CriteriaPropertyBase {
  propertyType: 'CriteriaTab';
  properties: CriteriaProperty[];
}

export type CriteriaProperty = CriteriaList | CriteriaSelection | CriteriaGroup | CriteriaTab;

export interface PreProject {
  name: string;
  fullName: string;
  idModel?: number;
  features: CriteriaProperty[];
}

export interface PreProjectModel {
  id?: number;
  name: string;
  fullName: string;
  office?: Pick<IOffice, 'id' | 'name' | 'fullName'>;
  listItems: PreProjectListItem[];
  criteriaTabs: CriteriaTabModel[];
}
