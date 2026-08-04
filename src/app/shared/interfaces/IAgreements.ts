export type AgreementType = 'CONTRACT' | 'COOPERATION';

export interface IAgreementOrganization {
  identifier: string;
  name: string;
}

export interface IAgreements {
  id?: number;
  idWorkpack?: number;

  type?: AgreementType;

  organizationName?: string;


  year?: number;

  processId?: number;
  object?: string;

  partyCnpj?: string;
  partyName?: string;

  protocol?: string;
}

export interface IAgreementCreate {
  idWorkpack: number;
  type: AgreementType;
  processId: number;
  object: string;
  organizationIdentifier: string;
}

export interface IAgreementUpdate extends IAgreementCreate {
  id: number;
}
