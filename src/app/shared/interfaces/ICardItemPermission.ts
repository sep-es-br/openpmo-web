import { IOffice } from './IOffice';
import { MenuItem } from 'primeng/api';

export interface ICardItemPermission {
  typeCardItem: string;
  titleCardItem?: string;
  roleDescription?: string;
  menuItems?: MenuItem[];
  urlCard?: string;
  paramsUrlCard?: {name: string; value: string | number}[];
  itemId?: number;
  levelListOptions?: { label: string; value: string}[];
  selectedOption?: string;
  iconMenuItems?: MenuItem[]; 
  readOnly?: boolean;
  office?: IOffice;
}
