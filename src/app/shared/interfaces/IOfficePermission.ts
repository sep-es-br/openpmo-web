import { IPerson } from 'src/app/shared/interfaces/IPerson';
export interface IOfficePermission {
  idOffice: number;
  permissions: IPermission[];
  email?: string;
  person?: IPerson;
  key?: string;
  identityValidation?: IPublicIdentityValidation;
}

export interface IPublicIdentityValidation {
  searchType: 'CPF' | 'PUBLIC_AGENT';
  cpf?: string;
  sub: string;
}

interface IPermission {
  id?: number;
  level: string;
  role: string;
  ccmMember?: boolean;
}
