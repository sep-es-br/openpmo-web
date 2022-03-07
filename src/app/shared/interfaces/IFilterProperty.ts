import { TreeNode } from 'primeng/api';

export interface IFilterProperty {
  id?: number;
  type: string;
  idPropertyModel?: number;
  label: string;
  name: string;
  defaultValue?: number | string | boolean | string[] | number[] | Date;
  defaults?: number | number[];
  min?: number | string;
  max?: number | string;
  possibleValues?: {label: string; value: string}[];
  possibleValuesIds?: { label: string; value: number }[];
  multipleSelection?: boolean;
  idDomain?: number;
  localityList?: TreeNode[];
  localitiesSelected?: TreeNode | TreeNode[];
  active?: boolean;
}