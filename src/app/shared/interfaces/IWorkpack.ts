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
    dashboard?: {
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
}

interface IPermission {
  id?: number;
  level: string;
  role?: string;
}
