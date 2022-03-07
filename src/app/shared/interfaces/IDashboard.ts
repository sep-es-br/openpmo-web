export interface IDashboard {
  earnedValueAnalysis: IEarnedValueAnalysisDashboard,
  milestone?: IMilestoneDashboard,
  risk?: IRiskDashboard,
  stakeholders?: IStakeholderDashboard[],
  tripleConstraint: ITripleConstraintDashboard[];
  childrensByType?: {
    quantity: number;
    type: string;
  }[];
}

export interface IEarnedValueAnalysisDashboard {
  performanceIndexes: {
    actualCost: number,
    costPerformanceIndex: {
      costVariation: number,
      indexValue: number
    },
    earnedValue: number,
    estimateToComplete: number,
    estimatesAtCompletion: number,
    plannedValue: number,
    schedulePerformanceIndex: {
      indexValue: number,
      scheduleVariation: number
    }
  }[],
  earnedValueByStep:
  {
    actualCost: number,
    plannedValue: number,
    earnedValue: number,
    date: string;
  }[]
}

export interface IMilestoneDashboard {
  concluded: number,
  late: number,
  lateConcluded: number,
  onTime: number,
  quantity: number
}

export interface IRiskDashboard {
  closed: number,
  high: number,
  low: number,
  medium: number,
  total: number
}

export interface IStakeholderDashboard {
  actor: {
    avatar?: {
      id: number,
      mimeType: string,
      name: string,
      url: string
    },
    fullName: string,
    id: number,
    name: string,
    organization?: boolean;
  },
  role: string
}

export interface ITripleConstraintDashboard {
  idBaseline?: number;
  mesAno?: string;
  cost: {
    actualValue: number,
    foreseenValue: number,
    plannedValue: number,
    variation: number
  },
  schedule: {
    actualEndDate: string,
    actualStartDate: string,
    actualValue: number,
    foreseenEndDate: string,
    foreseenStartDate: string,
    foreseenValue: number,
    plannedEndDate: string,
    plannedStartDate: string,
    plannedValue: number,
    variation: number
  },
  scope: {
    actualVariationPercent: number,
    foreseenVariationPercent: number,
    plannedVariationPercent: number,
    foreseenValue?: number;
    actualValue?: number;
    variation: number
  }
}
