import { IWorkpackProperty } from "./IWorkpackProperty";

export interface IReportGenerate {
  idReportModel: number;
  params?: IWorkpackProperty[];
  scope: number[];
  format: string;
}