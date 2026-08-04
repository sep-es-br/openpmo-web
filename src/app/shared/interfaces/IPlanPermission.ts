import { IPerson } from './IPerson';
export interface IPlanPermission {
  idPlan: number;
  permissions: IPermission[];
  key?: string;
  email?: string;
  person?: IPerson;
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

