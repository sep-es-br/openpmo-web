export interface IPreproject {
  id: number;
  name: string;
  fullName: string;
  expectedCompletionDate?: string | null;
  expectedDeliveries?: string | null;
  idOrganization: number;
  idPreProjectModel: number;
  status?: PreprojectStatus;
  approved?: boolean;
  idPlan?: number;
  idWorkpack?: number;
}

export interface IPreprojectListItem {
  id: number;
  name: string;
  fullName: string;
  idOrganization?: number;
  status?: PreprojectStatus;
  approved?: boolean;
  idPlan?: number;
  idWorkpack?: number;
}

export type PreprojectStatus = 'Estruturação' | 'Elaboração';

export interface IPreprojectEvaluationItem {
  idPropertyModel: number;
  name: string;
  label: string;
  note: number;
  weight: number;
  weightedNote: number;
  maximumNote: number;
}

export interface IPreprojectEvaluationCriterion {
  idCriteriaTabModel: number;
  name: string;
  label: string;
  weight: number;
  operation: 'AVERAGE' | 'SUM' | string;
  items: IPreprojectEvaluationItem[];
  groups: IPreprojectEvaluationGroup[];
  total: number;
  maximum: number;
}

export interface IPreprojectEvaluationGroup {
  idGroup: number;
  name: string;
  label: string;
  weight: number;
  operation: 'AVERAGE' | 'SUM' | string;
  active: boolean;
  disabledValue: number;
  items: IPreprojectEvaluationItem[];
  total: number;
  maximum: number;
}

export interface IPreprojectEvaluation {
  idPreProject: number;
  criteria: IPreprojectEvaluationCriterion[];
  operation: 'AVERAGE' | 'SUM' | string;
  finalNote: number;
}

export interface ICreatePreprojectRequest {
  name: string;
  fullName: string;
  idOffice: number;
  idOrganization: number;
  expectedCompletionDate?: string | null;
  expectedDeliveries?: string | null;
}

export type IUpdatePreprojectRequest = Omit<ICreatePreprojectRequest, 'idOffice'>;

export interface ICreateProjectFromPreprojectRequest {
  idPlan: number;
  idParent: number;
  observations: string;
}

export interface ICreatedProjectFromPreproject {
  id: number;
}

export interface IPreprojectListItemValue {
  id?: number;
  foreignKey?: string;
  label?: string;
}

export interface IPreprojectCriteriaValueBase {
  type: 'CriteriaList' | 'CriteriaSelection' | 'CriteriaGroup';
  id: number;
  idPropertyModel: number;
}

export interface IPreprojectCriteriaGroupValue extends IPreprojectCriteriaValueBase {
  type: 'CriteriaGroup';
  active: boolean;
}

export interface IPreprojectCriteriaListValue extends IPreprojectCriteriaValueBase {
  type: 'CriteriaList';
  items: IPreprojectListItemValue[];
}

export interface IPreprojectCriteriaSelectionValue extends IPreprojectCriteriaValueBase {
  type: 'CriteriaSelection';
  selectedOptionIds: number[];
}

export type IPreprojectCriteriaValue =
  | IPreprojectCriteriaListValue
  | IPreprojectCriteriaSelectionValue
  | IPreprojectCriteriaGroupValue;

export interface IPreprojectCriteriaTabValues {
  idCriteriaTab: number;
  idCriteriaTabModel: number;
  values: IPreprojectCriteriaValue[];
  groups: IPreprojectCriteriaGroupValue[];
}

export interface ISavePreprojectCriteriaTabValuesRequest {
  values: IPreprojectCriteriaValue[];
  groups: IPreprojectCriteriaGroupValue[];
}
