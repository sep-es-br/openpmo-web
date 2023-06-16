import { IWorkpackProperty } from "./IWorkpackProperty";

export interface IReportGenerate {
  idReportModel: number;
  idPlan: number;
  params?: IWorkpackProperty[];
  scope: number[];
  format: string;
}