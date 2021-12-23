import { IRiskResponse } from "./IRiskResponse";

export interface IRisk {
  id?: number;
  idWorkpack: number;
  name: string;
  description: string;
  importance: string; // HIGH | MEDIUM | LOW
  nature: string; // THREAT | OPPORTUNITY
  status: string; // OPEN | NOT_GONNA_HAPPEN | HAPPENED
  likelyToHappenFrom?: string; // data
  likelyToHappenTo?: string; // data
  happenedIn?: string; //data
  responsePlans?: IRiskResponse[];
}