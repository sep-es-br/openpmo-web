import { MenuItem } from 'primeng/api';

export interface IScheduleStepCardItem {
  stepName?: Date;
  stepDay?: Date;
  menuItems?: MenuItem[];
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
  idStep?: number;
  urlCard?: string;
  urlParams?: {
    idSchedule: number;
    stepType: string;
    unitName: string;
  };
}
