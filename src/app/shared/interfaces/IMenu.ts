import { MenuItem } from 'primeng/api';

export interface IMenu {
  label: string;
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
  idPlan?: number;
  fontIcon: string;
  children: IMenuWorkpack[];
}

export interface PlanMenuItem extends MenuItem {
  idPlan?: number;
}
