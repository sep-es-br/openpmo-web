export interface IPropertyListItem {
  id: number;
  name: string;
  fullName?: string;
  foreignKey?: string;
  data?: any;
}

export type PropertyListCatalog = 'ODS' | 'CHALLENGE';

export interface IPropertyListValueItem {
  foreignKey: string;
  label: string;
  fullName?: string;
}
