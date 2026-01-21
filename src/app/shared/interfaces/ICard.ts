import { IFilterDataview } from './IFilterDataview';
import { SelectItem, MenuItem } from 'primeng/api';
import { EventEmitter } from '@angular/core';
import { ICardItem } from './ICardItem';

export interface ICard {
  totalRecords?: number;
  collapseble: boolean;
  initialStateCollapse?: boolean;
  notShowCardTitle?: boolean;
  cardTitle?: string;
  tabTitle?: string;
  toggleable: boolean;
  toggleLabel?: string;
  initialStateToggle: boolean;
  showFilters?: boolean;
  hideTextFilter?: boolean;
  filters?: IFilterDataview[];
  showCreateNemElementButtonWorkpack?: boolean;
  showCreateNemElementButton?: boolean;
  createNewElementMenuItems?: MenuItem[];
  createNewElementMenuItemsWorkpack?: MenuItem[];
  headerDates?: {
    startDate: Date;
    endDate: Date;
  };
  onNewItem?;
  progressBarValues?: ProgressBarValue[];
  onToggle?: EventEmitter<boolean>;
  cardItems?: ICardItem[];
  canEditCheckCompleted?: boolean;
  showCheckCompleted?: boolean;
  workpackCompleted?: boolean;
  showFullScreen?: boolean;
  fullScreen?: boolean;
  workpackType?: string;
  workpackCanceled?: boolean;
  isLoading?: boolean;
  idFilterSelected?: number;
  searchTerm?: string;
  headerLabels?: {
    text: string;
    type: 'blue' | 'yellow' | 'red';
    icon?: string;
  }[];
}

export interface ProgressBarValue {
  total: number;
  progress?: number;
  planned?: number;
  limit?: number;
  labelTotal: string;
  labelProgress?: string;
  labelPlanned?: string;
  valueUnit: string;
  color: string;
  barHeight?: number;
  baselinePlanned?: number;
  startDateBaseline?: Date;
  endDateBaseline?: Date;
  startDateTotal?: Date;
  endDateTotal?: Date;
  type?: string;
}
