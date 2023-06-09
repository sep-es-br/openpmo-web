import { IWorkpackModelProperty } from "./IWorkpackModelProperty";

export interface IReportModel {
  id?: number;
  idPlanModel: number;
  name: string;
  fullName?: string;
  active: boolean;
  preferredOutputFormat?: string;
  paramModels?: IWorkpackModelProperty[];
  files?: IReportModelFile[];
}

export interface IReportModelFile {
  id?: number;
  mimeType: string;
  userGivenName: string;
  uniqueNameKey?: string;
  main: boolean;
  compiled: boolean;

  url?: any; // only screen
}