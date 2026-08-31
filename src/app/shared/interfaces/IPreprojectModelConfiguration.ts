import { PreprojectEvaluationOperation } from '../services/preproject-evaluation-config.service';

export interface IPreprojectModelConfiguration {
  id: number;
  active: boolean;
  operation: PreprojectEvaluationOperation;
  properties?: unknown[];
}

export interface IUpdatePreprojectModelConfiguration {
  active: boolean;
  operation: PreprojectEvaluationOperation;
}
