import { Injectable } from '@angular/core';

export type PreprojectCriterionOperation = 'AVERAGE' | 'SUM';

export interface PreprojectCriterionGroup {
  title: string;
  sortIndex: number;
  weight: number;
  operation: PreprojectCriterionOperation;
  enablementKey: boolean;
  disabledValue: string;
  legend: string;
  properties: string[];
}

export interface PreprojectCriterion {
  id: number;
  name: string;
  position: number;
  icon: string;
  weight: number;
  operation: PreprojectCriterionOperation;
  properties?: string[];
  groups?: PreprojectCriterionGroup[];
}

@Injectable({ providedIn: 'root' })
export class PreprojectCriteriaConfigService {

  private readonly storageKeyPrefix = 'openpmo.preproject.criteria';

  getCriteria(idOffice: number): PreprojectCriterion[] {
    const storedCriteria = localStorage.getItem(this.getStorageKey(idOffice));

    if (!storedCriteria) {
      return [this.getDefaultCriterion()];
    }

    try {
      return JSON.parse(storedCriteria) as PreprojectCriterion[];
    } catch {
      return [this.getDefaultCriterion()];
    }
  }

  addCriterion(idOffice: number, criterion: Omit<PreprojectCriterion, 'id'>): PreprojectCriterion {
    const criteria = this.getCriteria(idOffice);
    const createdCriterion: PreprojectCriterion = {
      ...criterion,
      id: criteria.reduce((highestId, item) => Math.max(highestId, item.id), 0) + 1
    };

    localStorage.setItem(this.getStorageKey(idOffice), JSON.stringify([...criteria, createdCriterion]));
    return createdCriterion;
  }

  deleteCriterion(idOffice: number, criterionId: number): void {
    const criteria = this.getCriteria(idOffice).filter(criterion => criterion.id !== criterionId);
    localStorage.setItem(this.getStorageKey(idOffice), JSON.stringify(criteria));
  }

  private getStorageKey(idOffice: number): string {
    return `${this.storageKeyPrefix}.${idOffice}`;
  }

  private getDefaultCriterion(): PreprojectCriterion {
    return {
      id: 3,
      name: 'Inglês',
      position: 1,
      icon: 'fas fa-cog',
      weight: 1,
      operation: 'SUM',
      properties: [],
      groups: []
    };
  }
}
