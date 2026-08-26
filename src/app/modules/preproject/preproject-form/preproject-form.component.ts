import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
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
import { TypeOrganization } from 'src/app/shared/enums/TypeOrganization';
import {
  PreprojectEvaluationConfigService,
  PreprojectEvaluationOperation
} from 'src/app/shared/services/preproject-evaluation-config.service';

type PropertyTarget = 'relevance' | 'viability';

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

  deliveries: Array<{ name: string }> = [];

  form: FormGroup;

  tabs: ITabViewScrolled[] = [
    { key: 'properties', menu: 'properties' },
    { key: 'relevance', menu: 'relevance' },
    { key: 'viability', menu: 'viability' },
    { key: 'evaluation', menu: 'evaluation' }
  ];

  selectedTab: ITabViewScrolled = this.tabs[0];

  evaluationOperation: PreprojectEvaluationOperation = 'AVERAGE';

  cardProperties: ICard = {
    cardTitle: 'properties',
    collapseble: false,
    toggleable: false,
    initialStateToggle: false,
    initialStateCollapse: false
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
    private readonly configDataViewService: ConfigDataViewService,
    private readonly workpackShowTabviewService: WorkpackShowTabviewService,
    private readonly formBuilder: FormBuilder,
    private readonly translateService: TranslateService
  ) {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: ['', Validators.required],
      organization: [null],
      expectedCompletion: [null]
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

    this.buildPropertyMenus();
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
  }

  get evaluationOperationTranslationKey(): string {
    return this.evaluationOperation === 'SUM' ? 'sum' : 'average';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // A integração com a API será adicionada quando o contrato estiver definido.
  }

  get deliveryCardItems(): ICardItem[] {
    const cards: ICardItem[] = this.deliveries.map((delivery: { name: string }, index: number) => ({
      typeCardItem: 'listItem',
      icon: 'cubes',
      nameCardItem: delivery.name,
      fullNameCardItem: delivery.name,
      itemId: index
    } as ICardItem));

    cards.push({
      typeCardItem: 'newCardItem',
      icon: 'plus',
      iconSvg: true,
      iconMenuItems: this.deliveryCreationMenuItems
    } as ICardItem);

    return cards;
  }

  trackByDelivery(index: number): number {
    return index;
  }

  removeDelivery(delivery: { name: string }): void {
    this.deliveries = this.deliveries.filter((item: { name: string }) => item !== delivery);
  }

  addDelivery(): void {
    void this.router.navigate(['/preproject/delivery/new'], {
      queryParams: this.idPlan ? { idPlan: this.idPlan } : undefined
    });
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

  private get deliveryCreationMenuItems(): MenuItem[] {
    return [{
      label: this.translateService.instant('new'),
      icon: 'fas fa-cog',
      command: () => this.addDelivery()
    }];
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
    ];

    const buildMenu = (target: PropertyTarget): MenuItem[] =>
      propertyTypes.map(({ type, labelKey }) => ({
        label: this.translateService.instant(labelKey),
        icon: IconPropertyEnum[type] || 'fas fa-cube',
        command: () => this.addProperty(type, target)
      }));

    this.menuRelevanceProperties = buildMenu('relevance');
    this.menuViabilityProperties = buildMenu('viability');
  }

  private async initBreadcrumb(): Promise<void> {
    const idPlanNumber: number = Number(this.idPlan);
    const breadcrumbs: IBreadcrumb[] = [];

    if (Number.isFinite(idPlanNumber) && idPlanNumber > 0) {
      await this.planService.nextIDPlan(idPlanNumber);
      const plan = await this.planService.getCurrentPlan(idPlanNumber);

      if (plan) {
        this.evaluationOperation = this.preprojectEvaluationConfigService.getOperation(plan.idOffice);
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
