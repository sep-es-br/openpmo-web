import { IWorkpackBreakdownStructureWorkpackModel } from './IWorkpackBreakdownStructure';

export interface IPlanBreakdownStructure {
  idPlan: number;
  planName: string;
  workpackModels: IWorkpackBreakdownStructureWorkpackModel[];
}
