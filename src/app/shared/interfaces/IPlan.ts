export interface IPlan {
  id?: number;
  idOffice?: number;
  idPlanModel?: number;
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
