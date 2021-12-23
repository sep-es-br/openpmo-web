import { IPerson } from './IPerson';
export interface IPlanPermission {
  idPlan: number;
  permissions: IPermission[];
  email?: string;
  person?: IPerson;
}

interface IPermission {
  id?: number;
  level: string;
  role: string;
}

