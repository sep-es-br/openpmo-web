import { MenuItem } from 'primeng/api';

export interface IScheduleStepCardItem {
  type: string;
  stepName?: Date;
  stepDay?: Date;
  menuItems?: MenuItem[];
  stepOrder?: string;
  unitPlanned?: number;
  unitActual?: number;
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
  unitName?: string;
  unitPrecision?: number;
  idStep?: number;
  urlCard?: string;
  urlParams?: {name: string; value: string | number}[];
}
