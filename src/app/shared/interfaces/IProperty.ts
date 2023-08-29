import { TreeNode } from 'primeng/api';

export interface IProperty {
  id?: number;
  type: string;
  idPropertyModel?: number;
  active: boolean;
  fullLine?: boolean;
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  sortIndex?: number;
  defaultValue?: number | string | boolean | string[] | number[] | Date;
  defaults?: number | number[];
  min?: number | string;
  max?: number | string;
  possibleValues?: {label: string; value: string}[];
  possibleValuesIds?: { label: string; value: number }[];
  multipleSelection?: boolean;
  rows?: number;
  decimals?: number;
  idDomain?: number;
  localityList?: TreeNode[];
  localitiesSelected?: TreeNode | TreeNode[];
  value?: string | number | boolean | string[] | Date | number[];
  selectedValues?: number[] | number;
  selectedValue?: number;
  invalid?: boolean;
  message?: string;
  getValues();
}
