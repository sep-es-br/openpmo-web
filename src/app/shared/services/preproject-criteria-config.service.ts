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
      if (type === 'ChallengeListModel' || type === 'SdgListModel') return 'CriteriaListModel';
      return type;
    };
    const getDefaultValues = (property: any): any[] => Array.isArray(property.defaultValue)
      ? property.defaultValue
      : property.defaultValue !== undefined && property.defaultValue !== null && property.defaultValue !== ''
        ? [property.defaultValue]
        : [];

    const toBackendProperty = (p: any): any => {
      const {
        requiredFields, list, extraList, extraListDefaults, selectedLocalities,
        showIconButtonSelectLocality, isCollapsed, viewOnly, obligatory,
        disableMultipleSelection, sectorsList, possibleValuesOptions,
        possibleValuesDetails, propertyModelType, ...property
      } = p;
      const backendType: string = mapTypeToBackend(p.type);
      return {
        ...property,
        type: backendType,
        sortIndex: p.sortIndex || p.position || 1,
        label: p.label || p.name,
        ...(p.type === 'SelectionModel' ? {
          possibleValues: (possibleValuesOptions || []).join(','),
          defaultValue: Array.isArray(p.defaultValue) ? p.defaultValue.join(',') : p.defaultValue,
          multipleSelection: !!p.multipleSelection
        } : {}),
        ...(p.type === 'CriteriaSelectionModel' ? {
          weight: p.weight ?? 1,
          acceptedOptions: (possibleValuesDetails || []).map((option: any, index: number) => ({
            ...option,
            position: option.position || index + 1,
            defaultOption: getDefaultValues(p).includes(option.label)
          }))
        } : {}),
        ...(backendType === 'CriteriaListModel' ? {
          weight: p.weight ?? 1,
          itemValue: p.itemValue ?? 1
        } : {})
      };
    };

    const properties = (criterion.properties || []).map(toBackendProperty);
    const groups = (criterion.groups || []).map((g: any) => {
      const {
        properties: groupProperties, groupedProperties: ignoredGroupedProperties, propertyModelType,
        title, currentEnabled, ...group
      } = g;
      return {
        ...group,
        type: 'CriteriaGroupModel',
        name: title || g.name,
        label: title || g.name || g.label,
        sortIndex: g.sortIndex || g.position || 1,
        properties: (groupProperties || []).map(toBackendProperty)
      };
    });
    const { properties: ignoredProperties, groups: ignoredGroups, propertyModelType, position, ...criterionData } = criterion as any;
    return {
      ...criterionData,
      type: 'CriteriaTabModel',
      active: true,
      name: criterion.name,
      label: criterion.name,
      sortIndex: criterion.position || 1,
      organizedProperties: [...properties, ...groups]
    };
  }

  private mapTypeToFrontend(p: any): string {
    if (p.type === 'ListModel' || p.type === 'CriteriaListModel') {
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
      const normalizeProperty = (p: any): any => {
        const criteriaDefaults: string[] = (p.acceptedOptions || [])
          .filter((option: any) => option.defaultOption)
          .map((option: any) => option.label);
        return {
          ...p,
          type: this.mapTypeToFrontend(p),
          ...(p.type === 'SelectionModel' ? {
            possibleValuesOptions: p.possibleValues
              ? String(p.possibleValues).split(',').filter((value: string) => !!value)
              : [],
            defaultValue: p.multipleSelection && p.defaultValue
              ? String(p.defaultValue).split(',').filter((value: string) => !!value)
              : (p.defaultValue || '')
          } : {}),
          ...(p.type === 'CriteriaSelectionModel' ? {
            possibleValuesDetails: p.acceptedOptions || [],
            possibleValuesOptions: (p.acceptedOptions || []).map((option: any) => option.label),
            defaultValue: p.multipleSelection === false ? (criteriaDefaults[0] || '') : criteriaDefaults,
            multipleSelection: p.multipleSelection !== undefined ? p.multipleSelection : true,
            disableMultipleSelection: false
          } : {}),
          ...(p.type === 'CriteriaListModel' ? {
            weight: p.weight ?? 1,
            itemValue: p.itemValue ?? 1
          } : {})
        };
      };
      const properties = organizedProperties
        .filter((p: any) => p.type !== 'CriteriaGroupModel')
        .map(normalizeProperty);

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
        groups: groups.map((group: any) => {
          const { groupedProperties: ignoredGroupedProperties, ...groupData } = group;
          return {
            ...groupData,
            propertyModelType: 'CriteriaGroupModel',
            title: group.name || group.label || group.title,
            properties: [...(group.properties || [])]
              .sort(sortByIndex)
              .map(normalizeProperty)
          };
        })
      };
    });
  }
}
