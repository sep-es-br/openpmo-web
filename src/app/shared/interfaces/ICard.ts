import { IFilterDataview } from './IFilterDataview';
import { SelectItem, MenuItem } from 'primeng/api';
import { EventEmitter } from '@angular/core';
import { ICardItem } from './ICardItem';

export interface ICard {
  totalRecords?: number;
  collapseble: boolean;
  initialStateCollapse: boolean;
  cardTitle?: string;
  toggleable: boolean;
  toggleLabel?: string;
  initialStateToggle: boolean;
  showFilters?: boolean;
  filters?: IFilterDataview[];
  showCreateNemElementButton?: boolean;
  createNewElementMenuItems?: MenuItem[];
  headerDates?: {
    startDate: Date;
    endDate: Date;
  };
  progressBarValues?: progressBarValue[];
  onToggle?: EventEmitter<boolean>;
  cardItems?: ICardItem[];
}

export interface progressBarValue {
  total: number;
  progress: number;
  labelTotal: string;
  labelProgress: string;
  valueUnit: string;
  color: string;
  barHeight: number;
}
