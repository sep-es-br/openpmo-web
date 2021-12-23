import { IStakeholder } from './IStakeholder';
export interface IRiskResponse {
  id?: number;
  idRisk: number;
  name: string;
  when: string; //PRE_OCURRENCE | POST_OCCURRENCE
  startDate?: string; // data
  endDate?: string; // data
  strategy: string; // AVOIDANCE_ELIMINATION | TRANSFER | MITIGATION | ACCEPTANCE  (OPTIONS TO NEGATIVE RISK); EXPLOIT | ENHANCE | SHARE | ACCEPT (OPTIONS TO POSITIVE RISK);
  status: string; // WAITING_TRIGGER | RUNNING | DONE | CANCELLED
  trigger?: string;
  plan: string;
  responsible?: {id: number; name: string}[];
}