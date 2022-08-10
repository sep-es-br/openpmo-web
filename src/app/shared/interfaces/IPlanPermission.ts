import { IPerson } from './IPerson';
export interface IPlanPermission {
  idPlan: number;
  permissions: IPermission[];
  key?: string;
  email?: string;
  person?: IPerson;
}

interface IPermission {
  id?: number;
  level: string;
  role: string;
}

