import { MenuItem } from 'primeng/api';

export interface IScheduleStepCardItem {
  type: string;
  editPermission?: boolean;
  stepName?: Date;
  stepDay?: Date;
  menuItems?: MenuItem[];
  stepOrder?: string;
  unitPlanned?: number;
  unitActual?: number;
  liquidatedValue?: string,
  unitBaseline?: number;
  unitProgressBar?: {
    total: number;
    progress: number;
    color: string;
  };
  costProgressBar?: {
    total: number;
    progress: number;
    color: string;
  };
  costPlanned?: number;
  costActual?: number;
  baselinePlannedCost?: number;
  unitName?: string;
  unitPrecision?: number;
  idStep?: number;
  urlCard?: string;
  urlParams?: {name: string; value: string | number}[];
  editCosts?: boolean; // only screen
  multipleCosts?: boolean; // only screen
}
