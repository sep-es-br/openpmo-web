import { MenuItem } from 'primeng/api';

export interface ICardItem {
  typeCardItem: string;
  icon: string;
  iconSvg?: boolean;
  nameCardItem?: string;
  fullNameCardItem?: string;
  subtitleCardItem?: string;
  costAccountsValue?: number;
  itemId?: number;
  menuItems?: MenuItem[];
  urlCard?: string;
  paramsUrlCard?: {name: string; value: string | number}[];
  iconMenuItems?: MenuItem[];
  editPermission?: boolean;
}

