import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { IStrategicIndicatorDetail, IndicatorLinkCategory, IndicatorService } from '../../../../shared/services/indicator.service';
import { WorkpackService } from '../../../../shared/services/workpack.service';
import { TranslateService } from '@ngx-translate/core';
import { WorkpackIndicatorRouteReuseStrategy } from '../../../../shared/services/workpack-indicator-route-reuse.strategy';
import { isStrategicProjectGoalValid } from './strategic-project-goal-validation';

interface CatalogOption {
  id: string;
  name: string;
  description?: string;
  managementId?: number;
  management?: string;
  groupId?: number;
  groupType?: string;
  group?: string;
  subgroupId?: number;
  subgroupType?: string;
  subgroup?: string;
  indicatorId?: number;
}

interface CatalogFilterOption {
  label: string;
  value: number;
}

interface StrategicGoalValue {
  year: string;
  value: number;
}

interface StrategicIndicatorDetailsView {
  source?: string;
  unitOfMeasure?: string;
  referenceYear?: number;
  referenceValue?: number;
  polarity?: string;
  goals: StrategicGoalValue[];
}

interface SelectedStrategicIndicator extends CatalogOption {
  details?: StrategicIndicatorDetailsView;
  detailsLoading: boolean;
  detailsError: boolean;
}

@Component({
  selector: 'app-project-indicator-link-form',
  templateUrl: './project-indicator-link-form.component.html',
  styleUrls: ['./project-indicator-link-form.component.scss']
})
export class ProjectIndicatorLinkFormComponent implements OnInit, OnDestroy {
  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

