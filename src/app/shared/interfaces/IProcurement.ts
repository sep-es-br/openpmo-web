export interface IProcurement {
  id?: number;

  idWorkpack?: number;

  organizationId?: number;

  organizationName?: string;

  year?: number;

  processId?: number;

  processNumber?: string;

  object?: string;

  modality?: string;

  status?: string;

  protocol?: string;
}

export interface IProcurementCreate {
  idWorkpack: number;
  processId: number;
  object: string;
}
export interface IProcurementOrganization { identifier: string; name: string; }

export interface IProcurementUpdate
  extends IProcurementCreate {
  id: number;
}
