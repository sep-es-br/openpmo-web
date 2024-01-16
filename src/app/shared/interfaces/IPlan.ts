import { IPlanModel } from "./IPlanModel";

export interface IPlan {
  id?: number;
  idOffice?: number;
  idPlanModel?: number;
  planModel?: IPlanModel;
  name: string;
  fullName: string;
  start: string;
  finish: string;
  permissions?: IPermission[];
}

interface IPermission {
  id?: number;
  level: string;
  role: string;
}
