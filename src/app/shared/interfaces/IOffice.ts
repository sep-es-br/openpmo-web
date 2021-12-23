export interface IOffice {
    id: number;
    name: string;
    fullName?: string;
    permissions?: IPermission[];
}

interface IPermission {
    id?: number;
    level: string;
    role: string;
  }
