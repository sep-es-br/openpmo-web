import { TypeWorkpackEnum } from '../enums/TypeWorkpackEnum';
import { TypeWorkpackModelEnum } from '../enums/TypeWorkpackModelEnum';
import { IWorkpackModel } from './IWorkpackModel';
import { IWorkpackModelProperty } from './IWorkpackModelProperty';
import { IWorkpackProperty } from './IWorkpackProperty';

export interface IWorkpack {
    id?: number;
    model?: {
      childWorkpackModelSessionActive?: boolean;
      children?: IWorkpackModel[];
      costSessionActive?: boolean;
      fontIcon: string;
      id: number;
      modelName: string;
      modelNameInPlural: string;
      organizationRoles?: string[];
      parent?: {
        fontIcon: string;
        id: number;
        modelName: string;
        type: TypeWorkpackModelEnum;
      };
      personRoles?: string[];
      planModel: {
        fullName: string;
        id: number;
        name: string;
      };
      properties: IWorkpackModelProperty[];
      stakeholderSessionActive?: boolean;
    };
    plan?: {
      fullName: string;
      id: number;
      name: string;
      idOffice?: number;
    };
    idParent?: number;
    idPlan?: number;
    type: TypeWorkpackEnum;
    idWorkpackModel?: number;
    properties: IWorkpackProperty[];
    permissions?: IPermission[];
}

interface IPermission {
  id?: number;
  level: string;
  role: string;
}
