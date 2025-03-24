import { TypeWorkpackEnumWBS } from '../enums/TypeWorkpackEnum';
import { IFile } from './IFile';
import { IMeasureUnit } from './IMeasureUnit';
import { IInformation, IWorkpackJournalInformation } from './IJournal';

export interface IWorkpackBreakdownStructure {
  idWorkpack: number;
  workpackName: string;
  linked?: boolean;
  dashboard?: IDashboardData;
  milestones?: {
      completed: boolean,
      milestoneDate: string;
      snapshotDate: string;
  } [];
  risks?: {
      importance: string;
      status: string;
  } [];
  dashboardData?: IDashboard;
  baselineCost?: number;
  baselineEnd?: string;
  baselinePlanned?: number;
  baselineStart?: string;
  unitMeasure?: IMeasureUnit;
  end?: string;
  planed?: number;
  actual?: number;
  planedCost?: number;
  actualCost?: number;
  start?: string;
  workpackType?: TypeWorkpackEnumWBS;
  hasChildren?: boolean;
  journalInformation?: IWorkpackJournalInformation;
  expirationDate?: string;
  milestoneDate?: string;
  milestoneStatus?: string;

  workpackModels: IWorkpackBreakdownStructureWorkpackModel[];
}

export interface IWorkpackBreakdownStructureWorkpackModel {
  idWorkpackModel:   number;
  workpackModelName: string;
  workpackModelType: string;
  workpacks:         IWorkpackBreakdownStructure[];
}

interface IDashboard {
  milestone?: IMilestoneDashboard;
  risk?: IRiskDashboard;
  tripleConstraint: ITripleConstraintDashboard;
  costPerformanceIndex?:     any;
  schedulePerformanceIndex?: any;
  earnedValue?: number;
}

interface IMilestoneDashboard {
  concluded: number;
  late: number;
  lateConcluded: number;
  onTime: number;
  quantity: number;
}

interface IRiskDashboard {
  closed: number;
  high: number;
  low: number;
  medium: number;
  total: number;
}


interface ITripleConstraintDashboard {
  idBaseline?: number;
  mesAno?: string;
  cost: {
    actualValue: number;
    foreseenValue: number;
    plannedValue: number;
    variation: number;
  };
  schedule: {
    actualEndDate: string;
    actualStartDate: string;
    actualValue: number;
    foreseenEndDate: string;
    foreseenStartDate: string;
    foreseenValue: number;
    plannedEndDate: string;
    plannedStartDate: string;
    plannedValue: number;
    variation: number;
  };
  scope: {
    actualVariationPercent: number;
    foreseenVariationPercent: number;
    plannedVariationPercent: number;
    foreseenValue?: number;
    actualValue?: number;
    variation: number;
    foreseenWorkRefMonth?: number;
  };

}

interface IDashboardData {
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
    scopeActualValue: number;
  };
  performanceIndex: {
    costPerformanceIndexValue: number;
    costPerformanceIndexVariation: number;
    schedulePerformanceIndexValue: number;
    schedulePerformanceIndexVariation: number
  };
  earnedValue?: number;
}
