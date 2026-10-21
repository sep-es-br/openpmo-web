import { IOrganization } from './IOrganization';
import { IPerson } from './IPerson';

export interface IStakeholder {
  idWorkpack?: number;
  person?: IPerson;
  idOrganization?: number;
  organization?: IOrganization;
  roles?: IStakeholderRole[];
  permissions?: IStakeholderPermission[];
}

export interface IStakeholderRole {
  id?: number;
  active: boolean;
  role: string;
  from: string | Date;
  to: string | Date;
  new?: boolean;
}

export interface IStakeholderPermission {
  id?: number;
  role: string;
  level: string;
  inheritedFrom?: string;
  idPlan?: number;
}
