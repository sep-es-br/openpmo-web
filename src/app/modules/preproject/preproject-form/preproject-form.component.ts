import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MessageService, SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { MenuService } from 'src/app/shared/services/menu.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { OrganizationService } from 'src/app/shared/services/organization.service';
import { PreprojectService } from 'src/app/shared/services/preproject.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';
import {
  PreprojectCriteriaConfigService,
  PreprojectCriterion
} from 'src/app/shared/services/preproject-criteria-config.service';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IOrganization } from 'src/app/shared/interfaces/IOrganization';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { IPropertyListItem } from 'src/app/shared/interfaces/IPropertyListItem';
import { IBreadcrumb } from 'src/app/shared/interfaces/IBreadcrumb';
import {
  ICreatePreprojectRequest,
  IPreproject,
  IPreprojectCriteriaListValue,
  IPreprojectCriteriaGroupValue,
  IPreprojectCriteriaSelectionValue,
  IPreprojectCriteriaTabValues,
  IPreprojectCriteriaValue,
  IPreprojectEvaluation,
  IUpdatePreprojectRequest
} from 'src/app/shared/interfaces/IPreproject';
import { ITabViewScrolled } from 'src/app/shared/components/tabview-scrolled/tabview-scrolled.component';
import { IEditableCardField } from 'src/app/shared/components/editable-card-item/editable-card-item.component';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';

interface DeliveryCardItem extends ICardItem {
  deliveryIndex?: number;
  displayItemId?: string;
}

interface CriteriaListDisplayItem extends IPropertyListItem {
  foreignKey?: string;
}

