import { Injectable } from '@angular/core';
import {
  CriteriaGroupModel,
  CriteriaOperation,
  CriteriaTabModel
} from '../interfaces/IPreprojectCriteriaModel';

export type PreprojectCriterionOperation = CriteriaOperation;
export type PreprojectCriterionGroup = CriteriaGroupModel;
export type PreprojectCriterion = CriteriaTabModel;

@Injectable({ providedIn: 'root' })
export class PreprojectCriteriaConfigService {

  private readonly storageKeyPrefix = 'openpmo.preproject.criteria';

  getCriteria(idOffice: number): PreprojectCriterion[] {
    const storedCriteria = localStorage.getItem(this.getStorageKey(idOffice));

    if (!storedCriteria) {
      return [this.getDefaultCriterion()];
    }

    try {
      return this.normalizeCriteria(JSON.parse(storedCriteria) as Partial<PreprojectCriterion>[]);
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

  getCriterion(idOffice: number, criterionId: number): PreprojectCriterion | undefined {
    return this.getCriteria(idOffice).find(criterion => criterion.id === criterionId);
  }

  updateCriterion(
    idOffice: number,
    criterionId: number,
    criterion: Omit<PreprojectCriterion, 'id'>
  ): PreprojectCriterion {
    const updatedCriterion: PreprojectCriterion = {
      ...criterion,
      propertyModelType: 'CriteriaTabModel',
      id: criterionId
    };
    const criteria = this.getCriteria(idOffice)
      .map(item => item.id === criterionId ? updatedCriterion : item);

    localStorage.setItem(this.getStorageKey(idOffice), JSON.stringify(criteria));
    return updatedCriterion;
  }

  private normalizeCriteria(criteria: Partial<PreprojectCriterion>[]): PreprojectCriterion[] {
    return (criteria || []).map((criterion: Partial<PreprojectCriterion>, index: number) => ({
      propertyModelType: 'CriteriaTabModel',
      id: criterion.id || index + 1,
      name: criterion.name || '',
      active: criterion.active !== false,
      position: criterion.position || index + 1,
      icon: criterion.icon || 'fas fa-cog',
      weight: criterion.weight || 1,
      operation: criterion.operation || 'SUM',
      properties: criterion.properties || [],
      groups: (criterion.groups || []).map((group: CriteriaGroupModel) => ({
        ...group,
        propertyModelType: 'CriteriaGroupModel',
        properties: group.properties || []
      }))
    }));
  }

  private getDefaultCriterion(): PreprojectCriterion {
    return {
      propertyModelType: 'CriteriaTabModel',
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
