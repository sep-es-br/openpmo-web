import { IWorkpackModelProperty } from "./IWorkpackModelProperty";

export interface ICostAccountModel {
  id?: number;
  idPlanModel?: number;
  properties?: IWorkpackModelProperty[];
}