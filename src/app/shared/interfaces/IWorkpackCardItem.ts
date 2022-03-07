import { IMilestoneDashboard, ITripleConstraintDashboard } from './IDashboard';
import { MenuItem } from 'primeng/api';
export interface IWorkpackCardItem {
  typeCardItem: string;
  icon?: string;
  iconSvg?: boolean;
  iconColor?: string;
  nameCardItem?: string;
  fullNameCardItem?: string;
  subtitleCardItem?: string;
  statusItem?: string;
  itemId?: number;
  menuItems?: MenuItem[];
  urlCard?: string;
  paramsUrlCard?: {name: string; value: string | number}[];
  iconMenuItems?: MenuItem[];
  editPermission?: boolean;
  linked?: boolean;
  shared?: boolean;
  active?: boolean;
  canceled?: boolean;
  endManagementDate?: string;
  completed?: boolean;
  dashboard?: {
    risk?: {
      high: number,
      low: number,
      medium: number,
      total: number 
    },
    milestone?: IMilestoneDashboard,
    tripleConstraint?: ITripleConstraintDashboard,
    costPerformanceIndex?: {
      costVariation: number,
      indexValue: number
    },
    earnedValue?: number;
    schedulePerformanceIndex?: {
      indexValue: number,
      scheduleVariation: number
    }
  },
  hasBaseline?: boolean;
  baselineName?: string;
}

