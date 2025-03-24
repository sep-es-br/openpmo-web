import { IOffice } from './IOffice';
import { IPlan } from './IPlan';
import { IWorkpackModel } from './IWorkpackModel';
import { IWorkpack } from 'src/app/shared/interfaces/IWorkpack';

export interface IWorkpackData {
  workpack: IWorkpack;
  workpackModel: IWorkpackModel;
}

export interface  IWorkpackParams {
  idWorkpack: number;
  idPlan: number;
  idWorkpackModel: number;
  idWorkpackParent: number;
  idWorkpackModelLinked?: number;
  idWorkpackLinkedParent?: number;
  idOfficeOwnerWorkpackLinked?: number;
  idOffice?: number;
  changedStatusCompleted: boolean;
  propertiesPlan?: IPlan;
  propertiesOffice?: IOffice;
}
