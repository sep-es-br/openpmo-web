import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MenuItem, MessageService, SelectItem, TreeNode } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { MenuService } from 'src/app/shared/services/menu.service';
import { PlanService } from 'src/app/shared/services/plan.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { ITabViewScrolled } from 'src/app/shared/components/tabview-scrolled/tabview-scrolled.component';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { IBreadcrumb } from 'src/app/shared/interfaces/IBreadcrumb';
import { TypePropertModelEnum as TypePropertyEnum } from 'src/app/shared/enums/TypePropertModelEnum';
import { IconPropertyWorkpackModelEnum as IconPropertyEnum } from 'src/app/shared/enums/IconPropertyWorkpackModelEnum';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IEditableCardField } from 'src/app/shared/components/editable-card-item/editable-card-item.component';
import { IPropertyListItem } from 'src/app/shared/interfaces/IPropertyListItem';
import { TypeOrganization } from 'src/app/shared/enums/TypeOrganization';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { ITreeViewScopePlan, ITreeViewScopeWorkpack } from 'src/app/shared/interfaces/ITreeScopePersons';
import { IconsTypeWorkpackEnum, IconsTypeWorkpackModelEnum } from 'src/app/shared/enums/IconsTypeWorkpackModelEnum';
import { PlanBreakdownStructureService } from 'src/app/shared/services/plan-breakdown-structure.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import {
  PreprojectEvaluationConfigService,
  PreprojectEvaluationOperation
} from 'src/app/shared/services/preproject-evaluation-config.service';
import {
  PreprojectCriteriaConfigService,
  PreprojectCriterion,
  PreprojectCriterionGroup
} from 'src/app/shared/services/preproject-criteria-config.service';

type PropertyTarget = 'relevance' | 'viability';

interface DeliveryCardItem extends ICardItem {
  deliveryIndex?: number;
  displayItemId?: string;
}

interface EvaluationCriterionRow {
  name: string;
  score: number;
}

const PREPROJECT_MOCK_DATA: { [id: number]: { name: string; fullName: string } } = {
  199: { name: 'Culturas Populares', fullName: 'Valorização das Culturas Populares' },
  204: { name: 'Modernização TVE', fullName: 'Modernização TVE e Rad ES' },
  209: { name: 'TVE Revista', fullName: 'TVE Revista' },
  211: { name: 'PE 2023-2026', fullName: 'PE 2023-2026' }
};

@Component({
  selector: 'app-preproject-form',
  templateUrl: './preproject-form.component.html',
  styleUrls: ['./preproject-form.component.scss']
})
export class PreprojectFormComponent implements OnInit, OnDestroy {

  private readonly destroy$: Subject<void> = new Subject<void>();

  idPlan: string | null;

  idPreproject: number | null = null;

  isLoading: boolean = false;

  formIsSaving: boolean = false;

  displayModeAll: string = 'grid';

  readonly editableDeliveryFields: IEditableCardField[] = [
    {
      controlName: 'name',
      label: 'name',
      type: 'textarea',
      required: true,
      rows: 3,
      ellipsisAfter: 120
    }
  ];

  deliveryCardItems: DeliveryCardItem[] = [{
    typeCardItem: 'newCardItem',
    icon: IconsEnum.Plus
  }];

  form: FormGroup;

  tabs: ITabViewScrolled[] = [
    { key: 'properties', menu: 'properties' },
    { key: 'evaluation', menu: 'evaluation' }
  ];

  tabsVersion: number = 1;

  criteriaGuides: PreprojectCriterion[] = [];

  criteriaOfficeId: number | null = null;

  selectedTab: ITabViewScrolled = this.tabs[0];

  evaluationOperation: PreprojectEvaluationOperation = 'AVERAGE';

  readonly evaluationCardProperties: ICard = {
    cardTitle: 'evaluation',
    collapseble: false,
    toggleable: false,
    initialStateToggle: false,
    initialStateCollapse: false
  };


  collapsedEvaluationCriteria: { [criterionId: number]: boolean } = {};

  availablePlans: SelectItem[] = [];

  private officePlans: IPlan[] = [];

  planStructure: TreeNode[] = [];

  isPlanStructureLoading: boolean = false;

  private planStructureRequestVersion: number = 0;

  selectedPlanPosition: TreeNode[] = [];

