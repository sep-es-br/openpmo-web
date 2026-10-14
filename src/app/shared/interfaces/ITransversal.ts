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
  idParent?: number;
  name: string;
  fullName?: string;
  type: 'Program';
  classification: WorkpackModelClassificationEnum.TRANSVERSAL;
  fontIcon?: string;
}

export interface ITransversalProgramModel {
  id: number;
  idParentModel?: number;
  name: string;
  nameInPlural?: string;
}

export interface ICreateTransversalProgram {
  idPlan: number;
  idWorkpackModel: number;
  name: string;
  fullName?: string;
  properties?: any[];
}

export interface ITransversalProjectParticipation {
  idTransversalProgram: number;
  idProject: number;
  included: boolean;
}

export interface ITransversalLinkedModel {
  idWorkpackModel: number;
  type: string;
  modelName: string;
  modelNameInPlural: string;
  fontIcon?: string;
  currentlyConfigured: boolean;
}

export interface ITransversalWorkpack {
  idWorkpack: number;
  idPlan: number;
  idWorkpackModel: number;
  originalParentId?: number;
  name: string;
  fullName?: string;
  canceled: boolean;
  alreadyIncluded: boolean;
  currentlyEligible: boolean;
  coveredByIncludedAncestor: boolean;
}

export interface ITransversalWorkpackParticipation {
  idTransversalProgram: number;
  idWorkpack: number;
  included: boolean;
}

export interface ITransversalStructuralLink {
  idTransversalProgram: number;
  idWorkpack: number;
  idWorkpackModel: number;
  idParentWorkpack?: number;
  idRootWorkpackModel: number;
  rootModelName: string;
  name: string;
  fullName?: string;
  modelName: string;
  modelNameInPlural?: string;
  workpackModelType?: string;
  fontIcon?: string;
  directlyLinked: boolean;
  clickable: boolean;
  scopeCounts?: ITransversalProjectScopeCount[];
}

export interface ITransversalProjectScopeCount {
  idWorkpackModel: number;
  modelNameInPlural: string;
  fontIcon?: string;
  linkedCount: number;
  totalCount: number;
}

export interface ITransversalSelectionOption {
  id: number;
  parentId?: number;
  name: string;
  fullName?: string;
  idPlan: number;
  displayName?: string;
}
