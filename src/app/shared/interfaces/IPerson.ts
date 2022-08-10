import {IFile} from './IFile';

export interface IPerson {
  id?: number;
  name: string;
  fullName?: string;
  email?: string;
  key?: string;
  guid?: string;
  contactEmail?: string;
  phoneNumber?: string;
  address?: string;
  cpf?: string;
  isUser?: boolean;
  officePermission?: IPersonOfficePermission;
  roles?: { role: string; workLocation?: string }[];
  administrator?: boolean;
  avatar?: IFile;
  isCcbMember?: boolean;
}

export interface IPersonOfficePermission {
  id: number;
  accessLevel: string;
  planPermissions: IPersonPlanPermission[];
}

export interface IPersonPlanPermission {
  id: number;
  name: string;
  accessLevel: string;
  workpacksPermission: IPersonWorkpackPermission[];
}

export interface IPersonWorkpackPermission {
  id: number;
  name: string;
  accessLevel: string;
  roles: string[];
  icon: string;
  ccbMember?: boolean;
}