  cardProperties: ICard = {
    cardTitle: 'properties',
    collapseble: false,
    toggleable: false,
    initialStateToggle: false,
    initialStateCollapse: false,
    showCreateNemElementButton: false
  };

  /** Propriedades configuradas na aba de Relevância */
  relevanceProperties: IWorkpackModelProperty[] = [];

  /** Propriedades configuradas na aba de Viabilidade */
  viabilityProperties: IWorkpackModelProperty[] = [];

  /** Menu de tipos de propriedade para a aba Relevância */
  menuRelevanceProperties: MenuItem[] = [];

  /** Menu de tipos de propriedade para a aba Viabilidade */
  menuViabilityProperties: MenuItem[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly menuService: MenuService,
    private readonly planService: PlanService,
    private readonly planBreakdownStructureService: PlanBreakdownStructureService,
    private readonly officeService: OfficeService,
    private readonly workpackService: WorkpackService,
    private readonly preprojectEvaluationConfigService: PreprojectEvaluationConfigService,
    private readonly preprojectCriteriaConfigService: PreprojectCriteriaConfigService,
    private readonly workpackShowTabviewService: WorkpackShowTabviewService,
    private readonly formBuilder: FormBuilder,
    private readonly translateService: TranslateService,
    private readonly messageService: MessageService
  ) {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: ['', Validators.required],
      organization: [null, Validators.required],
      expectedCompletion: [null],
      selectPreproject: [false],
      availablePlan: [{ value: null, disabled: true }],
      planPosition: [{ value: null, disabled: true }],
      evaluationNotes: [{ value: '', disabled: true }],
      deliveries: this.formBuilder.array([])
    });
  }

  ngOnInit(): void {
    // A elaboração possui seu próprio estado de edição e não deve herdar
    // alterações pendentes deixadas pelo módulo de planos nas abas compartilhadas.
    this.workpackService.nextPendingChanges(false);
    this.idPlan = this.route.snapshot.queryParamMap.get('idPlan');
    const idPreproject: number = Number(this.route.snapshot.queryParamMap.get('idPreproject'));
    this.idPreproject = Number.isFinite(idPreproject) && idPreproject > 0 ? idPreproject : null;
    this.loadPreproject();
    this.restoreEvaluationSelection();
    this.configureEvaluationSelection(this.form.get('selectPreproject').value, false);
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.persistEvaluationSelection());
    this.menuService.nextIsPlanMenu(true);
    this.workpackShowTabviewService.next(true);

    this.refreshDeliveryCardItems();
    void this.initBreadcrumb();
  }

  ngOnDestroy(): void {
    this.workpackShowTabviewService.next(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  back(): void {
    void this.router.navigate(['/preproject'], {
      queryParams: this.idPlan ? { idPlan: this.idPlan } : undefined
    });
  }

  changeTab(event: { tabs: ITabViewScrolled }): void {
    this.selectedTab = event.tabs;
    this.updateCardPropertyMenu();
  }

  get evaluationOperationTranslationKey(): string {
    return this.evaluationOperation === 'SUM' ? 'sum' : 'average';
  }

  get formTitleTranslationKey(): string {
    return this.idPreproject ? 'editPreproject' : 'newPreproject';
  }

  getEvaluationRows(criterion: PreprojectCriterion): EvaluationCriterionRow[] {
    const directRows: EvaluationCriterionRow[] = (criterion.properties || []).map(property => ({
      name: property.label || property.name,
      score: this.getPropertyScore(property)
    }));
    const groupRows: EvaluationCriterionRow[] = (criterion.groups || [])
      .sort((first, second) => first.sortIndex - second.sortIndex)
      .map(group => ({
        name: group.title,
        score: this.getGroupScore(group)
      }));
    return [...directRows, ...groupRows];
  }

  getCriterionScore(criterion: PreprojectCriterion): number {
    const weightedScores: Array<{ score: number; weight: number }> = [
      ...(criterion.properties || []).map(property => ({
        score: this.getPropertyScore(property),
        weight: property.weight || 1
      })),
      ...(criterion.groups || []).map(group => ({
        score: this.getGroupScore(group),
        weight: group.weight || 1
      }))
    ];
    return this.applyOperation(weightedScores, criterion.operation);
  }

  getCriterionMaximumScore(criterion: PreprojectCriterion): number {
    const weightedScores: Array<{ score: number; weight: number }> = [
      ...(criterion.properties || []).map(property => ({
        score: this.getPropertyMaximumScore(property),
        weight: property.weight || 1
      })),
      ...(criterion.groups || []).map(group => ({
        score: this.getGroupMaximumScore(group),
        weight: group.weight || 1
      }))
    ];
    return this.applyOperation(weightedScores, criterion.operation);
  }

  getCriterionContribution(criterion: PreprojectCriterion): number {
    const maximumScore: number = this.getCriterionMaximumScore(criterion);
    return maximumScore
      ? (this.getCriterionScore(criterion) / maximumScore) * (criterion.weight || 1)
      : 0;
  }

  getCriterionOperationTranslationKey(criterion: PreprojectCriterion): string {
    return criterion.operation === 'SUM' ? 'sum' : 'average';
  }

  get finalEvaluationScore(): number {
    return this.criteriaGuides
      .reduce((total, criterion) => total + this.getCriterionContribution(criterion), 0);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.persistCriteriaValues();
    this.persistEvaluationSelection();
    this.formIsSaving = true;
    setTimeout(() => {
      this.formIsSaving = false;
      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('success') || 'Sucesso',
        detail: this.translateService.instant('messages.savedSuccessfully') || 'Salvo com sucesso'
      });
      this.back();
    }, 1000);
  }

  get deliveryForms(): FormArray {
    return this.form.get('deliveries') as FormArray;
  }

  get preprojectSelectionEnabled(): boolean {
    return this.form.get('selectPreproject').value === true;
  }

  handlePreprojectSelectionChange(enabled: boolean): void {
    this.configureEvaluationSelection(enabled, true);
  }

  async handleAvailablePlanChange(planId: number | string): Promise<void> {
    this.planStructure = [];
    this.selectedPlanPosition = [];
    this.form.get('planPosition').reset(null);

    await this.loadSelectedPlanStructure(planId, []);
  }

  handlePlanPositionSelect(event: { node: TreeNode }): void {
    if (!this.preprojectSelectionEnabled || event.node?.selectable === false) {
      return;
    }
    this.updateSelectedPlanPositions();
    this.form.get('planPosition').markAsDirty();
  }

  handlePlanPositionUnselect(): void {
    if (!this.preprojectSelectionEnabled) {
      return;
    }
    this.updateSelectedPlanPositions();
    this.form.get('planPosition').markAsDirty();
  }

  async handlePlanNodeExpand(event: { node: TreeNode }): Promise<void> {
    if (!this.preprojectSelectionEnabled) {
      return;
    }
    await this.planBreakdownStructureService.expandPlanNode(event);
    event.node.children = (event.node.children || [])
      .map(child => this.mapPlanStructureNode(child));
  }

  private updateSelectedPlanPositions(): void {
    const positions: string[] = (this.selectedPlanPosition || [])
      .filter((node: TreeNode) => node?.data)
      .map((node: TreeNode) => String(node.data));
    const planPositionControl = this.form.get('planPosition');
    planPositionControl.setValue(positions);
    planPositionControl.markAsTouched();
  }

  private refreshDeliveryCardItems(): void {
    const cards: DeliveryCardItem[] = this.deliveryForms.controls.map((_delivery, index: number) => ({
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

    cards.push({
      typeCardItem: 'newCardItem',
      icon: IconsEnum.Plus
    });

    this.deliveryCardItems = cards;
  }

  private loadPreproject(): void {
    if (!this.idPreproject) {
      return;
    }

    const preproject = PREPROJECT_MOCK_DATA[this.idPreproject];
    if (preproject) {
      this.form.patchValue(preproject);
    }
  }

  trackByDelivery(index: number): number {
    return index;
  }

  getDeliveryForm(index: number | undefined): FormGroup {
    return this.deliveryForms.at(index || 0) as FormGroup;
  }

  removeDelivery(index: number): void {
    this.deliveryForms.removeAt(index);
    this.form.markAsDirty();
    this.refreshDeliveryCardItems();
  }

  addDelivery(): void {
    this.deliveryForms.push(this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]]
    }));
    this.form.markAsDirty();
    this.refreshDeliveryCardItems();
  }


  addProperty(type: string, target: PropertyTarget): void {
    const list: IWorkpackModelProperty[] =
      target === 'relevance' ? this.relevanceProperties : this.viabilityProperties;

    const newProperty: IWorkpackModelProperty = {
      type,
      active: true,
      label: '',
      name: '',
      sortIndex: list.length + 1,
      fullLine: true,
      required: false,
      multipleSelection: false,
      isCollapsed: false,
      sectorsList: type === TypePropertyEnum.OrganizationSelectionModel
        ? [
          TypeOrganization.Private.toUpperCase(),
          TypeOrganization.Public.toUpperCase(),
          TypeOrganization.Third.toUpperCase()
        ]
        : [],
      selectedLocalities: type === TypePropertyEnum.LocalitySelectionModel
        ? this.translateService.instant('selectDefaultValue')
        : undefined,
      showIconButtonSelectLocality: type === TypePropertyEnum.LocalitySelectionModel
    };

    this.checkProperty(newProperty);

    if (target === 'relevance') {
      this.relevanceProperties = [...this.relevanceProperties, newProperty];
    } else {
      this.viabilityProperties = [...this.viabilityProperties, newProperty];
    }
  }

  checkProperty(property: IWorkpackModelProperty): void {
    let requiredFields: string[] = ['name', 'label', 'sortIndex'];

    switch (property.type) {
      case TypePropertyEnum.LocalitySelectionModel:
        requiredFields = [...requiredFields, 'idDomain', 'multipleSelection'];
        break;

      case TypePropertyEnum.OrganizationSelectionModel:
        requiredFields = [...requiredFields, 'multipleSelection', 'sectors'];
        property.sectors = (property.sectorsList || [])
          .map((sec: string) => sec.toLowerCase())
          .join(',');
        break;

      case TypePropertyEnum.SelectionModel:
        requiredFields = [...requiredFields, 'possibleValuesOptions', 'multipleSelection'];
        break;

      case TypePropertyEnum.NumberModel:
        requiredFields = [...requiredFields, 'precision'];
        property.precision = 3;
        break;

      default:
        break;
    }

    property.requiredFields = requiredFields;
    property.viewOnly = false;
    property.obligatory = false;
  }


  propertyChanged(event: { property: IWorkpackModelProperty }): void {
    if (event?.property) {
      this.relevanceProperties = [...this.relevanceProperties];
      this.viabilityProperties = [...this.viabilityProperties];
    }
  }

  criteriaChanged(): void {
    this.form.markAsDirty();
    this.persistCriteriaValues();
  }

  get selectedCriteriaGuide(): PreprojectCriterion | undefined {
    const criterionId: number = Number((this.selectedTab?.key || '').replace('criterion-', ''));
    return this.criteriaGuides.find((criterion: PreprojectCriterion) => Number(criterion.id) === criterionId);
  }

  isListProperty(property: IWorkpackModelProperty): boolean {
    return property.type === TypePropertyEnum.ChallengeListModel
      || property.type === TypePropertyEnum.SdgListModel;
  }

  getListPropertyIcon(property: IWorkpackModelProperty): string {
    return property.type === TypePropertyEnum.SdgListModel
      ? IconsEnum.Cog
      : IconsEnum.Selection;
  }

  updateListPropertyItems(property: IWorkpackModelProperty, items: IPropertyListItem[]): void {
    property.selectedListItems = items;
    this.form.markAsDirty();
    this.propertyChanged({ property });
  }

  requestListPropertyItem(property: IWorkpackModelProperty): void {
    this.propertyChanged({ property });
  }

  deleteProperty(property: IWorkpackModelProperty, target: PropertyTarget): void {
    if (target === 'relevance') {
      this.relevanceProperties = this.relevanceProperties.filter((p: IWorkpackModelProperty) => p !== property);
    } else {
      this.viabilityProperties = this.viabilityProperties.filter((p: IWorkpackModelProperty) => p !== property);
    }
  }

  trackByProperty(index: number): number {
    return index;
  }

  private buildPropertyMenus(): void {
    const propertyTypes: Array<{ type: TypePropertyEnum; labelKey: string }> = [
      { type: TypePropertyEnum.TextModel,                 labelKey: 'textProperty' },
      { type: TypePropertyEnum.TextAreaModel,             labelKey: 'textAreaProperty' },
      { type: TypePropertyEnum.NumberModel,               labelKey: 'numberProperty' },
      { type: TypePropertyEnum.IntegerModel,              labelKey: 'integerProperty' },
      { type: TypePropertyEnum.CurrencyModel,             labelKey: 'currencyProperty' },
      { type: TypePropertyEnum.DateModel,                 labelKey: 'dateProperty' },
      { type: TypePropertyEnum.ToggleModel,               labelKey: 'toggleProperty' },
      { type: TypePropertyEnum.SelectionModel,            labelKey: 'selectionProperty' },
      { type: TypePropertyEnum.LocalitySelectionModel,    labelKey: 'localitySelectionProperty' },
      { type: TypePropertyEnum.OrganizationSelectionModel,labelKey: 'organizationSelectionProperty' },
      { type: TypePropertyEnum.UnitSelectionModel,        labelKey: 'unitSelectionProperty' },
      { type: TypePropertyEnum.ChallengeListModel,        labelKey: 'challengeList' },
      { type: TypePropertyEnum.SdgListModel,              labelKey: 'sdgList' },
    ];

    const buildMenu = (target: PropertyTarget): MenuItem[] =>
      propertyTypes.map(({ type, labelKey }) => ({
        label: this.translateService.instant(labelKey),
        icon: IconPropertyEnum[type] || 'fas fa-cube',
        command: () => this.addProperty(type, target)
      }));

    this.menuRelevanceProperties = buildMenu('relevance');
    this.menuViabilityProperties = buildMenu('viability');
    this.updateCardPropertyMenu();
  }

  private updateCardPropertyMenu(): void {
    this.cardProperties.showCreateNemElementButton = false;
    this.cardProperties.createNewElementMenuItems = undefined;
  }

  private async loadCriteriaGuides(idOffice: number): Promise<void> {
    this.criteriaGuides = this.restoreCriteriaValues(await this.getActiveCriteriaGuides(idOffice));

    this.tabs = [
      { key: 'properties', menu: 'properties' },
      ...this.criteriaGuides.map((criterion: PreprojectCriterion) => ({
        key: `criterion-${criterion.id}`,
        menu: criterion.name
      })),
      { key: 'evaluation', menu: 'evaluation' }
    ];
    this.tabsVersion += 1;
  }

  private async getActiveCriteriaGuides(idOffice: number): Promise<PreprojectCriterion[]> {
    const criteria = await this.preprojectCriteriaConfigService.getCriteria(idOffice);
    return criteria
      .filter((criterion: PreprojectCriterion) => criterion.active !== false)
      .sort((first: PreprojectCriterion, second: PreprojectCriterion) => first.position - second.position);
  }

  private persistCriteriaValues(): void {
    localStorage.setItem(this.getCriteriaValuesStorageKey(), JSON.stringify(this.criteriaGuides));
  }

  private restoreCriteriaValues(criteria: PreprojectCriterion[]): PreprojectCriterion[] {
    const storedValue: string | null = localStorage.getItem(this.getCriteriaValuesStorageKey());
    if (!storedValue) {
      return criteria;
    }

    try {
      const storedCriteria: PreprojectCriterion[] = JSON.parse(storedValue);
      criteria.forEach((criterion: PreprojectCriterion) => {
        const storedCriterion: PreprojectCriterion | undefined = storedCriteria
          .find((stored: PreprojectCriterion) => stored.id === criterion.id);
        if (!storedCriterion) {
          return;
        }

        this.restorePropertyValues(criterion.properties, storedCriterion.properties);
        criterion.groups.forEach(group => {
          const storedGroup = storedCriterion.groups.find(candidate =>
            candidate.sortIndex === group.sortIndex && candidate.title === group.title);
          if (storedGroup) {
            group.currentEnabled = storedGroup.currentEnabled;
            this.restorePropertyValues(group.properties, storedGroup.properties);
          }
        });
      });
      return criteria;
    } catch {
      return criteria;
    }
  }

  private restorePropertyValues(
    properties: IWorkpackModelProperty[],
    storedProperties: IWorkpackModelProperty[]
  ): void {
    properties.forEach((property: IWorkpackModelProperty) => {
      const storedProperty: IWorkpackModelProperty | undefined = storedProperties.find(candidate =>
        candidate.type === property.type
        && candidate.sortIndex === property.sortIndex
        && candidate.name === property.name);
      if (!storedProperty) {
        return;
      }

      property.currentValue = storedProperty.currentValue;
      property.currentSelectedValue = storedProperty.currentSelectedValue;
      property.currentSelectedValues = storedProperty.currentSelectedValues;
      property.currentLocalitiesSelected = storedProperty.currentLocalitiesSelected;
      property.selectedListItems = storedProperty.selectedListItems;
    });
  }

  private getCriteriaValuesStorageKey(): string {
    const preprojectKey: string = this.idPreproject ? String(this.idPreproject) : 'new';
    return `openpmo.preproject.values.${this.idPlan || 'no-plan'}.${preprojectKey}`;
  }

  private configureEvaluationSelection(enabled: boolean, markAsDirty: boolean): void {
    const availablePlanControl = this.form.get('availablePlan');
    const planPositionControl = this.form.get('planPosition');
    const notesControl = this.form.get('evaluationNotes');

    if (enabled) {
      availablePlanControl.enable({ emitEvent: false });
      planPositionControl.enable({ emitEvent: false });
      notesControl.enable({ emitEvent: false });
      availablePlanControl.setValidators(Validators.required);
      planPositionControl.setValidators(Validators.required);
      if (availablePlanControl.value) {
        void this.loadSelectedPlanStructure(
          availablePlanControl.value,
          planPositionControl.value
        );
      }
    } else {
      availablePlanControl.clearValidators();
      planPositionControl.clearValidators();
      availablePlanControl.disable({ emitEvent: false });
      planPositionControl.disable({ emitEvent: false });
      notesControl.disable({ emitEvent: false });
      ++this.planStructureRequestVersion;
      this.isPlanStructureLoading = false;
    }

    availablePlanControl.updateValueAndValidity({ emitEvent: false });
    planPositionControl.updateValueAndValidity({ emitEvent: false });
    if (markAsDirty) {
      this.form.markAsDirty();
      this.persistEvaluationSelection();
    }
  }

  private async loadOfficePlans(idOffice: number): Promise<void> {
    ++this.planStructureRequestVersion;
    this.isPlanStructureLoading = false;
    const result = await this.planService.GetAll({ 'id-office': idOffice });
    this.officePlans = result.success ? result.data || [] : [];
    this.availablePlans = this.officePlans.map(plan => ({
      label: plan.name,
      value: plan.id
    }));

    const availablePlanControl = this.form.get('availablePlan');
    availablePlanControl.setValue(null, { emitEvent: false });
    this.form.get('planPosition').setValue(null, { emitEvent: false });
    this.planStructure = [];
    this.selectedPlanPosition = [];
  }

  private async loadSelectedPlanStructure(
    planId: number | string,
    selectedPosition: string | string[]
  ): Promise<void> {
    const requestVersion: number = ++this.planStructureRequestVersion;
    const selectedPlanId: number = Number(planId);
    if (!Number.isFinite(selectedPlanId) || selectedPlanId <= 0) {
      this.isPlanStructureLoading = false;
      this.planStructure = [];
      this.selectedPlanPosition = [];
      return;
    }

    this.isPlanStructureLoading = true;
    try {
      const loadedFromTreeView = await this.loadPlanFromTreeView(selectedPlanId, requestVersion);
      if (requestVersion !== this.planStructureRequestVersion) {
        return;
      }
      if (loadedFromTreeView) {
        this.restoreSelectedPlanPosition(selectedPosition);
        return;
      }
      const structure = await this.planBreakdownStructureService
        .loadPlanBreakdownStructure(selectedPlanId, false);
      if (requestVersion !== this.planStructureRequestVersion
        || Number(this.form.get('availablePlan').value) !== selectedPlanId) {
        return;
      }
      this.planStructure = (structure || []).map(node => this.mapPlanStructureNode(node));
      this.restoreSelectedPlanPosition(selectedPosition);
    } catch {
      if (requestVersion === this.planStructureRequestVersion) {
        this.planStructure = [];
        this.selectedPlanPosition = [];
      }
    } finally {
      if (requestVersion === this.planStructureRequestVersion) {
        this.isPlanStructureLoading = false;
      }
    }
  }

  private async loadPlanFromTreeView(planId: number, requestVersion: number): Promise<boolean> {
    if (!this.criteriaOfficeId) {
      return false;
    }

    try {
      const result = await this.officeService.GetTreeScopePersons(this.criteriaOfficeId);
      const selectedPlan: ITreeViewScopePlan | undefined = result.success
        ? (result.data?.plans || []).find(plan => String(plan.id) === String(planId))
        : undefined;
      if (!selectedPlan) {
        return false;
      }

      if (requestVersion !== this.planStructureRequestVersion
        || Number(this.form.get('availablePlan').value) !== planId) {
        return true;
      }

      this.planStructure = [{
        label: selectedPlan.name,
        data: `PLAN_${selectedPlan.id}`,
        expanded: true,
        icon: 'fas fa-briefcase',
        selectable: false,
        leaf: false,
        children: this.buildWorkpackStructure(selectedPlan.workpacks || [])
      }];
      return true;
    } catch {
      return false;
    }
  }

  private buildWorkpackStructure(workpacks: ITreeViewScopeWorkpack[]): TreeNode[] {
    return workpacks.map(workpack => ({
      label: workpack.name,
      data: `WORKPACK_${workpack.id}`,
      icon: workpack.icon || 'fas fa-project-diagram',
      leaf: !workpack.children?.length,
      children: this.buildWorkpackStructure(workpack.children || [])
    }));
  }

  private mapPlanStructureNode(node: any): TreeNode {
    const isPlan: boolean = Boolean(node?.idPlan);
    const isWorkpack: boolean = Boolean(node?.idWorkpack);
    const type: string = node?.workpackType || node?.workpackModelType;
    const children: TreeNode[] = (node?.children || [])
      .map(child => this.mapPlanStructureNode(child));

    const mappedNode: TreeNode = {
      label: node?.label || node?.workpackName || node?.workpackModelName,
      data: isPlan
        ? `PLAN_${node.idPlan}`
        : isWorkpack ? `WORKPACK_${node.idWorkpack}` : null,
      icon: this.getPlanStructureIcon(type, isPlan),
      selectable: isWorkpack,
      expanded: true,
      leaf: node?.hasChildren === false || children.length === 0,
      children
    };
    (mappedNode as any).idWorkpack = node?.idWorkpack;
    return mappedNode;
  }

  private getPlanStructureIcon(type: string, isPlan: boolean): string {
    if (isPlan) {
      return 'fas fa-briefcase';
    }
    return IconsTypeWorkpackEnum[type]
      || IconsTypeWorkpackModelEnum[type]
      || 'fas fa-project-diagram';
  }

  private persistEvaluationSelection(): void {
    localStorage.setItem(
      this.getEvaluationSelectionStorageKey(),
      JSON.stringify(this.form.getRawValue())
    );
  }

  private restoreEvaluationSelection(): void {
    const storedValue: string | null = localStorage.getItem(this.getEvaluationSelectionStorageKey());
    if (!storedValue) {
      return;
    }
    try {
      const storedFormValue = JSON.parse(storedValue);
      this.form.patchValue({
        selectPreproject: storedFormValue.selectPreproject === true,
        availablePlan: storedFormValue.availablePlan || null,
        planPosition: storedFormValue.planPosition || null,
        evaluationNotes: storedFormValue.evaluationNotes || ''
      }, { emitEvent: false });
    } catch {
      return;
    }
  }

  private restoreSelectedPlanPosition(position: string | string[]): void {
    const positions: string[] = Array.isArray(position)
      ? position
      : position ? [position] : [];
    this.selectedPlanPosition = positions
      .map((value: string) => this.findTreeNode(this.planStructure, value))
      .filter((node: TreeNode | null): node is TreeNode => node !== null);
  }

  private findTreeNode(nodes: TreeNode[], data: string): TreeNode | null {
    for (const node of nodes || []) {
      if (node.data === data) {
        return node;
      }
      const childNode: TreeNode | null = this.findTreeNode(node.children || [], data);
      if (childNode) {
        return childNode;
      }
    }
    return null;
  }

  private getEvaluationSelectionStorageKey(): string {
    const preprojectKey: string = this.idPreproject ? String(this.idPreproject) : 'new';
    return `openpmo.preproject.evaluation-selection.${this.idPlan || 'no-plan'}.${preprojectKey}`;
  }

  private getGroupScore(group: PreprojectCriterionGroup): number {
    const groupEnabled: boolean = group.currentEnabled !== undefined
      ? group.currentEnabled
      : !group.enablementKey;
    if (group.enablementKey && !groupEnabled) {
      return this.toNumber(group.disabledValue);
    }

    return this.applyOperation(
      (group.properties || []).map(property => ({
        score: this.getPropertyScore(property),
        weight: property.weight || 1
      })),
      group.operation
    );
  }

  private getPropertyScore(property: IWorkpackModelProperty): number {
    if (property.selectedListItems?.length && property.itemValue !== undefined) {
      return property.selectedListItems.length * property.itemValue;
    }

    const currentValue = property.currentValue !== undefined
      ? property.currentValue
      : property.defaultValue;
    const selectedValues: unknown[] = Array.isArray(currentValue) ? currentValue : [currentValue];
    const possibleValueScores: number[] = selectedValues
      .map(selectedValue => property.possibleValuesDetails
        ?.find(option => option.label === selectedValue)?.value)
      .filter((value): value is number => typeof value === 'number');

    if (possibleValueScores.length) {
      return possibleValueScores.reduce((total, value) => total + value, 0) / possibleValueScores.length;
    }
    if (typeof currentValue === 'boolean') {
      return currentValue ? 1 : 0;
    }
    return this.toNumber(currentValue);
  }

  private getGroupMaximumScore(group: PreprojectCriterionGroup): number {
    const enabledMaximum: number = this.applyOperation(
      (group.properties || []).map(property => ({
        score: this.getPropertyMaximumScore(property),
        weight: property.weight || 1
      })),
      group.operation
    );
    return group.enablementKey
      ? Math.max(enabledMaximum, this.toNumber(group.disabledValue))
      : enabledMaximum;
  }

  private getPropertyMaximumScore(property: IWorkpackModelProperty): number {
    const possibleScores: number[] = (property.possibleValuesDetails || [])
      .map(option => option.value)
      .filter((value): value is number => typeof value === 'number');
    if (possibleScores.length) {
      return Math.max(...possibleScores);
    }
    if (property.itemValue !== undefined) {
      const itemCount: number = property.availableListItems?.length
        || property.selectedListItems?.length
        || 0;
      return itemCount * property.itemValue;
    }
    if (typeof property.max === 'number') {
      return property.max;
    }
    if (property.type === TypePropertyEnum.ToggleModel) {
      return 1;
    }
    return Math.max(0, this.getPropertyScore(property));
  }

  private applyOperation(
    values: Array<{ score: number; weight: number }>,
    operation: PreprojectEvaluationOperation
  ): number {
    if (!values.length) {
      return 0;
    }

    const weightedTotal: number = values
      .reduce((total, item) => total + (item.score * item.weight), 0);
    if (operation === 'SUM') {
      return weightedTotal;
    }

    const weightTotal: number = values.reduce((total, item) => total + item.weight, 0);
    return weightTotal ? weightedTotal / weightTotal : 0;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value !== 'string' || !value.trim()) {
      return 0;
    }
    const parsedValue: number = Number(value.replace(',', '.'));
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  private async initBreadcrumb(): Promise<void> {
    const idPlanNumber: number = Number(this.idPlan);
    const breadcrumbs: IBreadcrumb[] = [];

    if (Number.isFinite(idPlanNumber) && idPlanNumber > 0) {
      await this.planService.nextIDPlan(idPlanNumber);
      const plan = await this.planService.getCurrentPlan(idPlanNumber);

      if (plan) {
        this.criteriaOfficeId = plan.idOffice;
        this.evaluationOperation = this.preprojectEvaluationConfigService.getOperation(plan.idOffice);
        await this.loadCriteriaGuides(plan.idOffice);
        await this.loadOfficePlans(plan.idOffice);
        const office = await this.officeService.getCurrentOffice(plan.idOffice);
        this.officeService.nextIDOffice(plan.idOffice);

        if (office) {
          breadcrumbs.push({
            key: 'office',
            routerLink: ['/offices', 'office'],
            queryParams: { id: office.id },
            info: office.name,
            tooltip: office.fullName
          });
        }

        breadcrumbs.push({
          key: 'plan',
          routerLink: ['/plan'],
          queryParams: { id: plan.id },
          info: plan.name,
          tooltip: plan.fullName
        });
      }
    }

    breadcrumbs.push(
      {
        key: 'preproject',
        routerLink: ['/preproject'],
        queryParams: this.idPlan ? { idPlan: this.idPlan } : undefined,
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
