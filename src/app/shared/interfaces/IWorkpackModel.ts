import { TypeWorkpackModelEnum } from '../enums/TypeWorkpackModelEnum';
import { IWorkpackModelProperty } from './IWorkpackModelProperty';

export interface IWorkpackModel {
  id?: number;
  idPlanModel?: number;
  type: TypeWorkpackModelEnum;
  modelName: string;
  modelNameInPlural?: string;
  position?: number;
  fontIcon: string;
  childWorkpackModelSessionActive?: boolean;
  children?: IWorkpackModel[];
  costSessionActive?: boolean;
  journalManagementSessionActive?: boolean;
  organizationRoles?: string[];
  personRoles?: string[];
  planModel?: {
    id: number;
    name: string;
    fullname: string;
  };
  stakeholderSessionActive?: boolean;
  scheduleSessionActive?: boolean;
  properties?: IWorkpackModelProperty[];
  sortBy: IWorkpackModelProperty;
  sortByField?: string;
  riskAndIssueManagementSessionActive?: boolean;
  processesManagementSessionActive?: boolean;
  dashboardSessionActive?: boolean;
  dashboardShowEva?: boolean;
  dashboardShowMilestones?: boolean;
  dashboardShowRisks?: boolean;
  dashboardShowStakeholders?: string[];
}

export interface IReusableWorkpackModel {
  id: number;
  name: string;
  icon: string;
  reusable: boolean;
  children?: IReusableWorkpackModel[];
}