@Component({
  selector: 'app-preproject-form',
  templateUrl: './preproject-form.component.html',
  styleUrls: ['./preproject-form.component.scss']
})
export class PreprojectFormComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) private saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) private cancelButton: CancelButtonComponent;

  private readonly destroy$ = new Subject<void>();
  private syncingForm = false;
  private propertiesDirty = false;
  private criteriaDirtyByTab: { [id: number]: boolean } = {};
  private criteriaValuesByTab: { [id: number]: IPreprojectCriteriaTabValues } = {};
  private nextTemporaryListItemId = -1;

  idOffice: string | null;
  idPreproject: number | null = null;
  idPreProjectModel: number | null = null;

  isLoading = false;
  isModelLoading = false;
  isEvaluationLoading = false;
  formIsSaving = false;
  displayModeAll = 'grid';
  criteriaLoadingByTab: { [id: number]: boolean } = {};
  criteriaErrorsByTab: { [id: number]: boolean } = {};

  organizations: SelectItem[] = [];
  criteriaGuides: PreprojectCriterion[] = [];
  evaluation: IPreprojectEvaluation | null = null;
  tabs: ITabViewScrolled[] = [{ key: 'properties', menu: 'properties' }];
  selectedTab: ITabViewScrolled = this.tabs[0];
  tabsVersion = 1;

  displayListItemDialog = false;
  newListItemLabel = '';
  pendingListProperty: IWorkpackModelProperty | null = null;

  readonly editableDeliveryFields: IEditableCardField[] = [{
    controlName: 'name',
    label: 'name',
    type: 'textarea',
    required: true,
    rows: 3,
    ellipsisAfter: 120
  }];

  deliveryCardItems: DeliveryCardItem[] = [{
    typeCardItem: 'newCardItem',
    icon: IconsEnum.Plus
  }];

  readonly cardProperties: ICard = {
    cardTitle: 'properties',
    collapseble: false,
    toggleable: false,
    initialStateToggle: false,
    initialStateCollapse: false,
    showCreateNemElementButton: false
  };

  form: FormGroup;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly menuService: MenuService,
    private readonly officeService: OfficeService,
    private readonly organizationService: OrganizationService,
    private readonly preprojectService: PreprojectService,
    private readonly preprojectCriteriaConfigService: PreprojectCriteriaConfigService,
    private readonly workpackService: WorkpackService,
    private readonly workpackShowTabviewService: WorkpackShowTabviewService,
    private readonly formBuilder: FormBuilder,
    private readonly translateService: TranslateService,
    private readonly messageService: MessageService
  ) {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      fullName: ['', [Validators.required, Validators.maxLength(600)]],
      organization: [null, Validators.required],
      expectedCompletion: [null],
      deliveries: this.formBuilder.array([])
    });
  }

  ngOnInit(): void {
    this.idOffice = this.route.snapshot.queryParamMap.get('idOffice');
    const idPreproject = Number(this.route.snapshot.queryParamMap.get('idPreproject'));
    this.idPreproject = Number.isFinite(idPreproject) && idPreproject > 0 ? idPreproject : null;

    this.menuService.nextIsPlanMenu(false);
    this.workpackService.nextPendingChanges(false);
    this.workpackShowTabviewService.next(true);
    this.refreshDeliveryCardItems();

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.syncingForm && this.selectedTab?.key === 'properties') {
          this.propertiesDirty = true;
          this.syncPendingChanges();
        }
      });

    void this.initialize();
  }

  ngOnDestroy(): void {
    this.workpackService.nextPendingChanges(false);
    this.workpackShowTabviewService.next(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  get formTitleTranslationKey(): string {
    return this.idPreproject ? 'editPreproject' : 'newPreproject';
  }

  get deliveryForms(): FormArray {
    return this.form.get('deliveries') as FormArray;
  }

  get selectedCriteriaGuide(): PreprojectCriterion | undefined {
    const criterionId = this.getSelectedCriteriaTabId();
    return criterionId
      ? this.criteriaGuides.find(criterion => Number(criterion.id) === criterionId)
      : undefined;
  }

  get isSelectedCriteriaLoading(): boolean {
    const criterionId = this.getSelectedCriteriaTabId();
    return !!criterionId && this.criteriaLoadingByTab[criterionId] === true;
  }

  back(): void {
    void this.router.navigate(['/preproject'], {
      queryParams: this.idOffice ? { idOffice: this.idOffice } : undefined
    });
  }

  async changeTab(event: { tabs: ITabViewScrolled }): Promise<void> {
    const previousTab = this.selectedTab;
    if (event.tabs?.key !== previousTab?.key && this.hasTabChanges(previousTab)) {
      await this.discardTabChanges(previousTab);
    }
    this.selectedTab = event.tabs;
    this.refreshActionButtons();
    if (this.selectedTab?.key === 'evaluation') {
      void this.loadEvaluation();
      return;
    }
    const criterion = this.selectedCriteriaGuide;
    if (criterion) {
      void this.loadCriteriaValues(criterion);
    }
  }

  async save(): Promise<void> {
    if (this.selectedTab?.key === 'properties') {
      await this.saveProperties();
      return;
    }

    const criterion = this.selectedCriteriaGuide;
    if (criterion) {
      await this.saveCriteriaValues(criterion);
    }
  }

  async undo(): Promise<void> {
    if (this.selectedTab?.key === 'evaluation') {
      return;
    }
    await this.discardTabChanges(this.selectedTab);
  }

  getDeliveryForm(index: number | undefined): FormGroup {
    return this.deliveryForms.at(index || 0) as FormGroup;
  }

  removeDelivery(index: number): void {
    this.deliveryForms.removeAt(index);
    this.refreshDeliveryCardItems();
  }

  addDelivery(): void {
    this.deliveryForms.push(this.formBuilder.group({
      name: ['', Validators.required]
    }));
    this.refreshDeliveryCardItems();
  }

  requestListPropertyItem(property: IWorkpackModelProperty): void {
    this.pendingListProperty = property;
    this.newListItemLabel = '';
    this.displayListItemDialog = true;
  }

  confirmListPropertyItem(): void {
    const label = this.newListItemLabel.trim();
    if (!label || !this.pendingListProperty) {
      return;
    }

    const item: CriteriaListDisplayItem = {
      id: this.nextTemporaryListItemId--,
      name: label,
      fullName: label,
      foreignKey: `criteria-${this.pendingListProperty.id}-${Date.now()}`
    };
    this.pendingListProperty.selectedListItems = [
      ...(this.pendingListProperty.selectedListItems || []),
      item
    ];
    this.closeListItemDialog();
    this.criteriaChanged();
  }

  closeListItemDialog(): void {
    this.displayListItemDialog = false;
    this.newListItemLabel = '';
    this.pendingListProperty = null;
  }

  criteriaChanged(): void {
    const criterionId = this.getSelectedCriteriaTabId();
    if (!criterionId) {
      return;
    }
    this.criteriaDirtyByTab[criterionId] = true;
    this.syncPendingChanges();
    this.saveButton?.showButton();
    this.cancelButton?.showButton();
  }

  private async initialize(): Promise<void> {
    this.isLoading = true;
    try {
      await Promise.all([this.initBreadcrumb(), this.loadOrganizations()]);
      if (this.idPreproject) {
        await this.loadPreproject();
      } else {
        this.form.markAsPristine();
        this.propertiesDirty = false;
        this.syncPendingChanges();
      }
    } catch (error) {
      this.showError(error, 'Não foi possível carregar o anteprojeto.');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadOrganizations(): Promise<void> {
    const idOffice = Number(this.idOffice);
    if (!Number.isFinite(idOffice) || idOffice <= 0) {
      return;
    }
    const response = await this.organizationService.GetAll({ 'id-office': idOffice });
    this.organizations = response.success
      ? (response.data || [])
        .sort((first: IOrganization, second: IOrganization) => first.name.localeCompare(second.name))
        .map((organization: IOrganization) => ({ label: organization.name, value: organization.id }))
      : [];
  }

  private async loadPreproject(): Promise<void> {
    if (!this.idPreproject) {
      return;
    }
    const response = await this.preprojectService.findById(this.idPreproject);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Preproject not found');
    }

    this.applyPreproject(response.data);
    await this.loadModelCriteria(response.data.idPreProjectModel);
  }

  private applyPreproject(preproject: IPreproject): void {
    this.idPreProjectModel = preproject.idPreProjectModel;
    this.syncingForm = true;
    this.form.patchValue({
      name: preproject.name,
      fullName: preproject.fullName,
      organization: preproject.idOrganization,
      expectedCompletion: this.parseLocalDate(preproject.expectedCompletionDate)
    }, { emitEvent: false });
    this.setDeliveries(preproject.expectedDeliveries);
    this.form.markAsPristine();
    this.syncingForm = false;
    this.propertiesDirty = false;
    this.syncPendingChanges();
  }

  private async loadModelCriteria(idPreProjectModel: number): Promise<void> {
    this.isModelLoading = true;
    try {
      this.criteriaGuides = await this.preprojectCriteriaConfigService
        .getCriteriaByModelId(idPreProjectModel);
      this.tabs = [
        { key: 'properties', menu: 'properties' },
        ...this.criteriaGuides.map(criterion => ({
          key: `criterion-${criterion.id}`,
          menu: criterion.name || criterion.label
        })),
        { key: 'evaluation', menu: 'evaluation' }
      ];
      this.selectedTab = this.tabs[0];
      this.tabsVersion += 1;
    } catch (error) {
      this.criteriaGuides = [];
      this.tabs = [{ key: 'properties', menu: 'properties' }];
      this.showError(error, 'Não foi possível carregar o modelo do anteprojeto.');
    } finally {
      this.isModelLoading = false;
    }
  }

  private async loadCriteriaValues(criterion: PreprojectCriterion, force = false): Promise<void> {
    if (!this.idPreproject || (!force && this.criteriaValuesByTab[criterion.id])) {
      return;
    }

    this.criteriaLoadingByTab[criterion.id] = true;
    this.criteriaErrorsByTab[criterion.id] = false;
    try {
      const response = await this.preprojectService
        .findCriteriaTabValues(this.idPreproject, criterion.id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Criteria values not found');
      }
      this.criteriaValuesByTab[criterion.id] = response.data;
      this.mergeCriteriaValues(criterion.id, response.data);
    } catch (error) {
      this.criteriaErrorsByTab[criterion.id] = true;
      this.showError(error, 'Não foi possível carregar os valores deste critério.');
    } finally {
      this.criteriaLoadingByTab[criterion.id] = false;
    }
  }

  private async loadEvaluation(): Promise<void> {
    if (!this.idPreproject || this.isEvaluationLoading) {
      return;
    }
    this.isEvaluationLoading = true;
    try {
      const response = await this.preprojectService.findEvaluation(this.idPreproject);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Evaluation not found');
      }
      this.evaluation = response.data;
    } catch (error) {
      this.evaluation = null;
      this.showError(error, 'Não foi possível carregar a avaliação.');
    } finally {
      this.isEvaluationLoading = false;
    }
  }

  private mergeCriteriaValues(
    criterionId: number,
    tabValues: IPreprojectCriteriaTabValues
  ): void {
    const valuesByPropertyModelId = new Map<number, IPreprojectCriteriaValue>(
      (tabValues.values || []).map(value => [value.idPropertyModel, value])
    );
    this.criteriaGuides = this.criteriaGuides.map(criterion => {
      if (criterion.id !== criterionId) {
        return criterion;
      }
      return {
        ...criterion,
        properties: (criterion.properties || []).map(property =>
          this.mergePropertyValue(property, valuesByPropertyModelId.get(property.id))),
        groups: (criterion.groups || []).map(group => {
          const groupValue = (tabValues.values || [])
            .find(value => value.type === 'CriteriaGroup' && value.idPropertyModel === group.id) as
            IPreprojectCriteriaGroupValue | undefined;
          const legacyGroupValue = (tabValues.groups || [])
            .find(value => value.idPropertyModel === group.id || value.id === group.id);
          return {
            ...group,
            currentEnabled: groupValue
              ? groupValue.active
              : legacyGroupValue ? legacyGroupValue.active : group.currentEnabled,
            properties: (group.properties || []).map(property =>
              this.mergePropertyValue(property, valuesByPropertyModelId.get(property.id)))
          };
        })
      };
    });
  }

  private mergePropertyValue(
    property: IWorkpackModelProperty,
    value: IPreprojectCriteriaValue | undefined
  ): IWorkpackModelProperty {
    if (!value) {
      return { ...property };
    }
    if (value.type === 'CriteriaGroup') {
      return { ...property };
    }
    if (value.type === 'CriteriaList') {
      return {
        ...property,
        selectedListItems: (value.items || []).map((item, index) => ({
          id: item.id || this.nextTemporaryListItemId--,
          name: item.label || '',
          fullName: item.label || '',
          foreignKey: item.foreignKey || `criteria-${property.id}-${index + 1}`
        } as CriteriaListDisplayItem))
      };
    }

    const selectedOptionIds = (value as IPreprojectCriteriaSelectionValue).selectedOptionIds || [];
    const selectedLabels = (property.acceptedOptions || [])
      .filter(option => selectedOptionIds.includes(option.id))
      .map(option => option.label);
    return {
      ...property,
      currentValue: property.multipleSelection === false
        ? (selectedLabels[0] || null)
        : selectedLabels
    };
  }

  private async saveProperties(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const idOffice = Number(this.idOffice);
    if (!this.idPreproject && (!Number.isFinite(idOffice) || idOffice <= 0)) {
      this.showError(null, 'Escritório inválido.');
      return;
    }

    this.formIsSaving = true;
    try {
      const commonRequest = this.buildPropertiesRequest();
      const response = this.idPreproject
        ? await this.preprojectService.update(this.idPreproject, commonRequest)
        : await this.preprojectService.create({ ...commonRequest, idOffice } as ICreatePreprojectRequest);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to save preproject');
      }

      this.showSuccess();
      if (!this.idPreproject) {
        this.idPreproject = response.data.id;
        this.idPreProjectModel = response.data.idPreProjectModel;
        this.propertiesDirty = false;
        this.form.markAsPristine();
        this.location.replaceState(
          '/preproject/edit',
          `idOffice=${encodeURIComponent(this.idOffice || '')}&idPreproject=${this.idPreproject}`
        );
        await this.loadModelCriteria(this.idPreProjectModel);
        await this.initBreadcrumb();
      } else {
        this.applyPreproject(response.data);
      }
    } catch (error) {
      this.showError(error, 'Não foi possível salvar as propriedades do anteprojeto.');
    } finally {
      this.formIsSaving = false;
      this.syncPendingChanges();
      this.refreshActionButtons();
    }
  }

  private async saveCriteriaValues(criterion: PreprojectCriterion): Promise<void> {
    if (!this.idPreproject) {
      return;
    }
    if (!this.criteriaValuesByTab[criterion.id]) {
      await this.loadCriteriaValues(criterion);
    }
    const currentValues = this.criteriaValuesByTab[criterion.id];
    if (!currentValues) {
      return;
    }

    this.formIsSaving = true;
    try {
      const values = this.buildCriteriaRequest(criterion, currentValues);
      const groups = this.buildCriteriaGroupsRequest(criterion, currentValues);
      const response = await this.preprojectService.saveCriteriaTabValues(
        this.idPreproject,
        criterion.id,
        { values, groups }
      );
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to save criteria');
      }
      this.criteriaValuesByTab[criterion.id] = response.data;
      this.mergeCriteriaValues(criterion.id, response.data);
      this.criteriaDirtyByTab[criterion.id] = false;
      this.showSuccess();
    } catch (error) {
      this.showError(error, 'Não foi possível salvar os valores deste critério.');
    } finally {
      this.formIsSaving = false;
      this.syncPendingChanges();
      this.refreshActionButtons();
    }
  }

  private buildPropertiesRequest(): IUpdatePreprojectRequest {
    const value = this.form.getRawValue();
    return {
      name: String(value.name || '').trim(),
      fullName: String(value.fullName || '').trim(),
      idOrganization: Number(value.organization),
      expectedCompletionDate: this.formatLocalDate(value.expectedCompletion),
      expectedDeliveries: this.deliveryForms.controls
        .map(control => String(control.get('name').value || '').trim())
        .filter(label => !!label)
        .join('\n') || null
    };
  }

  private buildCriteriaRequest(
    criterion: PreprojectCriterion,
    currentValues: IPreprojectCriteriaTabValues
  ): IPreprojectCriteriaValue[] {
    const propertiesById = new Map<number, IWorkpackModelProperty>();
    [...(criterion.properties || []),
      ...(criterion.groups || []).reduce(
        (all, group) => [...all, ...(group.properties || [])],
        [] as IWorkpackModelProperty[]
      )
    ].forEach(property => propertiesById.set(property.id, property));

    return (currentValues.values || []).map(value => {
      if (value.type === 'CriteriaGroup') {
        const group = (criterion.groups || []).find(item => item.id === value.idPropertyModel);
        return {
          ...value,
          active: group ? group.currentEnabled !== false : value.active
        } as IPreprojectCriteriaGroupValue;
      }
      const property = propertiesById.get(value.idPropertyModel);
      if (!property) {
        return value;
      }

      if (value.type === 'CriteriaList') {
        const items = (property.selectedListItems || []).map((item, index) => ({
          foreignKey: (item as CriteriaListDisplayItem).foreignKey
            || `criteria-${property.id}-${index + 1}`,
          label: item.name
        }));
        return { ...value, items } as IPreprojectCriteriaListValue;
      }

      const selectedLabels = Array.isArray(property.currentValue)
        ? (property.currentValue as Array<number | string>)
          .map(selectedValue => String(selectedValue))
        : property.currentValue !== undefined && property.currentValue !== null && property.currentValue !== ''
          ? [String(property.currentValue)]
          : [];
      const selectedOptionIds = (property.acceptedOptions || [])
        .filter(option => selectedLabels.includes(option.label))
        .map(option => option.id)
        .filter((id): id is number => id !== undefined && id !== null);
      return { ...value, selectedOptionIds } as IPreprojectCriteriaSelectionValue;
    });
  }

  private buildCriteriaGroupsRequest(
    criterion: PreprojectCriterion,
    currentValues: IPreprojectCriteriaTabValues
  ): IPreprojectCriteriaGroupValue[] {
    const groupsById = new Map<number, PreprojectCriterion['groups'][number]>();
    (criterion.groups || []).forEach(group => {
      if (group.id) {
        groupsById.set(group.id, group);
      }
    });
    return (currentValues.groups || [])
      .map(group => {
        const modelId = group.idPropertyModel || group.id;
        const modelGroup = groupsById.get(modelId);
        return modelGroup
          ? { id: group.id, idPropertyModel: modelId, active: modelGroup.currentEnabled !== false, type: 'CriteriaGroup' }
          : null;
      })
      .filter((group): group is IPreprojectCriteriaGroupValue => !!group);
  }

  private setDeliveries(expectedDeliveries?: string | null): void {
    this.clearDeliveries();
    (expectedDeliveries || '')
      .split(/\r?\n/)
      .map(label => label.trim())
      .filter(label => !!label)
      .forEach(label => this.deliveryForms.push(this.formBuilder.group({
        name: [label, Validators.required]
      })));
    this.refreshDeliveryCardItems();
  }

  private clearDeliveries(): void {
    while (this.deliveryForms.length) {
      this.deliveryForms.removeAt(0);
    }
  }

  private refreshDeliveryCardItems(): void {
    const cards: DeliveryCardItem[] = this.deliveryForms.controls.map((_delivery, index) => ({
      typeCardItem: 'listItem',
      icon: IconsEnum.Boxes,
      deliveryIndex: index,
      itemId: index + 1,
      displayItemId: `${index + 1}`.padStart(2, '0'),
      menuItems: [{
        label: this.translateService.instant('delete'),
        icon: 'fas fa-trash-alt',
        command: () => this.removeDelivery(index)
      }]
    }));
    cards.push({ typeCardItem: 'newCardItem', icon: IconsEnum.Plus });
    this.deliveryCardItems = cards;
  }

  private getSelectedCriteriaTabId(): number | null {
    const key = this.selectedTab?.key || '';
    if (!key.startsWith('criterion-')) {
      return null;
    }
    const id = Number(key.replace('criterion-', ''));
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private parseLocalDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }
    const [year, month, day] = value.split('-').map(Number);
    return year && month && day ? new Date(year, month - 1, day) : null;
  }

  private formatLocalDate(value: Date | string | null): string | null {
    if (!value) {
      return null;
    }
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private refreshActionButtons(): void {
    const selectedCriterionId = this.getSelectedCriteriaTabId();
    const hasSelectedTabChanges = this.selectedTab?.key === 'properties'
      ? this.propertiesDirty
      : this.selectedTab?.key !== 'evaluation'
        && !!selectedCriterionId && this.criteriaDirtyByTab[selectedCriterionId] === true;
    if (hasSelectedTabChanges) {
      this.saveButton?.showButton();
      this.cancelButton?.showButton();
    } else {
      this.saveButton?.hideButton();
      this.cancelButton?.hideButton();
    }
  }

  private hasTabChanges(tab: ITabViewScrolled | undefined): boolean {
    if (tab?.key === 'properties') {
      return this.propertiesDirty;
    }
    if (!tab?.key?.startsWith('criterion-')) {
      return false;
    }
    const id = Number(tab.key.replace('criterion-', ''));
    return Number.isFinite(id) && this.criteriaDirtyByTab[id] === true;
  }

  private async discardTabChanges(tab: ITabViewScrolled): Promise<void> {
    if (tab.key === 'properties') {
      if (this.idPreproject) {
        const response = await this.preprojectService.findById(this.idPreproject);
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Preproject not found');
        }
        this.applyPreproject(response.data);
      } else {
        this.syncingForm = true;
        this.form.reset();
        this.clearDeliveries();
        this.refreshDeliveryCardItems();
        this.form.markAsPristine();
        this.syncingForm = false;
        this.propertiesDirty = false;
      }
    } else if (tab.key.startsWith('criterion-')) {
      const criterionId = Number(tab.key.replace('criterion-', ''));
      const criterion = this.criteriaGuides.find(item => item.id === criterionId);
      if (criterion) {
        await this.loadCriteriaValues(criterion, true);
        this.criteriaDirtyByTab[criterion.id] = false;
      }
    }
    this.syncPendingChanges();
    this.refreshActionButtons();
  }

  private syncPendingChanges(): void {
    const criteriaHasChanges = Object.keys(this.criteriaDirtyByTab)
      .some(key => this.criteriaDirtyByTab[Number(key)] === true);
    this.workpackService.nextPendingChanges(this.propertiesDirty || criteriaHasChanges);
  }

  private showSuccess(): void {
    this.messageService.add({
      severity: 'success',
      summary: this.translateService.instant('success'),
      detail: this.translateService.instant('messages.savedSuccessfully')
    });
  }

  private showError(error: any, fallback: string): void {
    const detail = error?.error?.message || error?.message || fallback;
    this.messageService.add({
      severity: 'error',
      summary: this.translateService.instant('error'),
      detail
    });
  }

  private async initBreadcrumb(): Promise<void> {
    const idOffice = Number(this.idOffice);
    const breadcrumbs: IBreadcrumb[] = [];
    if (Number.isFinite(idOffice) && idOffice > 0) {
      const office = await this.officeService.getCurrentOffice(idOffice);
      this.officeService.nextIDOffice(idOffice);
      if (office) {
        breadcrumbs.push({
          key: 'office',
          routerLink: ['/offices', 'office'],
          queryParams: { id: office.id },
          info: office.name,
          tooltip: office.fullName
        });
      }
    }
    breadcrumbs.push(
      {
        key: 'preproject',
        routerLink: ['/preproject'],
        queryParams: this.idOffice ? { idOffice: this.idOffice } : undefined,
        info: 'preproject'
      },
      {
        key: 'preprojectElaboration',
        info: this.formTitleTranslationKey
      }
    );
    this.breadcrumbService.setMenu(breadcrumbs);
  }
}