  category: IndicatorLinkCategory;
  idWorkpack: number;
  idPlan: number;
  catalog: CatalogOption[] = [];
  filteredCatalog: CatalogOption[] = [];
  selectedIds = new Set<string>();
  searchTerm = '';
  loading = true;
  saving = false;
  managementOptions: CatalogFilterOption[] = [];
  groupOptions: CatalogFilterOption[] = [];
  subgroupOptions: CatalogFilterOption[] = [];
  selectedManagementId: number | null = null;
  selectedGroupId: number | null = null;
  selectedSubgroupIds: number[] = [];
  selectedStrategicIndicatorIds: string[] = [];
  selectedStrategicIndicators: SelectedStrategicIndicator[] = [];
  filteredStrategicIndicators: CatalogOption[] = [];
  projectGoalValues: { [indicatorId: string]: { [year: string]: number | null } } = {};
  private projectGoalTouched: { [indicatorId: string]: { [year: string]: boolean } } = {};
  private projectGoalDirty: { [indicatorId: string]: { [year: string]: boolean } } = {};
  private strategicIndicatorDetails: { [indicatorId: number]: StrategicIndicatorDetailsView } = {};
  private loadingStrategicIndicatorIds = new Set<number>();
  private failedStrategicIndicatorIds = new Set<number>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private indicatorService: IndicatorService,
    private workpackService: WorkpackService,
    private messageService: MessageService,
    private translateService: TranslateService,
    private routeReuseStrategy: WorkpackIndicatorRouteReuseStrategy,
    private elementRef: ElementRef
  ) {}

  ngOnDestroy(): void {
    this.elementRef.nativeElement.removeEventListener('paste', this.preventExponentPaste, true);
    this.routeReuseStrategy.clearAfterIndicatorFormExit();
  }

  async ngOnInit(): Promise<void> {
    this.elementRef.nativeElement.addEventListener('paste', this.preventExponentPaste, true);
    this.category = this.route.snapshot.paramMap.get('category') as IndicatorLinkCategory;
    const queryParams = this.route.snapshot.queryParams;
    this.idWorkpack = Number(queryParams.idWorkpack || queryParams.id || this.workpackService.getWorkpackParams()?.idWorkpack);
    this.idPlan = Number(queryParams.idPlan || this.workpackService.getWorkpackParams()?.idPlan);
    if (!this.idWorkpack) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('error'),
        detail: this.translateService.instant('workpackNotSelected')
      });
      this.loading = false;
      this.showCancelButton();
      return;
    }
    await this.loadCatalog();
    this.showCancelButton();
  }

  async loadCatalog(): Promise<void> {
    this.loading = true;
    try {
      const linksResponse = await this.indicatorService.getProjectIndicatorLinks(this.idWorkpack, this.category);
      if (!linksResponse?.success) {
        throw new Error(linksResponse?.message || 'Unable to load project links');
      }
      const linkedIds = new Set((linksResponse.data || []).map(link => link.externalId));
      if (this.category === 'ODS') {
        const catalogResponse = await this.indicatorService.getOdsCatalog();
        if (!catalogResponse?.success) {
          throw new Error(catalogResponse?.message || 'Catalog unavailable');
        }
        this.catalog = (catalogResponse.data || [])
          .map(item => ({ id: `ods:${item.order}`, name: item.name, description: item.description }))
          .filter(item => !linkedIds.has(item.id));
      } else if (this.category === 'STRATEGIC') {
        const catalogResponse = await this.indicatorService.getStrategicIndicatorCatalog();
        if (!catalogResponse?.success) {
          throw new Error(catalogResponse?.message || 'Catalog unavailable');
        }
        this.catalog = (catalogResponse.data || [])
          .map(item => ({
            id: `strategic:${item.indicatorId}`,
            name: item.indicator,
            managementId: item.managementId,
            management: item.management,
            groupId: item.groupId,
            groupType: item.groupType,
            group: item.group,
            subgroupId: item.subgroupId,
            subgroupType: item.subgroupType,
            subgroup: item.subgroup,
            indicatorId: item.indicatorId,
            description: [
              item.management && `${this.translateService.instant('management')}: ${item.management}`,
              item.group && `${this.translateService.instant('group')}: ${item.group}`,
              item.subgroup && `${this.translateService.instant('subgroup')}: ${item.subgroup}`
            ].filter(Boolean).join(' · ')
          }))
          .filter(item => /^strategic:\d+$/.test(item.id) && !!item.name?.trim() && !linkedIds.has(item.id));
        this.initializeStrategicFilters();
      } else {
        const catalogResponse = await this.indicatorService.getEs500IndicatorCatalog();
        if (!catalogResponse?.success) {
          throw new Error(catalogResponse?.message || 'Catalog unavailable');
        }
        this.catalog = (catalogResponse.data || [])
          .map(item => ({
            id: `es500:${item.code || item.id}`,
            name: item.title,
            description: [
              item.description,
              item.targetCode && `${this.translateService.instant('target')}: ${item.targetCode}`,
              item.targetValue && `${this.translateService.instant('targetValue')}: ${item.targetValue}`,
              item.unit,
              item.polarity,
              item.source
            ].filter(Boolean).join(' · ')
          }))
          .filter(item => !!item.id && !!item.name && !linkedIds.has(item.id));
      }
      this.applySearch();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('error'),
        detail: error?.error?.message || error?.message || this.translateService.instant('messages.catalogLoadError')
      });
    } finally {
      this.loading = false;
    }
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    this.filteredCatalog = this.catalog.filter(item =>
      !term || `${item.name} ${item.description || ''}`.toLocaleLowerCase().includes(term)
    );
    this.applyStrategicFilters();
  }

  get strategicGroupLabel(): string {
    const groupType = this.catalog.find(item => item.groupType)?.groupType?.trim();
    return !groupType || this.isMissingType(groupType) || groupType.toLocaleLowerCase() === 'área estratégica'
      ? this.translateService.instant('strategicAxis')
      : groupType;
  }

  get strategicSubgroupLabel(): string {
    const subgroupType = this.catalog.find(item => item.subgroupType)?.subgroupType?.trim();
    return !subgroupType || this.isMissingType(subgroupType)
      ? this.translateService.instant('strategicArea')
      : subgroupType;
  }

  private refreshSelectedStrategicIndicators(): void {
    this.selectedStrategicIndicators = this.catalog
      .filter(item => this.selectedStrategicIndicatorIds.includes(item.id))
      .map(item => ({
        ...item,
        details: item.indicatorId == null ? undefined : this.strategicIndicatorDetails[item.indicatorId],
        detailsLoading: item.indicatorId != null && this.loadingStrategicIndicatorIds.has(item.indicatorId),
        detailsError: item.indicatorId != null && this.failedStrategicIndicatorIds.has(item.indicatorId)
      }));
  }

  private isMissingType(type: string): boolean {
    return ['-', '—', '--'].includes(type.trim());
  }

  getProjectGoalValue(indicatorId: string, year: string): number | null {
    return this.projectGoalValues[indicatorId]?.[year] ?? null;
  }

  setProjectGoalValue(indicatorId: string, year: string, value: number | null): void {
    if (!this.projectGoalValues[indicatorId]) {
      this.projectGoalValues[indicatorId] = {};
    }
    if (!this.projectGoalDirty[indicatorId]) {
      this.projectGoalDirty[indicatorId] = {};
    }
    this.projectGoalValues[indicatorId][year] = value;
    this.projectGoalDirty[indicatorId][year] = true;
    this.updateActionButtons();
  }

  markProjectGoalTouched(indicatorId: string, year: string): void {
    if (!this.projectGoalTouched[indicatorId]) {
      this.projectGoalTouched[indicatorId] = {};
    }
    this.projectGoalTouched[indicatorId][year] = true;
  }

  shouldShowProjectGoalInvalid(indicator: SelectedStrategicIndicator, goal: StrategicGoalValue): boolean {
    const touched = this.projectGoalTouched[indicator.id]?.[goal.year];
    const dirty = this.projectGoalDirty[indicator.id]?.[goal.year];
    return !!(touched || dirty) && this.isProjectGoalInvalid(indicator, goal);
  }

  isProjectGoalInvalid(indicator: SelectedStrategicIndicator, goal: StrategicGoalValue): boolean {
    const projectGoal = this.getProjectGoalValue(indicator.id, goal.year);
    return !isStrategicProjectGoalValid(projectGoal, goal.value, indicator.details?.polarity);
  }

  hasInvalidProjectGoals(): boolean {
    return this.selectedStrategicIndicators.some(item =>
      item.detailsLoading || item.detailsError || !item.details || !item.details.goals.length ||
      item.details.goals.some(goal => this.isProjectGoalInvalid(item, goal)));
  }

  private preventExponentPaste = (event: ClipboardEvent): void => {
    const target = event.target as HTMLElement;
    const pastedText = event.clipboardData?.getData('text') || '';
    if (target?.matches('input.strategic-project-goal-input') && /[eE]/.test(pastedText)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  retryStrategicIndicatorDetails(indicatorId: number): void {
    this.loadStrategicIndicatorDetails([indicatorId]);
  }

  initializeStrategicFilters(): void {
    const managements = new Map<number, string>();
    this.catalog.forEach(item => {
      if (item.managementId != null && item.management) {
        managements.set(item.managementId, item.management);
      }
    });
    this.managementOptions = Array.from(managements.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label));
    this.selectedManagementId = this.managementOptions.length === 1 ? this.managementOptions[0].value : null;
    this.updateStrategicGroups();
  }

  onStrategicManagementChange(): void {
    this.clearStrategicSelection();
    this.selectedGroupId = null;
    this.selectedSubgroupIds = [];
    this.updateStrategicGroups();
    this.updateActionButtons();
  }

  onStrategicGroupChange(): void {
    this.clearStrategicSelection();
    this.selectedSubgroupIds = [];
    this.updateStrategicSubgroups();
    this.updateActionButtons();
  }

  onStrategicSubgroupsChange(): void {
    this.clearStrategicSelection();
    this.updateActionButtons();
    this.applyStrategicFilters();
  }

  onStrategicIndicatorsChange(ids: string[]): void {
    this.selectedStrategicIndicatorIds = ids || [];
    this.selectedIds.clear();
    this.selectedStrategicIndicatorIds.forEach(id => this.selectedIds.add(id));
    this.refreshSelectedStrategicIndicators();
    const newlySelectedIds = this.selectedStrategicIndicatorIds
      .map(id => this.catalog.find(item => item.id === id))
      .filter(item => item && item.indicatorId != null &&
        !this.strategicIndicatorDetails[item.indicatorId] &&
        !this.loadingStrategicIndicatorIds.has(item.indicatorId))
      .map(item => item.indicatorId);
    if (newlySelectedIds.length) {
      this.loadStrategicIndicatorDetails(newlySelectedIds);
    }
    this.updateActionButtons();
  }

  private async loadStrategicIndicatorDetails(indicatorIds: number[]): Promise<void> {
    const idsToLoad = Array.from(new Set(indicatorIds))
      .filter(id => !this.strategicIndicatorDetails[id] && !this.loadingStrategicIndicatorIds.has(id));
    if (!idsToLoad.length) {
      return;
    }
    idsToLoad.forEach(id => {
      this.loadingStrategicIndicatorIds.add(id);
      this.failedStrategicIndicatorIds.delete(id);
    });
    this.refreshSelectedStrategicIndicators();

    try {
      const response = await this.indicatorService.getStrategicIndicatorDetails(idsToLoad);
      if (!response?.success) {
        throw new Error(response?.message || 'Strategic indicator details unavailable');
      }

      const grouped = new Map<number, StrategicIndicatorDetailsView>();
      (response.data || []).forEach((row: IStrategicIndicatorDetail) => {
        if (row.indicatorId == null) {
          return;
        }
        const details = grouped.get(row.indicatorId) || { goals: [] };
        details.source = details.source || row.source || undefined;
        details.unitOfMeasure = details.unitOfMeasure || row.unitOfMeasure || undefined;
        details.referenceYear = details.referenceYear == null ? row.referenceYear : details.referenceYear;
        details.referenceValue = details.referenceValue == null ? row.referenceValue : details.referenceValue;
        details.polarity = details.polarity || row.polarity || undefined;
        if (row.goalYear != null && row.goalValue != null &&
          !details.goals.some(goal => goal.year === String(row.goalYear))) {
          details.goals.push({ year: String(row.goalYear), value: row.goalValue });
        }
        grouped.set(row.indicatorId, details);
      });

      idsToLoad.forEach(id => {
        const details = grouped.get(id);
        if (details) {
          details.goals.sort((left, right) => Number(left.year) - Number(right.year));
          this.strategicIndicatorDetails[id] = details;
        } else {
          this.failedStrategicIndicatorIds.add(id);
        }
      });
    } catch (_error) {
      idsToLoad.forEach(id => this.failedStrategicIndicatorIds.add(id));
    } finally {
      idsToLoad.forEach(id => this.loadingStrategicIndicatorIds.delete(id));
      this.refreshSelectedStrategicIndicators();
      this.updateActionButtons();
    }
  }

  resetStrategicFilters(): void {
    this.selectedManagementId = this.managementOptions.length === 1 ? this.managementOptions[0].value : null;
    this.selectedGroupId = null;
    this.selectedSubgroupIds = [];
    this.clearStrategicSelection();
    this.searchTerm = '';
    this.updateStrategicGroups();
    this.updateActionButtons();
  }

  private updateStrategicGroups(): void {
    const groups = new Map<number, string>();
    this.catalog
      .filter(item => this.selectedManagementId == null || item.managementId === this.selectedManagementId)
      .forEach(item => {
        if (item.groupId != null && item.group) {
          groups.set(item.groupId, item.group);
        }
      });
    this.groupOptions = Array.from(groups.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label));
    this.updateStrategicSubgroups();
  }

  private updateStrategicSubgroups(): void {
    const subgroups = new Map<number, string>();
    this.catalog
      .filter(item => (this.selectedManagementId == null || item.managementId === this.selectedManagementId) &&
        (this.selectedGroupId == null || item.groupId === this.selectedGroupId))
      .forEach(item => {
        if (item.subgroupId != null) {
          subgroups.set(item.subgroupId, item.subgroup || this.translateService.instant('withoutSubgroup'));
        }
      });
    this.subgroupOptions = Array.from(subgroups.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label));
    this.applyStrategicFilters();
  }

  private applyStrategicFilters(): void {
    if (this.category !== 'STRATEGIC') {
      this.filteredStrategicIndicators = [];
      return;
    }
    const term = this.searchTerm.trim().toLocaleLowerCase();
    this.filteredStrategicIndicators = this.catalog.filter(item =>
      (this.selectedManagementId == null || item.managementId === this.selectedManagementId) &&
      (this.selectedGroupId == null || item.groupId === this.selectedGroupId) &&
      (!this.selectedSubgroupIds.length || (item.subgroupId != null && this.selectedSubgroupIds.includes(item.subgroupId))) &&
      (!term || `${item.name} ${item.description || ''}`.toLocaleLowerCase().includes(term))
    );
  }

  removeStrategicIndicator(id: string): void {
    this.onStrategicIndicatorsChange(this.selectedStrategicIndicatorIds.filter(selectedId => selectedId !== id));
  }

  private clearStrategicSelection(): void {
    this.selectedStrategicIndicatorIds = [];
    this.selectedIds.clear();
    this.refreshSelectedStrategicIndicators();
  }

  trackByStrategicIndicatorId(_index: number, item: SelectedStrategicIndicator): string {
    return item.id;
  }

  toggleSelection(id: string, event: Event): void {
    const selected = (event.target as HTMLInputElement).checked;
    if (selected) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
    this.updateActionButtons();
  }

  selectSingle(id: string): void {
    this.selectedIds.clear();
    this.selectedIds.add(id);
    this.updateActionButtons();
  }

  private updateActionButtons(): void {
    const goalsAreValid = this.category !== 'STRATEGIC' || (
      !this.selectedStrategicIndicators.some(item => item.detailsLoading || item.detailsError || !item.details) &&
      !this.hasInvalidProjectGoals()
    );
    if (this.selectedIds.size && goalsAreValid) {
      this.saveButton.showButton();
    } else {
      this.saveButton.hideButton();
    }
  }

  private showCancelButton(): void {
    setTimeout(() => this.cancelButton?.showButton(), 0);
  }

  async addSelectedItems(): Promise<void> {
    if (!this.idWorkpack || !this.selectedIds.size || this.saving ||
      this.indicatorService.isProjectIndicatorLinksSaving(this.idWorkpack, this.category)) {
      return;
    }
    if (this.category === 'STRATEGIC') {
      if (this.selectedStrategicIndicators.some(item => item.detailsLoading || item.detailsError || !item.details)) {
        const detailsLoading = this.selectedStrategicIndicators.some(item => item.detailsLoading);
        this.messageService.add({
          severity: 'error',
          summary: this.translateService.instant('error'),
          detail: this.translateService.instant(detailsLoading
            ? 'strategicDetailsLoading'
            : 'strategicDetailsLoadError')
        });
        return;
      }
      if (this.hasInvalidProjectGoals()) {
        this.messageService.add({
          severity: 'error',
          summary: this.translateService.instant('error'),
          detail: this.translateService.instant('strategicProjectGoalOutOfRange')
        });
        return;
      }
    }
    this.saving = true;
    this.indicatorService.setProjectIndicatorLinksSaving(this.idWorkpack, this.category, true);
    const selectedItems = this.catalog.filter(option => this.selectedIds.has(option.id));
    let added = 0;
    try {
      const navigated = await this.returnToIndicators();
      if (!navigated) {
        this.messageService.add({
          severity: 'error',
          summary: this.translateService.instant('error'),
          detail: this.translateService.instant('indicatorLinkNavigationError')
        });
        this.saveButton?.showButton();
        return;
      }
      for (const item of selectedItems) {
        const response = await this.indicatorService.createProjectIndicatorLink(this.idWorkpack, {
          category: this.category,
          externalId: item.id,
          name: item.name,
          description: item.description,
          ...(this.category === 'STRATEGIC' ? { projectGoals: this.projectGoalValues[item.id] || {} } : {})
        });
        if (!response?.success) {
          throw new Error(response?.message || 'Unable to link catalog item');
        }
        added += 1;
      }
      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('success'),
        detail: this.translateService.instant(this.category === 'ODS' ? 'odsLinkAdded' : 'indicatorLinkAdded')
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('error'),
        detail: added
          ? `${added} ${this.translateService.instant('indicatorsAddedBeforeError')}`
          : error?.error?.message || error?.message || this.translateService.instant('messages.catalogLoadError')
      });
    } finally {
      this.indicatorService.setProjectIndicatorLinksSaving(this.idWorkpack, this.category, false);
      this.saving = false;
    }
  }

  async returnToIndicators(): Promise<boolean> {
    this.routeReuseStrategy.prepareWorkpackReturn();
    try {
      const navigated = await this.router.navigate(['/workpack'], {
        queryParams: { id: this.idWorkpack, idPlan: this.idPlan || undefined },
        queryParamsHandling: 'merge'
      });
      this.routeReuseStrategy.finishWorkpackReturn(navigated);
      return navigated;
    } catch (error) {
      this.routeReuseStrategy.finishWorkpackReturn(false);
      throw error;
    }
  }
}
