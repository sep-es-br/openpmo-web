import { IStakeholder } from './IStakeholder';

export interface IIssueResponse {
  id?: number;
  idIssue: number;
  name: string;
  plan: string;
  date: string;
  status: string; // WAITING | RUNNING | DONE | CANCELLED
  responsible: {id: number; name: string}[];
}