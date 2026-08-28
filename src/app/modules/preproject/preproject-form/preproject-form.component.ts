import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MenuItem, MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { MenuService } from 'src/app/shared/services/menu.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
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
import {
  PreprojectEvaluationConfigService,
  PreprojectEvaluationOperation
} from 'src/app/shared/services/preproject-evaluation-config.service';
import {
  PreprojectCriteriaConfigService,
  PreprojectCriterion
} from 'src/app/shared/services/preproject-criteria-config.service';

type PropertyTarget = 'relevance' | 'viability';

interface DeliveryCardItem extends ICardItem {
  deliveryIndex?: number;
  displayItemId?: string;
}

@Component({
  selector: 'app-preproject-form',
  templateUrl: './preproject-form.component.html',
  styleUrls: ['./preproject-form.component.scss']
})
export class PreprojectFormComponent implements OnInit, OnDestroy {

  private readonly destroy$: Subject<void> = new Subject<void>();

  idPlan: string | null;

  collapsed: boolean = false;

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

  selectedTab: ITabViewScrolled = this.tabs[0];

  evaluationOperation: PreprojectEvaluationOperation = 'AVERAGE';

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
    private readonly officeService: OfficeService,
    private readonly preprojectEvaluationConfigService: PreprojectEvaluationConfigService,
    private readonly preprojectCriteriaConfigService: PreprojectCriteriaConfigService,
    private readonly configDataViewService: ConfigDataViewService,
    private readonly workpackShowTabviewService: WorkpackShowTabviewService,
    private readonly formBuilder: FormBuilder,
    private readonly translateService: TranslateService,
    private readonly messageService: MessageService
  ) {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: ['', Validators.required],
      organization: [null],
      expectedCompletion: [null],
      deliveries: this.formBuilder.array([])
    });
  }

  ngOnInit(): void {
    this.idPlan = this.route.snapshot.queryParamMap.get('idPlan');
    this.menuService.nextIsPlanMenu(true);
    this.workpackShowTabviewService.next(true);

    this.configDataViewService.observableCollapsePanelsStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe((status: string) => {
        this.collapsed = status === 'collapse';
      });

    this.configDataViewService.observableDisplayModeAll
      .pipe(takeUntil(this.destroy$))
      .subscribe((displayMode: string) => {
        const mode: string = displayMode.toLowerCase();
        this.displayModeAll = mode === 'card' || mode === 'grid' ? 'grid' : 'list';
      });

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

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
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

  /**
   * Cria e adiciona uma nova propriedade na aba especificada.
   * Segue o mesmo fluxo do workpack-model: instancia IWorkpackModelProperty,
   * chama checkProperty() para preparar campos obrigatórios e listas, e empurra na lista.
   */
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

  /**
   * Prepara campos obrigatórios e listas específicas por tipo de propriedade.
   * Reproduz a lógica do checkProperty() do workpack-model para os tipos suportados.
   */
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

  /**
   * Callback emitido pelo app-property-model quando o usuário altera um campo.
   */
  propertyChanged(event: { property: IWorkpackModelProperty }): void {
    // Atualizações reativas de localidades serão conectadas quando o serviço de domínio estiver disponível.
    if (event?.property) {
      this.relevanceProperties = [...this.relevanceProperties];
      this.viabilityProperties = [...this.viabilityProperties];
    }
  }

  get selectedCriteriaGuide(): PreprojectCriterion | undefined {
    const criterionId: number = Number((this.selectedTab?.key || '').replace('criterion-', ''));
    return this.criteriaGuides.find((criterion: PreprojectCriterion) => criterion.id === criterionId);
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
    // O componente publica este evento para o seletor de Desafios/ODS.
    // A abertura do seletor será conectada ao serviço assim que o endpoint estiver disponível.
    this.propertyChanged({ property });
  }

  /**
   * Remove uma propriedade da lista da aba correspondente.
   */
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

  /**
   * Constrói os menus de adição de propriedade para Relevância e Viabilidade,
   * listando todos os tipos de TypePropertModelEnum com seus ícones oficiais.
   */
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

  private loadCriteriaGuides(idOffice: number): void {
    this.criteriaGuides = this.preprojectCriteriaConfigService.getCriteria(idOffice)
      .filter((criterion: PreprojectCriterion) => criterion.active !== false)
      .sort((first: PreprojectCriterion, second: PreprojectCriterion) => first.position - second.position);

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

  private async initBreadcrumb(): Promise<void> {
    const idPlanNumber: number = Number(this.idPlan);
    const breadcrumbs: IBreadcrumb[] = [];

    if (Number.isFinite(idPlanNumber) && idPlanNumber > 0) {
      await this.planService.nextIDPlan(idPlanNumber);
      const plan = await this.planService.getCurrentPlan(idPlanNumber);

      if (plan) {
        this.evaluationOperation = this.preprojectEvaluationConfigService.getOperation(plan.idOffice);
        this.loadCriteriaGuides(plan.idOffice);
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
        queryParams: this.idPlan ? { idPlan: this.idPlan } : undefined
      },
      { key: 'newPreproject' }
    );

    this.breadcrumbService.setMenu(breadcrumbs);
  }

}
