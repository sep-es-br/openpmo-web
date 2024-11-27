export interface ISummaryJson {
    year: number;
    steps: Step[];
  }
  
export interface Step {
    stepMonth: number;
    consumes: Consume[];
    liquidatedValue?: number;
  }
  
export interface Consume {
    costAccount: CostAccount;
  }
  
export interface CostAccount {
    codPo: number;
  }
  