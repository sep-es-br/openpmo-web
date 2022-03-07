export interface ISchedule {
  id?: number;
  idWorkpack: number;
  plannedWork: number;
  actualWork: number;
  start: Date;
  end: Date;
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
}

export interface IStep {
  id?: number;
  idSchedule?: number;
  plannedWork: number;
  baselinePlannedWork?: number;
  actualWork: number;
  periodFromStart?: Date;
  consumes?: IConsume[];
}

export interface IConsume {
  id: number;
  actualCost: number;
  plannedCost: number;
  baselinePlannedCost?: number;
  costAccount: {
    id: number;
  };
}

export interface IStepPost {
  id?: number;
  idSchedule?: number;
  plannedWork: number;
  actualWork: number;
  endStep?: boolean;
  periodFromStart?: Date;
  consumes: {
    actualCost: number;
    plannedCost: number;
    idCostAccount: number;
    id: number;
  }[];
}

