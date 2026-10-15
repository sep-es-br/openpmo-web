import { IPropertyListValueItem } from './IPropertyListItem';

export interface IWorkpackProperty {
  id?: number;
  type: string;
  name?: string;
  session?: string;
  idPropertyModel: number;
  value?: string | number | boolean | string[] | number[] | Date;
  selectedValues?: number[];
  selectedValuesDetails?: {id: number; name: string; fullName: string}[];
  selectedValue?: number;
  items?: IPropertyListValueItem[];
  reason?: string;
  groupedProperties?: IWorkpackProperty[];
}
