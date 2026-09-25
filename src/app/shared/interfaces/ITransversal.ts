import { WorkpackModelClassificationEnum } from '../enums/WorkpackModelClassificationEnum';

export interface ITransversalContext {
  idPlan: number;
  idPlanModel: number;
  idTransversalView?: number;
  idTransversalProgram?: number;
  idWorkpackModel?: number;
  idWorkpack?: number;
}

export interface ITransversalView {
  idTransversalView: number;
  idPlanModel: number;
  name: string;
  fullName?: string;
  classification: WorkpackModelClassificationEnum.TRANSVERSAL;
}

export interface ITransversalProgram extends ITransversalContext {
  idTransversalProgram: number;
  idWorkpack: number;
  idTransversalView: number;
  idWorkpackModel: number;
  name: string;
  fullName?: string;
  type: 'Program';
  classification: WorkpackModelClassificationEnum.TRANSVERSAL;
}

export interface ICreateTransversalProgram {
  idPlan: number;
  idWorkpackModel: number;
  name: string;
  fullName?: string;
  properties?: any[];
}

export interface IEligibleProject {
  idProject: number;
  idWorkpack: number;
  idPlan: number;
  idWorkpackModel: number;
  idStructuralModel: number;
  name: string;
  fullName?: string;
  originalParentId?: number;
  alreadyIncluded: boolean;
}

export interface ITransversalProjectParticipation {
  idTransversalProgram: number;
  idProject: number;
  included: boolean;
}
