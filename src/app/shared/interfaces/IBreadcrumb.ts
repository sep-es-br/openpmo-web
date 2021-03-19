export interface IBreadcrumb {
  key: string;
  info?: string;
  tooltip?: string;
  routerLink: string[];
  queryParams?: any;
  modelName?: string;
}

export interface IResultBreadcrumb {
  id: number;
  name: string;
  fullName: string;
  type: string;
  modelName?: string;
}
