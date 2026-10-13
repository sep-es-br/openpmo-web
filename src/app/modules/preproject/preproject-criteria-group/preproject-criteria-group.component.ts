import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService, SelectItem } from 'primeng/api';

import { ListSelectionDialogItem } from 'src/app/shared/components/list-selection-dialog/list-selection-dialog.component';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { TypePropertModelEnum } from 'src/app/shared/enums/TypePropertModelEnum';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IPropertyListItem } from 'src/app/shared/interfaces/IPropertyListItem';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import {
  IndicatorService,
  IStrategicChallenge,
  ISustainableDevelopmentGoal
} from 'src/app/shared/services/indicator.service';
import { PreprojectCriterionGroup } from 'src/app/shared/services/preproject-criteria-config.service';

interface IChallengeHierarchyNode {
  id: number;
  label: string;
  type?: string;
  children: IChallengeHierarchyNode[];
  challenges: IStrategicChallenge[];
}

@Component({
  selector: 'app-preproject-criteria-group',
  templateUrl: './preproject-criteria-group.component.html',
  styleUrls: ['./preproject-criteria-group.component.scss']
})
export class PreprojectCriteriaGroupComponent implements OnInit, OnChanges, OnDestroy {

  @Input() group: PreprojectCriterionGroup;
  @Input() displayMode: string = 'grid';
  @Input() showCardTitle: boolean = true;
  @Input() readOnly: boolean = false;

  @Output() changed: EventEmitter<void> = new EventEmitter<void>();

  enabled: boolean = true;
  cardProperties: ICard;
  properties: Array<{ config: IWorkpackModelProperty; value?: PropertyTemplateModel }> = [];
  displayListSelectionDialog = false;
  activeListProperty: IWorkpackModelProperty | null = null;
  catalogLoading = false;
  listDialogItems: ListSelectionDialogItem[] = [];
  selectedListDialogItems: ListSelectionDialogItem[] = [];
  challengeCatalog: IStrategicChallenge[] = [];
  challengeTree: IChallengeHierarchyNode[] = [];
  managementOptions: SelectItem[] = [];
  groupOptions: SelectItem[] = [];
  subgroupOptions: SelectItem[] = [];
  selectedManagementIds: number[] = [];
  selectedGroupIds: number[] = [];
  selectedSubgroupIds: number[] = [];
  challengeFilterResetKey = 0;
  listSelectionResetKey = 0;

