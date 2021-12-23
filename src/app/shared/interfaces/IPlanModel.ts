import { IOffice } from './IOffice';
export interface IPlanModel {
  id: number;
  idOffice?: number;
  name: string;
  fullName: string;
  sharedWithAll?: boolean;
  sharedWith?: IOffice[];
}
