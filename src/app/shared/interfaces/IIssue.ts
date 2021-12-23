import { IIssueResponse } from './IIssueResponse';
import { IRisk } from './IRisk';

export interface IIssue {
  id?: number;
  idWorkpack?: number;
  name: string;
  triggeredBy?: IRisk;
  description: string;
  importance: string;
  status: string;
  nature: string;
  responses?: IIssueResponse[]
}