import { Injectable } from '@angular/core';
import {
  CriteriaGroupModel,
  CriteriaOperation,
  CriteriaTabModel
} from '../interfaces/IPreprojectCriteriaModel';
import { PreprojectModelService } from './preproject-model.service';

export type PreprojectCriterionOperation = CriteriaOperation;
export type PreprojectCriterionGroup = CriteriaGroupModel;
export type PreprojectCriterion = CriteriaTabModel;

@Injectable({ providedIn: 'root' })
export class PreprojectCriteriaConfigService {

  constructor(private readonly preprojectModelService: PreprojectModelService) {}

  async getCriteria(idOffice: number): Promise<PreprojectCriterion[]> {
    const response = await this.preprojectModelService.findOrCreateByOfficeId(idOffice);
    if (response.success && response.data && response.data.properties) {
      const criteriaSummaries = (response.data.properties as any[])
        .filter(property => property.type === 'CriteriaTabModel');
      const criteriaDetails = await Promise.all(criteriaSummaries.map(async summary => {
        if (!summary.id) {
          return summary;
        }
        const detailResponse = await this.preprojectModelService.findCriteriaTabById(summary.id, idOffice);
        return detailResponse.success && detailResponse.data ? detailResponse.data : summary;
      }));
      return this.normalizeCriteria(criteriaDetails);
    }
    return [];
  }

  async addCriterion(idOffice: number, criterion: Omit<PreprojectCriterion, 'id'>): Promise<PreprojectCriterion> {
    const modelResponse = await this.preprojectModelService.findOrCreateByOfficeId(idOffice);
    if (modelResponse.success && modelResponse.data) {
      const idModel = modelResponse.data.id;
      const requestPayload = this.toBackendCriterion(criterion);
      const response = await this.preprojectModelService.createCriteriaTab(idModel, requestPayload);
      if (response.success && response.data) {
        return this.normalizeCriteria([response.data as any])[0];
      }
    }
    throw new Error('Failed to create criterion');
  }

  async deleteCriterion(idOffice: number, criterionId: number): Promise<void> {
    await this.preprojectModelService.deleteCriteriaTab(criterionId);
  }

  async getCriterion(idOffice: number, criterionId: number): Promise<PreprojectCriterion | undefined> {
    const response = await this.preprojectModelService.findCriteriaTabById(criterionId, idOffice);
    if (response.success && response.data) {
      return this.normalizeCriteria([response.data as any])[0];
    }
    return undefined;
  }

  async updateCriterion(
    idOffice: number,
    criterionId: number,
    criterion: Omit<PreprojectCriterion, 'id'>
  ): Promise<PreprojectCriterion> {
    const requestPayload = this.toBackendCriterion({ ...criterion, id: criterionId } as PreprojectCriterion);
    const response = await this.preprojectModelService.updateCriteriaTab(criterionId, requestPayload);
    if (response.success && response.data) {
      return this.normalizeCriteria([response.data as any])[0];
    }
    throw new Error('Failed to update criterion');
  }

  private toBackendCriterion(criterion: Partial<PreprojectCriterion>): any {
    const mapTypeToBackend = (type: string): string => {
      if (type === 'ChallengeListModel' || type === 'SdgListModel') return 'ListModel';
      return type;
    };

    const properties = (criterion.properties || []).map((p: any) => ({
      ...p,
      type: mapTypeToBackend(p.type),
      sortIndex: p.sortIndex || p.position || 1,
      label: p.label || p.name
    }));
    const groups = (criterion.groups || []).map((g: any) => ({
      ...g,
      type: 'CriteriaGroupModel',
      name: g.title || g.name,
      label: g.title || g.name || g.label,
      sortIndex: g.sortIndex || g.position || 1,
      groupedProperties: (g.properties || []).map((p: any) => ({
        ...p,
        type: mapTypeToBackend(p.type),
        sortIndex: p.sortIndex || p.position || 1,
        label: p.label || p.name
      }))
    }));
    return {
      ...criterion,
      type: 'CriteriaTabModel',
      active: true,
      name: criterion.name,
      label: criterion.name,
      sortIndex: criterion.position || 1,
      organizedProperties: [...properties, ...groups]
    };
  }

  private mapTypeToFrontend(p: any): string {
    if (p.type === 'ListModel') {
      const name = (p.name || '').toLowerCase();
      if (name.includes('desafio') || name.includes('challenge')) return 'ChallengeListModel';
      if (name.includes('ods') || name.includes('sustentável') || name.includes('desenvolvimento')) return 'SdgListModel';
    }
    return p.type;
  }

  private normalizeCriteria(criteria: any[]): PreprojectCriterion[] {
    return (criteria || []).map((criterion: any, index: number) => {
      const sortByIndex = (first: any, second: any): number =>
        (first.sortIndex || 0) - (second.sortIndex || 0);
      const organizedProperties = [...(criterion.organizedProperties || [])]
        .sort(sortByIndex);
      const groups = organizedProperties.filter((p: any) => p.type === 'CriteriaGroupModel');
      const properties = organizedProperties.filter((p: any) => p.type !== 'CriteriaGroupModel').map((p: any) => ({
        ...p,
        type: this.mapTypeToFrontend(p)
      }));

      return {
        propertyModelType: 'CriteriaTabModel',
        id: criterion.id || index + 1,
        name: criterion.name || '',
        active: true,
        position: criterion.sortIndex || criterion.position || index + 1,
        icon: criterion.icon || 'fas fa-cog',
        weight: criterion.weight || 1,
        operation: criterion.operation || 'SUM',
        properties: properties,
        groups: groups.map((group: any) => ({
          ...group,
          propertyModelType: 'CriteriaGroupModel',
          title: group.name || group.label || group.title,
          properties: [...(group.groupedProperties || [])]
            .sort(sortByIndex)
            .map((p: any) => ({
              ...p,
              type: this.mapTypeToFrontend(p)
            }))
        }))
      };
    });
  }
}
