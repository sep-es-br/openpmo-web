import { IOffice } from './IOffice';
export interface IDomain {
  id: number;
  name: string;
  fullName: string;
  office?: IOffice;
}
