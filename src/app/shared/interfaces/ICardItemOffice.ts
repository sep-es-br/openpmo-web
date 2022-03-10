import { MenuItem } from "primeng/api";
import { IOffice } from "./IOffice";

export interface ICardItemOffice  {
  typeCardItem: string;
  icon?: string;
  iconSvg?: boolean;
  iconColor?: string;
  nameCardItem?: string;
  fullNameCardItem?: string;
  itemId?: number;
  urlMenuConfig?: string;
  paramsUrlMenuConfig?: {name: string; value: string | number}[];
  urlCard?: string;
  paramsUrlCard?: {name: string; value: string | number}[];
  editPermission?: boolean;
  office?: IOffice;
  iconMenuItems?: MenuItem[];
}
