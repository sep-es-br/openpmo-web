import { IMilestoneDashboard, ITripleConstraintDashboard } from './IDashboard';
import { TypeWorkpackEnum } from '../enums/TypeWorkpackEnum';
import { IWorkpackProperty } from './IWorkpackProperty';
import { IPlan } from './IPlan';
import { IWorkpackModel } from './IWorkpackModel';
import { IWorkpackJournalInformation } from './IJournal';

export interface IWorkpack {
    id?: number;
    name?: string;
    fullName?: string;
    date?: string; // date do workpack milestone
    idParent?: number;
    idPlan?: number;
    type: TypeWorkpackEnum;
    idWorkpackModel?: number;
    properties: IWorkpackProperty[];
    canceled?: boolean;
    completed?: boolean;
    favoritedBy?: boolean;
    endManagementDate?: string;
    delayInDays?: number;
    baselineDate?: Date;
    cancelPropose?: boolean;
    pendingBaseline?: boolean;
    permissions?: IPermission[];
    hasScheduleSectionActive?: boolean;
    hasChildren?: boolean;
    milestoneStatus?: string;

    hasWBS?: boolean; //only screen
    // only workpacks linked
    modelLinked?: {
      id: number;
      name: string;
      nameInPlural: string;
      children: {
        idWorkpackModelLinked: number;
        nameWorkpackModelLinked: string;
        nameInPluralWorkpackModelLinked: string;
        idWorkpackModelOriginal: number;
      }[];
    };
    plan?: IPlan; // only getByIdworkpackLinked
    planOrigin?: IPlan;
    model?: IWorkpackModel; // only getByIdWorkpackLinked
}

export interface IWorkpackListCard {
    id: number;
    name: string;
    fullName: string;
    fontIcon: string;
    date?: string; // somente milestone
    type: TypeWorkpackEnum;
    linked?: boolean;
    permissions?: IPermission[];
    sharedWith?: boolean;
    pendingBaseline?: boolean;
    cancelPropose?: boolean;
    hasActiveBaseline?: boolean;
    activeBaselineName?: string;
    canceled?: boolean;
    cancelable?: boolean;
    completed?: boolean;
    canDeleted?: boolean;
    endManagementDate?: string;
    milestoneStatus?: string;
    dashboard?: IWorkpackDashboard;
    risk?: {
      high: number;
      low: number;
      medium: number;
      total: number;
    };
    milestone?: IMilestoneDashboard;
    idWorkpackModel?: number; // only screen
    idParent?: number; // only screen
    idPlan?: number; //only screen
    idOffice?: number; //only screen
    plan?: IPlan;
    reason?: string; // only to screen
    // dashboardData is only screen
    dashboardData?: {
      risk?: {
        high: number;
      low: number;
      medium: number;
      total: number;
      };
      milestone?: IMilestoneDashboard;
      tripleConstraint?: ITripleConstraintDashboard;
      costPerformanceIndex: {
        costVariation: number;
        indexValue: number;
      };
      schedulePerformanceIndex: {
        indexValue: number;
        scheduleVariation: number;
      };
      earnedValue?: number;
    };
    journalInformation?: IWorkpackJournalInformation;
}

interface IWorkpackDashboard {
  tripleConstraint: {
    costVariation: number;
    costPlannedValue: number;
    costForeseenValue: number;
    costActualValue: number;
    schedulePlannedStartDate: string;
    schedulePlannedEndDate: string;
    scheduleForeseenStartDate: string;
    scheduleForeseenEndDate: string;
    scheduleActualStartDate: string;
    scheduleActualEndDate: string;
    scheduleVariation: number;
    schedulePlannedValue: number;
    scheduleForeseenValue: number;
    scheduleActualValue: number;
    scopeVariation: number;
    scopePlannedVariationPercent: number;
    scopeForeseenVariationPercent: number;
    scopeActualVariationPercent: number;
    scopePlannedValue: number;
    scopeForeseenValue: number;
    scopeForeseenWorkRefMonth: number;
  };
  performanceIndex: {
    costPerformanceIndexValue: number;
    costPerformanceIndexVariation: number;
    schedulePerformanceIndexValue: number;
    schedulePerformanceIndexVariation: number;
  };
  earnedValue?: number;
}

interface IPermission {
  id?: number;
  level: string;
  role?: string;
}
