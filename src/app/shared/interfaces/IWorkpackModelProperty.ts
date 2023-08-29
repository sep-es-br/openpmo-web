import { SelectItem, MenuItem, TreeNode } from 'primeng/api';

export interface IWorkpackModelProperty {
  id?: number;
  type: string;
  session?: string;
  active: boolean;
  fullLine?: boolean;
  label: string;
  name: string;
  required?: boolean;
  sortIndex?: number;
  defaultValue?: number | number[] | string | string[] | boolean | Date;
  defaults?: number | number[];
  defaultsDetails?: {id: number; name: string; fullName: string}[];
  min?: number;
  max?: number;
  possibleValues?: string;
  possibleValuesOptions?: string[];
  sectorsList?: string[];
  sectors?: string;
  multipleSelection?: boolean;
  rows?: number;
  decimals?: number;
  precision?: number;
  idDomain?: number;
  list?: SelectItem[];
  extraList?: TreeNode[];
  extraListDefaults?: TreeNode | TreeNode[];
  selectedLocalities?: string;
  requiredFields?: string[];
  obligatory?: boolean;
  isCollapsed?: boolean;
  viewOnly?: boolean;
  groupedProperties?: IWorkpackModelProperty[];
  menuModelProperties?: MenuItem[]; //only screen
  showIconButtonSelectLocality?: boolean; //only screen
}
