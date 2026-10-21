import { Injectable } from '@angular/core';

export type PreprojectEvaluationOperation = 'AVERAGE' | 'SUM';

@Injectable({
  providedIn: 'root'
})
export class PreprojectEvaluationConfigService {

  private readonly storageKey = '@pmo/preproject-evaluation-operation';
  private readonly defaultOperation: PreprojectEvaluationOperation = 'AVERAGE';

  getOperation(idOffice: number): PreprojectEvaluationOperation {
    if (!Number.isFinite(idOffice) || idOffice <= 0) {
      return this.defaultOperation;
    }

    const operation = localStorage.getItem(this.getStorageKey(idOffice));
    return operation === 'SUM' || operation === 'AVERAGE'
      ? operation
      : this.defaultOperation;
  }

  saveOperation(idOffice: number, operation: PreprojectEvaluationOperation): void {
    if (!Number.isFinite(idOffice) || idOffice <= 0) {
      return;
    }

    localStorage.setItem(this.getStorageKey(idOffice), operation);
  }

  calculate(values: number[], operation: PreprojectEvaluationOperation): number {
    const sum = values.reduce((total, value) => total + value, 0);
    return operation === 'AVERAGE' && values.length > 0 ? sum / values.length : sum;
  }

  private getStorageKey(idOffice: number): string {
    return `${this.storageKey}/${idOffice}`;
  }
}
