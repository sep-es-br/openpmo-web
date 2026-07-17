export interface IObligation {
    id?: number;

    idWorkpack?: number;

    managementUnitId?: number;

    managementUnitName?: string;

    year?: number;

    obligationNumber?: string;

    description?: string;

    supplierCnpj?: string;

    amount?: number;

    protocol?: string;
}

export interface IObligationCreate {
    idWorkpack: number;
    obligationNumber: string;
    description: string;
  }

  export interface IObligationUpdate
    extends IObligationCreate {
    id: number;
  }
