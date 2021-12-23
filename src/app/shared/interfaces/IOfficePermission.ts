import { IPerson } from 'src/app/shared/interfaces/IPerson';
export interface IOfficePermission {
  idOffice: number;
  permissions: IPermission[];
  email?: string;
  person?: IPerson
}

interface IPermission {
  id?: number;
  level: string;
  role: string;
}
