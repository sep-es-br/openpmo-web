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
}

export interface IBaselineUpdates {
  idWorkpack?: number;
  icon: string;
  description: string;
  classification: string; // NEW | CHANGED | DELETED
  included?: boolean;

  readonly?: boolean; //only screen
}

export interface IBaselineEvaluations {
  ccbMemberName: string;
  decision?: string; //APPROVED | REJECTED
  inRoleWorkLocation?: string;
  when?: string; //datetime
  comment?: string;
  myEvaluation?: boolean;
}

interface ICostBaseline  {
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