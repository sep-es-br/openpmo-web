import { MenuItem, TreeNode } from 'primeng/api';
import { IFile } from './IFile';

export interface ICardItem {
  typeCardItem: string;
  icon: string;
  iconSvg?: boolean;
  iconColor?: string;
  nameCardItem?: string;
  fullNameCardItem?: string;
  subtitleCardItem?: string;
  statusItem?: string;
  organizationName?: string;
  costAccountsValue?: number;
  itemId?: number;
  menuItems?: MenuItem[];
  menuConfig?: boolean;
  urlMenuConfig?: string;
  paramsUrlMenuConfig?: {name: string; value: string | number}[];
  urlCard?: string;
  paramsUrlCard?: {name: string; value: string | number}[];
  iconMenuItems?: MenuItem[];
  editPermission?: boolean;
  reuseModelMenuItems?: TreeNode[];
  avatar?: IFile;
  linked?: boolean;
  shared?: boolean;
  baselineStatus?: string;
  baselineStatusDate?: string;
  baselineActive?: boolean;
  active?: boolean;
  roles?: string[];
  canceled?: boolean;
}

