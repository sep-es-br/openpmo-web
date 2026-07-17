export interface IAgreements {
  id?: number;
  idWorkpack?: number;

  type?: 'CONTRACT' | 'COOPERATION';

  organizationId?: number;
  organizationName?: string;

  managementUnitId?: number;
  managementUnitName?: string;

  year?: number;

  processId?: number;
  processNumber?: string;
  object?: string;

  supplierCnpj?: string;
  supplierName?: string;

  grantorCnpj?: string;
  grantorName?: string;

  protocol?: string;
}

export interface IAgreementCreate {
  idWorkpack: number;
  type: 'CONTRACT' | 'COOPERATION';
  processNumber: string;
  object: string;
}

export interface IAgreementUpdate extends IAgreementCreate {
  id: number;
}
