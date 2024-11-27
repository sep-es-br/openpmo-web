import { IBudgetPlan } from './IBudgetPlan';
import { IBudgetUnit } from './IBudgetUnit';
import { IWorkpackModelProperty } from './IWorkpackModelProperty';
import { IWorkpackProperty } from './IWorkpackProperty';

export interface ICostAccount {
  id?: number;
  idCostAccountModel?: number;
  idWorkpack?: number;
  workpackModelFullName?: string;
  workpackModelName?: string;
  properties: IWorkpackProperty[];
  models?: IWorkpackModelProperty[];
  costAccountAllocation?: {
    actual: number;
    limit: number;
    planed: number;
  }
  unidadeOrcamentaria: IBudgetUnit;
  planoOrcamentario: IBudgetPlan; 
}

export interface ICostByWorkpack {
  idWorkpack: number;
  actual: number;
  planed: number;
}
