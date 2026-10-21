import { AfterViewChecked, Component, EventEmitter, HostBinding, Input, OnChanges, Output, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { MultiSelect } from 'primeng/multiselect';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, MessageService, SelectItem } from 'primeng/api';
import { ListSelectionDialogItem } from '../../../list-selection-dialog/list-selection-dialog.component';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IPropertyListItem } from 'src/app/shared/interfaces/IPropertyListItem';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { IndicatorService, IStrategicChallenge, ISustainableDevelopmentGoal } from 'src/app/shared/services/indicator.service';

interface IChallengeHierarchyNode {
  id: number;
  label: string;
  type?: string;
  children: IChallengeHierarchyNode[];
  challenges: IStrategicChallenge[];
}

@Component({
  selector: 'app-property-list-selection',
  templateUrl: './property-list-selection.component.html',
  styleUrls: ['./property-list-selection.component.scss']
})
export class PropertyListSelectionComponent implements OnChanges, AfterViewChecked {
  @ViewChildren(MultiSelect) filterSelects: QueryList<MultiSelect>;
  @Input() property: PropertyTemplateModel;
  @Input() displayMode: string = 'grid';
  @Output() changed = new EventEmitter<PropertyTemplateModel>();
  cardItems: ICardItem[] = [];
  displayListSelectionDialog = false;
  activeListProperty: PropertyTemplateModel | null = null;
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
  private realignFilterOverlays = false;

  constructor(
    private readonly indicatorService: IndicatorService,
    private readonly messageService: MessageService,
    private readonly translateService: TranslateService
  ) {}

  @HostBinding('class.challenge-list-selection')
  get isChallengeList(): boolean {
    return this.property?.listCatalog === 'CHALLENGE';
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.refreshCards();
    if (changes.property && this.property) {
      void this.enrichPersistedChallengeItems();
    }
  }

  ngAfterViewChecked(): void {
    if (!this.realignFilterOverlays) {
      return;
    }
    this.realignFilterOverlays = false;
    this.filterSelects.forEach(select => {
      if (select.overlayVisible) {
        select.alignOverlay();
      }
    });
  }

  private refreshCards(): void {
    if (!this.property) {
      this.cardItems = [];
      return;
    }
    const icon = this.property.listCatalog === 'ODS' ? IconsEnum.Cog : IconsEnum.Selection;
    this.cardItems = (this.property.selectedListItems || []).map(item => ({
      typeCardItem: 'listItem',
      icon,
      iconSvg: true,
      itemId: item.id,
      nameCardItem: item.name,
      fullNameCardItem: item.fullName || item.name,
      subtitleCardItem: item.fullName && item.fullName !== item.name ? item.fullName : undefined,
      menuItems: this.property.disabled ? undefined : this.createItemMenu(item)
    }));
    this.cardItems.push({
      typeCardItem: 'newCardItem',
      icon: IconsEnum.Plus,
      disabled: this.property.disabled,
      onClick: () => { void this.openListSelectionDialog(); }
    });
  }

  private createItemMenu(item: IPropertyListItem): MenuItem[] {
    return [{
      label: this.translateService.instant('delete'),
      icon: 'fas fa-trash-alt',
      command: () => {
        if (!this.property.disabled) {
          this.property.selectedListItems = (this.property.selectedListItems || [])
            .filter(current => this.listItemKey(current) !== this.listItemKey(item));
          this.notifyChange();
        }
      }
    }];
  }

  private notifyChange(): void {
    this.property.dirty = true;
    this.refreshCards();
    this.changed.emit(this.property);
  }

  get isChallengeDialog(): boolean {
    return this.activeListProperty?.listCatalog === 'CHALLENGE';
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

  async openListSelectionDialog(): Promise<void> {
    if (this.property.disabled) {
      return;
    }

    const property = this.property;
    this.activeListProperty = property;
    this.resetChallengeFilters();
    this.selectedListDialogItems = [];
    this.refreshDialogItems();
    this.listSelectionResetKey++;
    this.displayListSelectionDialog = true;
    await this.loadCatalog(property);
  }

  managementChanged(value: number[] = this.selectedManagementIds): void {
    this.realignFilterOverlays = true;
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
    this.realignFilterOverlays = true;
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
    this.realignFilterOverlays = true;
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
    if (!property || this.property.disabled) {
      return;
    }

    const newItems = items.map(item => this.toListItem(property, item));
    property.selectedListItems = this.mergeListItems(property.selectedListItems || [], newItems);
    this.selectedListDialogItems = [...items];
    this.notifyChange();
  }

  closeListSelectionDialog(): void {
    this.displayListSelectionDialog = false;
    this.activeListProperty = null;
    this.listDialogItems = [];
    this.selectedListDialogItems = [];
    this.resetChallengeFilters();
  }

  private async loadCatalog(property: PropertyTemplateModel): Promise<void> {
    this.catalogLoading = true;
    try {
      if (property.listCatalog === 'ODS') {
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
    if (property.listCatalog === 'CHALLENGE') {
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
    const challengeProperties = this.property.listCatalog === 'CHALLENGE'
      && (this.property.selectedListItems || []).length > 0 ? [this.property] : [];
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
      this.refreshCards();
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
    property: PropertyTemplateModel,
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

}
