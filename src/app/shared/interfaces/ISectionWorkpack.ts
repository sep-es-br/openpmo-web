import { IScheduleStepCardItem } from './IScheduleStepCardItem';
import { IWorkpackCardItem } from './IWorkpackCardItem';
import { ICardItem } from './ICardItem';
import { ICard, progressBarValue } from 'src/app/shared/interfaces/ICard';
export interface ISection {
  idWorkpackModel?: number;
  cardSection: ICard;
  cardItemsSection?: ICardItem[];
}

export interface ISectionWorkpacks {
  idWorkpackModel?: number;
  cardSection: ICard;
  cardItemsSection?: IWorkpackCardItem[];
  workpackShowCancelleds?: boolean;
}

export interface IScheduleSection {
  cardSection: ICard;
  startScheduleStep?: IScheduleStepCardItem;
  endScheduleStep?: IScheduleStepCardItem;
  groupStep?: {
    year: number;
    cardItemSection?: IScheduleStepCardItem[];
    start?: boolean;
    end?: boolean;
    groupProgressBar?: progressBarValue[];
    budgetedValue?: string,
    authorizedValue?: string,
    liquidatedTotal?: string
  }[];
}