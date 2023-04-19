import { TypeWorkpackEnumWBS } from '../enums/TypeWorkpackEnum';
import { IMeasureUnit } from './IMeasureUnit';

export interface IWorkpackBreakdownStructure {
  idWorkpack:     number;
  workpackName:   string;
  dashboard:      IDashboard;

  baselineCost?: number;
  baselineEnd?: number;
  baselinePlanned?: number;
  baselineStart?: number;
  unitMeasure?: IMeasureUnit;
  end?: string;
  planed?: number;
  actual?: number;
  planedCost?: number;
  actualCost?: number;
  start?: string;
  workpackType?: TypeWorkpackEnumWBS;

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
  earnedValueAnalysis: IEarnedValueAnalysisDashboard;
  milestone?: IMilestoneDashboard;
  risk?: IRiskDashboard;
  stakeholders?: IStakeholderDashboard[];
  tripleConstraint: ITripleConstraintDashboard;
  costPerformanceIndex?:     any;
  schedulePerformanceIndex?: any;
  earnedValue?:              number;
  workpacksByModel?: {
    quantity: number;
    modelName: string;
    icon: string;
  }[];
}

interface IEarnedValueAnalysisDashboard {
  performanceIndexes: {
    actualCost: number;
    costPerformanceIndex: {
      costVariation: number;
      indexValue: number;
    };
    earnedValue: number;
    estimateToComplete: number;
    estimatesAtCompletion: number;
    plannedValue: number;
    schedulePerformanceIndex: {
      indexValue: number;
      scheduleVariation: number;
    };
  }[];
  earnedValueByStep:
  {
    actualCost: number;
    plannedValue: number;
    earnedValue: number;
    date: string;
  }[];
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

interface IStakeholderDashboard {
  actor: {
    avatar?: {
      id: number;
      mimeType: string;
      name: string;
      url: string;
    };
    fullName: string;
    id: number;
    name: string;
    organization?: boolean;
  };
  role: string;
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
  };
}
