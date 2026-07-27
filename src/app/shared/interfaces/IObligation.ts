export interface IObligation {
    id?: number;

    idWorkpack?: number;

    managementUnitId?: number;

    managementUnitName?: string;

    managementUnitCode?: string;

    year?: number;

    processId?: string;

    processNumber?: string;

    obligationNumber?: string;

    description?: string;

    supplierCnpj?: string;

    amount?: string;

    protocol?: string;
}

export interface IObligationCreate {
    idWorkpack: number;
    obligationNumber: string;
    description: string;
    managementUnitCode: string;
  }
export interface IObligationManagementUnit { code: string; name: string; }

  export interface IObligationUpdate
    extends IObligationCreate {
    id: number;
  }
