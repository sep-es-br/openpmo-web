import { TypeWorkpackEnum } from '../enums/TypeWorkpackEnum';
import { TypeWorkpackModelEnum } from '../enums/TypeWorkpackModelEnum';
import { IWorkpackModel } from './IWorkpackModel';
import { IWorkpackModelProperty } from './IWorkpackModelProperty';
import { IWorkpackProperty } from './IWorkpackProperty';
import { IWorkpackShared } from './IWorkpackShared';

export interface IWorkpack {
    id?: number;
    model?: {
      type: string;
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
      riskAndIssueManagementSessionActive?: boolean;
      processesManagementSessionActive?: boolean;
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
    modelLinked?: {
      id: number;
      name: string;
      nameInPlural: string;
      children: {
        idWorkpackModelLinked: number;
        nameWorkpackModelLinked: string;
        nameInPluralWorkpackModelLinked: string;
        idWorkpackModelOriginal: number;
      }[];
    };
    linked?: boolean;
    linkedModel?: number;
    permissions?: IPermission[];
    sharedWith?: IWorkpackShared[];
    pendingBaseline?: boolean;
    cancelPropose?: boolean;
    hasActiveBaseline?: boolean;
    canceled?: boolean;
    cancelable?: boolean;
}

interface IPermission {
  id?: number;
  level: string;
  role?: string;
}
