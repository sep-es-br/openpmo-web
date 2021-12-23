import { SelectItem, MenuItem, TreeNode } from 'primeng/api';
import { TypePropertyEnum } from '../enums/TypePropertyWorkpackEnum';

export interface IWorkpackModelProperty {
  id?: number;
  type: string;
  active: boolean;
  fullLine?: boolean;
  label: string;
  name: string;
  required?: boolean;
  session?: string;
  sortIndex?: number;
  defaultValue?: number | number[] | string | string[] | boolean | Date;
  defaults?: number | number[];
  min?: number | string;
  max?: number | string;
  possibleValues?: string[] | string;
  multipleSelection?: boolean;
  rows?: number;
  decimals?: number;
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
