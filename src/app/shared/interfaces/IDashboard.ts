import { MenuItem } from "primeng/api";
import { IMilestonePropertyData } from "./IMilestonePropertyData";

export interface IDashboard {
  tripleConstraint: {
    costPlannedValue: number;
    costActualValue: number;
    schedulePlannedStartDate: string;
    schedulePlannedEndDate: string;
    scheduleActualStartDate: string;
    scheduleActualEndDate: string;
    schedulePlannedValue: number;
    scheduleActualValue: number;
    scopePlannedVariationPercent: number;
    scopeActualVariationPercent: number;
    scopePlannedValue: number;
    scopeActualValue: number;
  };
  performanceIndex: {
    costPerformanceIndexValue: number;
    costPerformanceIndexVariation: number;
    schedulePerformanceIndexValue: number;
    schedulePerformanceIndexVariation: number;
    actualCost: number;
    earnedValue: number;
    estimateToComplete: number;
    estimatesAtCompletion: number;
    plannedValue: number;
    plannedValueRefMonth?: number;
  };
  earnedValueByStep: IEarnedValueByStep[]; 
  scheduleInterval: { initialDate: string; endDate: string };
  
  milestone?: IMilestoneDashboard;
  risk?: IRiskDashboard;
  stakeholders?: IStakeholderDashboard[];
  workpacksByModel?: {
    idWorkpackModel: number;
    level: number;
    quantity: number;
    modelName: string;
    icon: string;
    menuItems?: MenuItem[];
    workpacks?: IWorkpackByModel[];
  }[];
  dashboardStatusData: IDashboardStatusData;
}

export interface IDashboardData {
  earnedValueAnalysis: IEarnedValueAnalysisDashboard;
  milestone?: IMilestoneDashboard;
  risk?: IRiskDashboard;
  stakeholders?: IStakeholderDashboard[];
  tripleConstraint: ITripleConstraintDashboard;
  costPerformanceIndex?:     any;
  schedulePerformanceIndex?: any;
  earnedValue?: number;
  workpacksByModel?: {
    idWorkpackModel: number;
    level: number;
    quantity: number;
    modelName: string;
    icon: string;
    menuItems?: MenuItem[];
    workpacks?: IWorkpackByModel[];
  }[];
  dashboardStatusData: IDashboardStatusData;
}

export interface IDashboardStatusData {
    statusConcluida : number;
    statusEmExec : number;
    statusCancelar : number;
    statusPlanejamento : number;
    statusParalisada : number;
    totalDeliverable : number;
}

export interface IWorkpackByModel {
  id: number;
  idWorkpackModel: number;
  name: string;
  icon: string;
  linked?: boolean;
  workpacks?: IWorkpackByModel[];
}

export interface IEarnedValueAnalysisDashboard {
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
  };
  earnedValueByStep: IEarnedValueByStep[];
}

export interface IEarnedValueByStep {
  actualCost: number;
  plannedCost: number;
  earnedValue: number;
  date: string;
}

export interface IMilestoneDashboard {
  concluded: number;
  late: number;
  lateConcluded: number;
  onTime: number;
  quantity: number;
}

export interface IRiskDashboard {
  closed: number;
  high: number;
  low: number;
  medium: number;
  total: number;
}

export interface IStakeholderDashboard {
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

export interface ITripleConstraintDashboard {
  idBaseline?: number;
  mesAno?: string;
  cost: {
    actualValue: number;
    plannedValue: number;
  };
  schedule: {
    actualEndDate: string;
    actualStartDate: string;
    actualValue: number;
    plannedEndDate: string;
    plannedStartDate: string;
    plannedValue: number;
  };
  scope: {
    actualVariationPercent: number;
    plannedVariationPercent: number;
    actualValue?: number;
    plannedValue?: number;
  };
}