  private nextTemporaryListItemId = -1;
  private readonly toggleChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private readonly indicatorService: IndicatorService,
    private readonly messageService: MessageService,
    private readonly translateService: TranslateService
  ) {}

  get isBudgetGroup(): boolean {
    const title: string = (this.group?.title || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    return title.includes('ORCAMENTO') || title.includes('BUDGET');
  }

  get isChallengeDialog(): boolean {
    return this.activeListProperty?.type === TypePropertModelEnum.ChallengeListModel;
  }

  get showGroupFilter(): boolean {
    return this.selectedManagementIds.length > 0 && this.groupOptions.length > 0;
  }

  get showSubgroupFilter(): boolean {
    return this.selectedGroupIds.length > 0 && this.subgroupOptions.length > 0;
  }

  get challengeFiltersComplete(): boolean {
    if (!this.selectedManagementIds.length) {
      return false;
    }
    if (!this.groupOptions.length) {
      return true;
    }
    if (!this.selectedGroupIds.length) {
      return false;
    }
    return !this.subgroupOptions.length || this.selectedSubgroupIds.length > 0;
  }

  get groupFilterLabel(): string {
    return this.hierarchyTypeLabel(
      this.selectedManagementNodes.reduce((nodes, management) => [...nodes, ...management.children], []),
      this.translateService.instant('group')
    );
  }

  get subgroupFilterLabel(): string {
    return this.hierarchyTypeLabel(
      this.selectedGroupNodes.reduce((nodes, group) => [...nodes, ...group.children], []),
      this.translateService.instant('subgroup')
    );
  }

  ngOnInit(): void {
    this.toggleChanged.subscribe((enabled: boolean) => this.handleToggle(enabled));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.group?.currentValue || changes.readOnly) {
      this.enabled = this.group.currentEnabled !== undefined
        ? this.group.currentEnabled
        : !this.group.enablementKey;
      this.buildCard();
      this.buildProperties();
      void this.enrichPersistedChallengeItems();
    }
  }

  ngOnDestroy(): void {
    this.toggleChanged.complete();
  }

  getPropertyColumnClasses(property: IWorkpackModelProperty): string[] {
    const fullLine: boolean = this.isBudgetGroup
      ? true
      : property.fullLine
        || property.type === TypePropertModelEnum.TextAreaModel
        || property.type === TypePropertModelEnum.GroupModel
        || this.isListProperty(property);

    const classes: string[] = fullLine ? ['col-12'] : ['col-6'];
    if (this.isCompactBudgetProperty(property)) {
      classes.push('compact-budget-property');
    }
    return classes;
  }

  isListProperty(property: IWorkpackModelProperty): boolean {
    return property.type === TypePropertModelEnum.ChallengeListModel
      || property.type === TypePropertModelEnum.SdgListModel;
  }

  getListIcon(property: IWorkpackModelProperty): string {
    return property.type === TypePropertModelEnum.SdgListModel ? IconsEnum.Cog : IconsEnum.Selection;
  }

  async openListSelectionDialog(property: IWorkpackModelProperty): Promise<void> {
    if (this.readOnly || !this.enabled) {
      return;
    }

    this.activeListProperty = property;
    this.resetChallengeFilters();
    this.selectedListDialogItems = [];
    this.refreshDialogItems();
    this.listSelectionResetKey++;
    this.displayListSelectionDialog = true;
    await this.loadCatalog(property);
  }

  managementChanged(value: number[] = this.selectedManagementIds): void {
    this.selectedManagementIds = value || [];
    this.selectedGroupIds = [];
    this.selectedSubgroupIds = [];
    this.groupOptions = this.uniqueHierarchyNodes(
      this.selectedManagementNodes.reduce((nodes, management) => [...nodes, ...management.children], [])
    )
      .map(node => ({ value: node.id, label: node.label }));
    this.subgroupOptions = [];
    this.challengeFilterResetKey++;
    this.refreshDialogItems();
  }

  groupChanged(value: number[] = this.selectedGroupIds): void {
    this.selectedGroupIds = value || [];
    this.selectedSubgroupIds = [];
    this.subgroupOptions = this.uniqueHierarchyNodes(
      this.selectedGroupNodes.reduce((nodes, group) => [...nodes, ...group.children], [])
    )
      .map(node => ({ value: node.id, label: node.label }));
    this.challengeFilterResetKey++;
    this.refreshDialogItems();
  }

  subgroupChanged(value: number[] = this.selectedSubgroupIds): void {
    this.selectedSubgroupIds = value || [];
    this.challengeFilterResetKey++;
    this.refreshDialogItems();
  }

  confirmListSelection(items: ListSelectionDialogItem[]): void {
    this.applyDialogSelection(items);
    this.closeListSelectionDialog();
  }

  private applyDialogSelection(items: ListSelectionDialogItem[]): void {
    const property = this.activeListProperty;
    if (!property || this.readOnly) {
      return;
    }

    const newItems = items.map(item => this.toListItem(property, item));
    property.selectedListItems = this.mergeListItems(property.selectedListItems || [], newItems);
    this.selectedListDialogItems = [...items];
    this.changed.emit();
  }

  closeListSelectionDialog(): void {
    this.displayListSelectionDialog = false;
    this.activeListProperty = null;
    this.listDialogItems = [];
    this.selectedListDialogItems = [];
    this.resetChallengeFilters();
  }

  updateListItems(property: IWorkpackModelProperty, items: IPropertyListItem[]): void {
    if (this.readOnly) {
      return;
    }
    property.selectedListItems = items;
    this.changed.emit();
  }

  propertyChanged(item: { config: IWorkpackModelProperty; value?: PropertyTemplateModel }): void {
    if (this.readOnly) {
      return;
    }
    if (item.value) {
      item.config.currentValue = item.value.value;
      item.config.currentSelectedValue = item.value.selectedValue;
      item.config.currentSelectedValues = item.value.selectedValues;
      item.config.currentLocalitiesSelected = item.value.localitiesSelected;
    }
    this.changed.emit();
  }

  private async loadCatalog(property: IWorkpackModelProperty): Promise<void> {
    this.catalogLoading = true;
    try {
      if (property.type === TypePropertModelEnum.SdgListModel) {
        const response = await this.indicatorService.getOdsCatalog();
        if (!response.success) {
          throw new Error(response.message || 'ODS catalog unavailable');
        }
        property.availableListItems = (response.data || []).map(item => this.mapOds(item));
      } else {
        const response = await this.indicatorService.getChallengeCatalog();
        if (!response.success) {
          throw new Error(response.message || 'Challenge catalog unavailable');
        }
        this.challengeCatalog = (response.data || []).map(item => this.normalizeChallenge(item));
        this.challengeTree = this.buildChallengeTree(this.challengeCatalog);
        this.managementOptions = this.challengeTree
          .map(node => ({ value: node.id, label: node.label }));
        property.availableListItems = this.challengeCatalog.map(item => this.mapChallenge(item));
      }
      this.refreshDialogItems();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('error'),
        detail: error?.error?.message
          || error?.message
          || this.translateService.instant('messages.catalogLoadError')
      });
    } finally {
      this.catalogLoading = false;
    }
  }

  private refreshDialogItems(): void {
    const property = this.activeListProperty;
    if (!property) {
      this.listDialogItems = [];
      return;
    }

    let availableItems = property.availableListItems || [];
    if (property.type === TypePropertModelEnum.ChallengeListModel) {
      availableItems = this.challengeFiltersComplete ? availableItems.filter(item => {
        const challenge = item.data as IStrategicChallenge;
        return !challenge
          || (this.selectedManagementIds.includes(challenge.managementId)
            && (!this.hasHierarchyValue(challenge.group) || this.selectedGroupIds.includes(challenge.groupId))
            && (!this.hasHierarchyValue(challenge.subgroup) || this.selectedSubgroupIds.includes(challenge.subgroupId)));
      }) : [];
    }

    const selectedKeys = new Set((property.selectedListItems || []).map(item => this.listItemKey(item)));
    availableItems = availableItems.filter(item => !selectedKeys.has(this.listItemKey(item)));

    const uniqueItems = availableItems
      .reduce((items: Map<string, IPropertyListItem>, item: IPropertyListItem) => {
        const key = this.listItemKey(item);
        if (!items.has(key)) {
          items.set(key, item);
        }
        return items;
      }, new Map<string, IPropertyListItem>());
    this.listDialogItems = Array.from(uniqueItems.values()).map(item => this.toDialogItem(item));
  }

  private mapOds(item: ISustainableDevelopmentGoal): IPropertyListItem {
    return {
      id: item.order,
      foreignKey: `ods:${item.order}`,
      name: item.name,
      fullName: item.name,
      data: item
    };
  }

  private mapChallenge(item: IStrategicChallenge): IPropertyListItem {
    const lastLevel = this.hasHierarchyValue(item.subgroup)
      ? item.subgroup
      : this.hasHierarchyValue(item.group)
        ? item.group
        : item.management;
    return {
      id: item.challengeId,
      foreignKey: `challenge:${item.challengeId}`,
      name: item.challenge,
      fullName: lastLevel || item.challenge,
      data: item
    };
  }

  private async enrichPersistedChallengeItems(): Promise<void> {
    const challengeProperties = (this.group?.properties || [])
      .filter(property => property.type === TypePropertModelEnum.ChallengeListModel
        && (property.selectedListItems || []).length > 0);
    if (!challengeProperties.length) {
      return;
    }

    try {
      const response = await this.indicatorService.getChallengeCatalog();
      if (!response.success) {
        return;
      }
      const catalogById = new Map<number, IPropertyListItem>(
        (response.data || [])
          .map(item => this.normalizeChallenge(item))
          .map(item => [item.challengeId, this.mapChallenge(item)] as [number, IPropertyListItem])
      );
      challengeProperties.forEach(property => {
        property.selectedListItems = (property.selectedListItems || []).map(item => {
          const challengeId = this.challengeIdFromListItem(item);
          const catalogItem = catalogById.get(challengeId);
          return catalogItem
            ? { ...item, fullName: catalogItem.fullName }
            : item;
        });
      });
    } catch (_error) {
      // The persisted label remains usable when the auxiliary catalog is unavailable.
    }
  }

  private challengeIdFromListItem(item: IPropertyListItem): number {
    const foreignKeyMatch = String(item.foreignKey || '').match(/^challenge:(\d+)$/);
    return foreignKeyMatch ? Number(foreignKeyMatch[1]) : Number(item.id);
  }

  private toDialogItem(item: IPropertyListItem): ListSelectionDialogItem {
    const isChallenge = (item.foreignKey || '').startsWith('challenge:');
    return {
      id: this.listItemKey(item),
      label: item.name,
      description: !isChallenge && item.fullName && item.fullName !== item.name
        ? item.fullName
        : undefined,
      data: item
    };
  }

  private toListItem(
    property: IWorkpackModelProperty,
    item: ListSelectionDialogItem
  ): IPropertyListItem {
    const key = String(item.id);
    const selectedItem = (property.selectedListItems || [])
      .find(current => this.listItemKey(current) === key);
    const catalogItem = item.data as IPropertyListItem | undefined;
    return {
      id: selectedItem?.id ?? catalogItem?.id ?? this.nextTemporaryListItemId--,
      foreignKey: selectedItem?.foreignKey || catalogItem?.foreignKey || key,
      name: item.label,
      fullName: catalogItem?.fullName || item.description || item.label,
      data: catalogItem?.data
    };
  }

  private listItemKey(item: IPropertyListItem): string {
    return item.foreignKey || String(item.id);
  }

  private mergeListItems(
    currentItems: IPropertyListItem[],
    newItems: IPropertyListItem[]
  ): IPropertyListItem[] {
    const itemsByKey = [...currentItems, ...newItems].reduce((items, item) => {
      const key = this.listItemKey(item);
      if (!items.has(key)) {
        items.set(key, item);
      }
      return items;
    }, new Map<string, IPropertyListItem>());
    return Array.from(itemsByKey.values());
  }

  private get selectedManagementNodes(): IChallengeHierarchyNode[] {
    return this.challengeTree.filter(node => this.selectedManagementIds.includes(node.id));
  }

  private get selectedGroupNodes(): IChallengeHierarchyNode[] {
    return this.selectedManagementNodes
      .reduce((nodes, management) => [...nodes, ...management.children], [])
      .filter(node => this.selectedGroupIds.includes(node.id));
  }

  private uniqueHierarchyNodes(nodes: IChallengeHierarchyNode[]): IChallengeHierarchyNode[] {
    return Array.from(nodes.reduce((unique, node) => {
      if (!unique.has(node.id)) {
        unique.set(node.id, node);
      }
      return unique;
    }, new Map<number, IChallengeHierarchyNode>()).values());
  }

  private hierarchyTypeLabel(nodes: IChallengeHierarchyNode[], fallback: string): string {
    const types = nodes.map(node => node.type).filter((type, index, all) => !!type && all.indexOf(type) === index);
    return types.length === 1 ? types[0] : fallback;
  }

  private normalizeChallenge(item: IStrategicChallenge): IStrategicChallenge {
    return {
      ...item,
      managementId: item.managementId != null ? item.managementId : item.gestaoId,
      management: item.management || item.gestao,
      groupId: item.groupId != null ? item.groupId : item.grupoId,
      groupType: item.groupType || item.grupoTipo,
      group: item.group || item.grupo,
      subgroupId: item.subgroupId != null ? item.subgroupId : item.subgrupoId,
      subgroupType: item.subgroupType || item.subgrupoTipo,
      subgroup: item.subgroup || item.subgrupo,
      challengeId: item.challengeId != null ? item.challengeId : item.desafioId,
      challenge: item.challenge || item.desafio
    };
  }

  private buildChallengeTree(challenges: IStrategicChallenge[]): IChallengeHierarchyNode[] {
    const managements = new Map<number, IChallengeHierarchyNode>();
    challenges.forEach(challenge => {
      if (challenge.managementId == null || !challenge.management) {
        return;
      }
      const management = this.getOrCreateNode(
        managements,
        challenge.managementId,
        challenge.management
      );
      management.challenges.push(challenge);

      if (challenge.groupId == null || !this.hasHierarchyValue(challenge.group)) {
        return;
      }
      const groups = new Map(management.children.map(node => [node.id, node]));
      const group = this.getOrCreateNode(groups, challenge.groupId, challenge.group, challenge.groupType);
      management.children = Array.from(groups.values());
      group.challenges.push(challenge);

      if (challenge.subgroupId == null || !this.hasHierarchyValue(challenge.subgroup)) {
        return;
      }
      const subgroups = new Map(group.children.map(node => [node.id, node]));
      const subgroup = this.getOrCreateNode(
        subgroups,
        challenge.subgroupId,
        challenge.subgroup,
        challenge.subgroupType
      );
      group.children = Array.from(subgroups.values());
      subgroup.challenges.push(challenge);
    });
    return this.sortHierarchy(Array.from(managements.values()));
  }

  private getOrCreateNode(
    nodes: Map<number, IChallengeHierarchyNode>,
    id: number,
    label: string,
    type?: string
  ): IChallengeHierarchyNode {
    if (!nodes.has(id)) {
      nodes.set(id, { id, label, type, children: [], challenges: [] });
    }
    return nodes.get(id) as IChallengeHierarchyNode;
  }

  private hasHierarchyValue(value: string): boolean {
    const normalized = (value || '').trim().toLowerCase();
    return !!normalized && normalized !== '-' && normalized !== 'null' && normalized !== 'undefined';
  }

  private sortHierarchy(nodes: IChallengeHierarchyNode[]): IChallengeHierarchyNode[] {
    return nodes
      .map(node => ({ ...node, children: this.sortHierarchy(node.children) }))
      .sort((first, second) => first.label.localeCompare(second.label));
  }

  private resetChallengeFilters(): void {
    this.selectedManagementIds = [];
    this.selectedGroupIds = [];
    this.selectedSubgroupIds = [];
    this.managementOptions = [];
    this.groupOptions = [];
    this.subgroupOptions = [];
    this.challengeFilterResetKey++;
  }

  private isCompactBudgetProperty(property: IWorkpackModelProperty): boolean {
    if (!this.isBudgetGroup) {
      return false;
    }
    const label: string = this.normalizeLabel(property.label);
    return label.includes('CUSTO PREVISTO TOTAL')
      || label.includes('STATUS CAPTACAO')
      || label.includes('QUAL VALOR PREVISTO NA LOA');
  }

  private buildCard(): void {
    this.cardProperties = {
      cardTitle: this.group.title,
      notShowCardTitle: !this.showCardTitle,
      collapseble: this.showCardTitle,
      initialStateCollapse: false,
      toggleable: !!this.group.enablementKey,
      disabledToggle: this.readOnly,
      collapseOnToggle: false,
      initialStateToggle: this.enabled,
      toggleLabel: this.group.legend || '',
      onToggle: this.toggleChanged
    };
  }

  private buildProperties(): void {
    this.properties = (this.group.properties || [])
      .filter((property: IWorkpackModelProperty) => property.active !== false)
      .sort((first: IWorkpackModelProperty, second: IWorkpackModelProperty) =>
        (first.sortIndex || 0) - (second.sortIndex || 0))
      .map((config: IWorkpackModelProperty) => ({
        config,
        value: this.isListProperty(config) ? undefined : this.toPropertyTemplate(config)
      }));
  }

  private toPropertyTemplate(config: IWorkpackModelProperty): PropertyTemplateModel {
    const property: PropertyTemplateModel = Object.assign(new PropertyTemplateModel(), config, {
      type: this.toRuntimeType(config.type),
      disabled: this.readOnly || !this.enabled,
      multipleSelection: config.multipleSelection,
      possibleValues: this.getPossibleValues(config),
      rows: this.isFinancialSourcesDescription(config) ? 3 : config.rows,
      value: config.currentValue !== undefined ? config.currentValue : config.defaultValue,
      selectedValue: config.currentSelectedValue,
      selectedValues: config.currentSelectedValues,
      localitiesSelected: config.currentLocalitiesSelected
    });
    return property;
  }

  private isFinancialSourcesDescription(config: IWorkpackModelProperty): boolean {
    const label: string = this.normalizeLabel(config.label);
    return config.type === TypePropertModelEnum.TextAreaModel
      && label.includes('DESCRICAO')
      && label.includes('FONTES FINANCEIRAS');
  }

  private normalizeLabel(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }

  private toRuntimeType(type: string): string {
    const types: { [key: string]: string } = {
      [TypePropertModelEnum.IntegerModel]: TypePropertyModelEnum.IntegerModel,
      [TypePropertModelEnum.TextModel]: TypePropertyModelEnum.TextModel,
      [TypePropertModelEnum.DateModel]: TypePropertyModelEnum.DateModel,
      [TypePropertModelEnum.ToggleModel]: TypePropertyModelEnum.ToggleModel,
      [TypePropertModelEnum.UnitSelectionModel]: TypePropertyModelEnum.UnitSelectionModel,
      [TypePropertModelEnum.SelectionModel]: TypePropertyModelEnum.SelectionModel,
      [TypePropertModelEnum.CriteriaSelectionModel]: TypePropertyModelEnum.SelectionModel,
      [TypePropertModelEnum.TextAreaModel]: TypePropertyModelEnum.TextAreaModel,
      [TypePropertModelEnum.NumberModel]: TypePropertyModelEnum.NumberModel,
      [TypePropertModelEnum.CurrencyModel]: TypePropertyModelEnum.CurrencyModel,
      [TypePropertModelEnum.LocalitySelectionModel]: TypePropertyModelEnum.LocalitySelectionModel,
      [TypePropertModelEnum.OrganizationSelectionModel]: TypePropertyModelEnum.OrganizationSelectionModel
    };
    return types[type] || type;
  }

  private getPossibleValues(config: IWorkpackModelProperty): Array<{ label: string; value: string }> {
    const values: string[] = config.type === TypePropertModelEnum.CriteriaSelectionModel
      ? (config.possibleValuesDetails || []).map(option => option.label)
      : (config.possibleValuesOptions || []);
    return values.map((value: string) => ({ label: value, value }));
  }

  private handleToggle(enabled: boolean): void {
    if (this.readOnly) {
      return;
    }
    this.enabled = enabled;
    this.group.currentEnabled = enabled;
    this.properties.forEach(item => {
      if (item.value) {
        item.value.disabled = !enabled;
      }
    });
    this.changed.emit();
  }
}
