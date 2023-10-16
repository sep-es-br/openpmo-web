import { IMilestoneDashboard, ITripleConstraintDashboard } from './IDashboard';
import { TypeWorkpackEnum } from '../enums/TypeWorkpackEnum';
import { TypeWorkpackModelEnum } from '../enums/TypeWorkpackModelEnum';
import { IWorkpackModel } from './IWorkpackModel';
import { IWorkpackModelProperty } from './IWorkpackModelProperty';
import { IWorkpackProperty } from './IWorkpackProperty';

export interface IWorkpack {
    id?: number;
    name?: string;
    fullName?: string;
    fontIcon?: string;
    model?: {
      type: string;
      childWorkpackModelSessionActive?: boolean;
      children?: IWorkpackModel[];
      costSessionActive?: boolean;
      fontIcon: string;
      id: number;
      modelName: string;
      modelNameInPlural: string;
      organizationRoles?: string[];
      parent?: {
        fontIcon: string;
        id: number;
        modelName: string;
        type: TypeWorkpackModelEnum;
      };
      personRoles?: string[];
      planModel: {
        fullName: string;
        id: number;
        name: string;
      };
      properties: IWorkpackModelProperty[];
      stakeholderSessionActive?: boolean;
      riskAndIssueManagementSessionActive?: boolean;
      processesManagementSessionActive?: boolean;
      dashboardSessionActive?: boolean;
      dashboardShowEva?: boolean;
      dashboardShowMilestones?: boolean;
      dashboardShowRisks?: boolean;
      dashboardShowStakeholders?: string[];
    };
    plan?: {
      fullName: string;
      id: number;
      name: string;
      idOffice?: number;
    };
    delayInDays?: number;
    baselineDate?: Date;
    idParent?: number;
    idPlan?: number;
    type: TypeWorkpackEnum;
    idWorkpackModel?: number;
    properties: IWorkpackProperty[];
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
    linked?: boolean;
    linkedModel?: number;
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
    favoritedBy?: boolean;
    hasScheduleSectionActive?: boolean;
    reason?: string;
    dashboardData?: {
      risk?: {
        high: number,
        low: number,
        medium: number,
        total: number
      },
      milestone?: IMilestoneDashboard,
      tripleConstraint?: ITripleConstraintDashboard,
      costPerformanceIndex: {
        costVariation: number,
        indexValue: number
      },
      schedulePerformanceIndex: {
        indexValue: number,
        scheduleVariation: number
      },
      earnedValue?: number;
    },
    milestoneStatus?: string;
    milestoneDate?: string;
    hasWBS?: boolean;
    hasChildren?: boolean;
    dashboard?: IWorkpackDashboard;
    milestones?: {
      completed: boolean,
      milestoneDate: string;
      snapshotDate: string;
    } [];
    risks?: {
      importance: string;
      status: string;
    } [];
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
    scopeForeseenValue: number
  };
  performanceIndex: {
    costPerformanceIndexValue: number;
    costPerformanceIndexVariation: number;
    schedulePerformanceIndexValue: number;
    schedulePerformanceIndexVariation: number
  };
  earnedValue?: number;
}

interface IPermission {
  id?: number;
  level: string;
  role?: string;
}
