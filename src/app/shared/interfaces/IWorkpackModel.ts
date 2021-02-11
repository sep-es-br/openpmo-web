import { TypeWorkpackModelEnum } from '../enums/TypeWorkpackModelEnum';
import { IWorkpackModelProperty } from './IWorkpackModelProperty';

export interface IWorkpackModel {
  id?: number;
  idParent?: number;
  idPlanModel?: number;
  type: TypeWorkpackModelEnum;
  modelName: string;
  modelNameInPlural?: string;
  fontIcon: string;
  childWorkpackModelSessionActive?: boolean;
  children?: IWorkpackModel[];
  costSessionActive?: boolean;
  organizationRoles?: string[];
  personRoles?: string[];
  planModel?: {
    id: number;
    name: string;
    fullname: string;
  };
  stakeholderSessionActive?: boolean;
  scheduleSessionActive?: boolean;
  properties?: IWorkpackModelProperty[];
  sortBy: IWorkpackModelProperty;
}
