export interface ISchedule {
  id?: number;
  idWorkpack: number;
  plannedWork: number;
  actualWork: number;
  start: Date;
  end: Date;
  distribution: string;
  costs: ICost[];
}

export interface ICost {
  id?: number;
  actualCost: number;
  plannedCost: number;
}

export interface IScheduleDetail {
  id: number;
  idWorkpack?: number;
  start: Date;
  end: Date;
  baselineStart?: Date;
  baselineEnd?: Date;
  actual: number;
  actualCost: number;
  planed: number;
  baselinePlaned?: number;
  planedCost: number;
  baselineCost?: number;
  groupStep: IGroupStep[];
}

export interface IGroupStep {
  year: number;
  steps: IStep[];
  actual?: number;
  actualCost?: number;
  planed?: number;
  planedCost?: number;
}

export interface IStep {
  id?: number;
  idSchedule?: number;
  scheduleStart?: Date;
  scheduleEnd?: Date;
  plannedWork: number;
  baselinePlannedWork?: number;
  baselinePlannedCost?: number;
  actualWork: number;
  periodFromStart?: Date;
  consumes?: IConsume[];
  liquidatedValue?: number;
}

export interface IConsume {
  id: number;
  actualCost: number;
  plannedCost: number;
  baselinePlannedCost?: number;
  costAccount: {
    id: number;
    name?: string;
    codUo?: number;
    unidadeOrcamentaria?: string;
    codPo?: number;
    planoOrcamentario?: string;
  };
}

export interface IStepPost {
  id?: number;
  idSchedule?: number;
  distribution?: string;
  scheduleStart?: string;
  scheduleEnd?: string;
  plannedWork: number;
  actualWork: number;
  endStep?: boolean;
  periodFromStart?: Date;
  showReplicateButton?: boolean;
  consumes: {
    actualCost: number;
    plannedCost: number;
    idCostAccount: number;
    nameCostAccount?: string;
    id: number;
  }[];

  group?: number; // only screen
}

