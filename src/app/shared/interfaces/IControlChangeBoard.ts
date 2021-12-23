import { IPerson } from './IPerson';

export interface IControlChangeBoard {
  idWorkpack?: number;
  idOffice?: number;
  person: IPerson;
  memberAs?: IMemberAs[];
  organization: string;
  active: boolean;
}

export interface IMemberAs {
  role: string;
  workLocation: string;
  active: boolean;
};
