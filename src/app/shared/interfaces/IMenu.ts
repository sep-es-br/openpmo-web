import { MenuItem } from 'primeng/api';

export enum MenuButtons {
  OFFICE = 'office',
  PORTFOLIO = 'portfolio',
  FAVORITES = 'favorites',
  CCB = 'ccb',
  REPORTS = 'reports',
  UNIVERSAL_SEARCH = 'universal-search',
  PLAN_MODEL = 'plan-model',
  USER = 'user',
  MORE = 'more',
}

export enum MenuAdminButtons {
  ORGANIZATIONS = 'organizations',
  DOMAINS = 'domains',
  MEASURE_UNITS = 'measure-units',
  OFFICES_PERMISSION = 'offices/permission',
  PERSONS = 'persons',
}

export interface IMenu {
  label: MenuButtons;
  isOpen: boolean;
}

export interface IMenuAdmin {
  label: MenuAdminButtons;
  isOpen: boolean;
}

export interface IMenuOffice {
  id: number;
  name: string;
  fullName: string;
  plans: IMenuPlan[];
}

export interface IMenuPlan {
  id: string;
  name: string;
  fullName?: string;
}

export interface IMenuWorkpackModel {
  id: string;
  idPlanModel?: number;
  modelName?: string;
  name?: string;
  nameInPlural?: string;
  fullName?: string;
  type?: string;
  fontIcon: string;
  children: IMenuWorkpackModel[];
}

export interface IMenuWorkpack {
  id: string;
  idWorkpackModelLinked?: string;
  fullName?: string;
  name: string;
  idPlan?: number;
  idParent?: number;
  fontIcon: string;
  children: IMenuWorkpack[];
  expanded?: boolean;
}

export interface PlanMenuItem extends MenuItem {
  idPlan?: number;
  fullName?: string;
}

export interface IMenuPlanModel {
  id: number;
  name: string;
  fullName: string;
  workpackModels: IMenuWorkpackModel[];
}

export interface IMenuFavorites {
  id: number;
  label: string;
  icon: string;
  title?: string;
  routerLink?: {
    path: string;
    queryParams?: any;
  };
  canAccess: boolean;
  idPlan?: number;
  styleClass?: string;
}
