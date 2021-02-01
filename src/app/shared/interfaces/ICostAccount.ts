import { IWorkpackModelProperty } from './IWorkpackModelProperty';
import { IWorkpackProperty } from './IWorkpackProperty';

export interface ICostAccount {
  id?: number;
  idWorkpack?: number;
  properties: IWorkpackProperty[];
  models?: IWorkpackModelProperty[];
}

export interface ICostByWorkpack {
  idWorkpack: number;
  atual: number;
  planed: number;
}
