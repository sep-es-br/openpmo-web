export interface IPlanPermission {
  idPlan: number;
  permissions: IPermission[];
  email?: string;
  person?: {
    address: string;
    administrator: boolean;
    contactEmail: string;
    email: string;
    fullName: string;
    id: number;
    name: string;
  };
}

interface IPermission {
  id?: number;
  level: string;
  role: string;
}

