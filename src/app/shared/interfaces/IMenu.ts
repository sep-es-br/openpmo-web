export interface IMenuOffice {
  id: number;
  fullName: string;
  planModels: IMenuPlan[];
}

export interface IMenuPlan {
  id: string;
  name: string;
  models: IMenuWorkpackModel[];
}

export interface IMenuWorkpackModel {
  id: string;
  modelName: string;
  fontIcon: string;
  children: IMenuWorkpackModel[];
}

export interface IMenuWorkpack {
  id: string;
  name: string;
  fontIcon: string;
  children: IMenuWorkpack[];
}
