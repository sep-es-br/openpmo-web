import { TypeWorkpackEnumWBS } from '../enums/TypeWorkpackEnum';

export interface IBaseline {
  id?: number;
  idWorkpack: number;
  projectName?: string;
  status: string; // DRAFT | PROPOSED | APPROVED | REJECTED
  name: string;
  active?: boolean;
  description: string;
  activationDate?: string;
  proposalDate?: string;
  message?: string;
  cancelation?: boolean;
  proposer?: string;
  updates?: IBaselineUpdates[];
  evaluations?: IBaselineEvaluations[];
  cost?: ICostBaseline;
  schedule?: IScheduleBaseline;
  scope?: IScopeBaseline;
  default?: boolean;
  projectFullName?: string;
  tripleConstraintBreakdown?: Array<ITripleConstraintBreakdown>;
}

export interface IBaselineUpdates {
  idWorkpack: number;
  idWorkpackModel: number;
  idPlan: number;
  name: string;
  fullName: string;
  fontIcon: string;
  modelName: string;
  modelNameInPlural: string;
  type: TypeWorkpackEnumWBS;
  children?: Array<IBaselineUpdates>;
  classification: UpdateStatus; // NEW | CHANGED | DELETED | TO_CANCEL | NO_SCHEDULE | UNDEFINED_SCOPE
  included?: boolean;
  readonly?: boolean; //only screen
  deliveryModelHasActiveSchedule?: boolean; // Only for deliveries
}

export interface IBaselineEvaluations {
  ccbMemberName: string;
  decision?: string; //APPROVED | REJECTED
  inRoleWorkLocation?: string;
  when?: string; //datetime
  comment?: string;
  myEvaluation?: boolean;
}

interface ICostBaseline {
  variation?: number;
  currentValue?: number;
  proposedValue: number;
  costDetails?: {
    icon: string;
    description: string;
    currentValue?: number;
    proposedValue?: number;
    variation?: number;
  }[];
}

interface IScheduleBaseline {
  variation?: number;
  currentStartDate?: string;
  currentEndDate?: string;
  currentValue?: number;
  proposedStartDate: string;
  proposedEndDate: string;
  proposedValue: number;
  scheduleDetails?: {
    icon: string;
    description: string;
    currentDate?: string;
    proposedDate?: string;
    variation?: number;
  }[];

  //only screen
  monthsInPeriod?: number;
  difStartCurrentDateAndStartProposedDate?: number;
  difEndCurrentDateAndEndProposedDate?: number;
  marginHightProposedBar?: number;
  marginLeftCurrentBar?: number;
}

interface IScopeBaseline {
  currentScopePercent?: number;
  proposedScopePercent: number;
  variation?: number;
  scopeDetails?: {
    icon: string;
    description: string;
    currentValue?: number;
    proposedValue?: number;
    unitName?: string;
    variation?: number;
  }[];
}

export enum UpdateStatus {
  NEW = 'NEW',
  CHANGED = 'CHANGED',
  DELETED = 'DELETED',
  TO_CANCEL = 'TO_CANCEL',
  NO_SCHEDULE = 'NO_SCHEDULE',
  UNDEFINED_SCOPE = 'UNDEFINED_SCOPE',
  UNCHANGED = 'UNCHANGED',
}

export interface ITripleConstraintBreakdown {
  idWorkpack: number;
  idPlan: number;
  name: string;
  fullName: string;
  fontIcon: string;
  type: string;
  modelName: string;
  modelNameInPlural: string;
  workpackStatus?: UpdateStatus;
  costDetails: CostDetailItem;
  scheduleDetails: ScheduleDetailItem;
  scopeDetails: ScopeDetailItem;
  children?: Array<ITripleConstraintBreakdown>;
}

export interface CostDetailItem {
  idWorkpack: number;
  icon: string;
  description: string;
  currentValue?: number;
  proposedValue?: number;
}

export interface ScheduleDetailItem {
  idWorkpack: number;
  icon: string;
  description: string;
  currentDate?: string;
  proposedDate?: string;
  variation?: number;
}

export interface ScopeDetailItem {
  idWorkpack: number;
  icon: string;
  description: string;
  currentValue?: string;
  proposedValue?: string;
  unitName?: string;
  variation?: number;
}
