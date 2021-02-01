import { MenuItem } from 'primeng/api';

export interface ICardItemMeasureUnit{
  typeCardItem: string;
  icon: string;
  id?: number;
  index?: number;
  itemId?: string;
  menuItems?: MenuItem[];
  newId?: string;
  command?: (event?: any) => void;
}
