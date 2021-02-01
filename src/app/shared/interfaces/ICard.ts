import { EventEmitter } from '@angular/core';

export interface ICard {
  collapseble: boolean;
  initialStateCollapse: boolean;
  cardTitle: string;
  toggleable: boolean;
  initialStateToggle: boolean;
  headerDates?: {
    startDate: Date;
    endDate: Date;
  };
  progressBarValues?: progressBarValue[];
  onToggle?: EventEmitter<boolean>;
}

export interface progressBarValue {
  total: number;
  progress: number;
  labelTotal: string;
  labelProgress: string;
  valueUnit: string;
  color: string;
}
