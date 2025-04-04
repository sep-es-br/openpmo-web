import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { MenuItem, MessageService } from 'primeng/api';

import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IPlanModel } from 'src/app/shared/interfaces/IPlanModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { PlanModelService } from 'src/app/shared/services/plan-model.service';
import { WorkpackModelService } from 'src/app/shared/services/workpack-model.service';
import { IWorkpackModel } from 'src/app/shared/interfaces/IWorkpackModel';
import { TypeWorkpackModelEnum } from 'src/app/shared/enums/TypeWorkpackModelEnum';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { OfficeService } from 'src/app/shared/services/office.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { ReportModelService } from 'src/app/shared/services/report-model.service';
import { IReportModel } from 'src/app/shared/interfaces/IReportModel';
import { MenuService } from 'src/app/shared/services/menu.service';
import { CostAccountModelService } from 'src/app/shared/services/cost-account-model.service';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

@Component({
  selector: 'app-strategy',
  templateUrl: './strategy.component.html',
  styleUrls: ['./strategy.component.scss']
})
export class StrategyComponent implements OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

  propertiesStrategy: IPlanModel;
  responsive = false;
  formStrategy: FormGroup;
  idStrategy: number;
  idOffice: number;
  propertiesOffice: IOffice;
  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'properties',
    collapseble: true
  };
  cardModels: ICard;
  cardCostAccountModel: ICard;
  models: IWorkpackModel[];
  cardItemsModels: ICardItem[];
  cardItemPlanMenu: MenuItem[];
  $destroy = new Subject();
  isUserAdmin: boolean;
  editPermission: boolean;
  permissionsOffices: IOffice[];
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  sharingProperties: ICard;
  sharedWith: IOffice[] = [];
  sharedWithAll = false;
  officeListOptionsSharing: IOffice[];
  isLoading = false;
  language: string;
  reportModelsProperties: ICard;
  cardItemsReportModels: ICardItem[];
  reports: IReportModel[];
  costAccountModelCardItem: ICardItem[];
  formIsSaving = false;

  constructor(
    private formBuilder: FormBuilder,
    private planModelSvr: PlanModelService,
    private workpackModelSvr: WorkpackModelService,
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private responsiveSvr: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private officeSrv: OfficeService,
    private officePermissionSrv: OfficePermissionService,
    private authSrv: AuthService,
    private messageSrv: MessageService,
    private configDataViewSrv: ConfigDataViewService,
    private reportModelSrv: ReportModelService,
    private menuSrv: MenuService,
    private costAccountModelSrv: CostAccountModelService
  ) {
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
    });
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.cardProperties = Object.assign({}, {
        ...this.cardProperties,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.cardModels = Object.assign({}, {
        ...this.cardModels,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.sharingProperties = Object.assign({}, {
        ...this.sharingProperties,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.reportModelsProperties = Object.assign({}, {
        ...this.reportModelsProperties,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.cardCostAccountModel = Object.assign({}, {
        ...this.cardCostAccountModel,
        initialStateCollapse: this.collapsePanelsStatus
      });
    });
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
    this.formStrategy = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: ['', [Validators.required]]
    });
    this.formStrategy.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formStrategy.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formStrategy.dirty))
      .subscribe(() => {this.saveButton.showButton(); this.cancelButton.showButton() });
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.activeRoute.queryParams.subscribe(async ({ id, idOffice }) => {
      this.idStrategy = +id;
      this.idOffice = +idOffice;
      if (this.idStrategy) {
        this.isLoading = true;
        this.cardProperties.isLoading = true;
      }
      this.cardProperties.initialStateCollapse = this.idStrategy ? true : false;
      this.propertiesOffice = await this.officeSrv.getCurrentOffice(this.idOffice);
      this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
      this.isUserAdmin = await this.authSrv.isUserAdmin();
      if (!this.isUserAdmin && !this.editPermission) {
        this.router.navigate(['/offices']);
      }
      await this.loadOfficeListOptionsSharing();
      this.loadCards();
      if (this.idStrategy) {
        await this.loadPropertiesStrategy();
        await this.loadModels();
        await this.loadCostAccountModel();
        this.loadReportModels();
      }
      this.breadcrumbSrv.setMenu([
        {
          key: 'administration',
          info: this.propertiesOffice?.name,
          tooltip: this.propertiesOffice?.fullName,
          routerLink: ['/configuration-office'],
          admin: true,
          queryParams: { idOffice: this.idOffice }
        },
        {
          key: 'configuration',
          info: 'planModels',
          tooltip: this.translateSrv.instant('planModels'),
          admin: true,
          routerLink: ['/strategies'],
          queryParams: { idOffice: this.idOffice }
        },
        {
          key: 'planModel',
          info: this.propertiesStrategy?.name,
          tooltip: this.propertiesStrategy?.fullName,
          admin: true,
          routerLink: ['/strategies', 'strategy'],
          queryParams: { id: this.idStrategy, idOffice: this.idOffice }
        }
      ]);
    });
    this.setLanguage();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

  loadCards() {
    this.cardModels = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'models',
      collapseble: true,
      initialStateCollapse: false
    };
    this.cardCostAccountModel = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'costAccountModel',
      collapseble: true,
      isLoading: true,
      initialStateCollapse: false
    };
    this.sharingProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'sharing',
      collapseble: true,
      initialStateCollapse: false
    };
    this.reportModelsProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'reportModels',
      collapseble: true,
      isLoading: true,
      initialStateCollapse: false
    };
  }

  async loadPropertiesStrategy() {
    if (this.idStrategy) {
      const { data, success } = await this.planModelSvr.GetById(this.idStrategy);
      if (success) {
        this.propertiesStrategy = data;
        this.formStrategy.setValue({
          name: this.propertiesStrategy?.name,
          fullName: this.propertiesStrategy?.fullName
        });
        this.sharedWith = data.sharedWithAll ? [{
          id: null,
          name: this.translateSrv.instant('All'),
          fullName: 'All'
        }] : data.sharedWith;
        this.sharedWithAll = data.sharedWithAll;
        if (!this.editPermission) {
          this.formStrategy.disable();
        }
        this.cardProperties.isLoading = false;
      }
    } else {
      this.cardProperties.isLoading = false;
    }
  }

  async loadOfficeListOptionsSharing() {
    const result = await this.officeSrv.GetAll();
    if (result.success) {
      this.officeListOptionsSharing = result.data && result.data.filter(office => office.id !== this.idOffice);
      this.officeListOptionsSharing.unshift({
        id: null,
        name: this.translateSrv.instant('All'),
        fullName: 'All'
      });
    }
  }

  checkSelectAllOffices(event) {
    if (event.itemValue && event.itemValue.fullName === 'All') {
      this.sharedWith = Array.from(this.sharedWith.filter(op => op.fullName === 'All'));
      this.sharedWithAll = true;
    } else {
      this.sharedWith = Array.from(this.sharedWith.filter(op => op.fullName !== 'All'));
      this.sharedWithAll = false;
    }
    this.cancelButton.showButton();
    if (this.formStrategy.valid) {
      this.saveButton.showButton();
    }
  }

  async loadCostAccountModel() {
    if (this.propertiesStrategy && this.propertiesStrategy.idCostAccountModel) {
      this.costAccountModelCardItem = [
        {
          typeCardItem: 'listItem',
          icon: 'fas fa-dollar-sign',
          nameCardItem: this.translateSrv.instant('model'),
          itemId:this.propertiesStrategy.idCostAccountModel,
          menuItems: [
            {
              label: this.translateSrv.instant('delete'),
              icon: 'fas fa-trash-alt',
              command: () => this.deleteCostAccountModel(this.propertiesStrategy.idCostAccountModel),
              disabled: !this.editPermission
            },
          ] as MenuItem[],
          urlCard: '/strategies/strategy/cost-account-model',
          paramsUrlCard: [
            { name: 'id', value: this.propertiesStrategy.idCostAccountModel },
            { name: 'idStrategy', value: this.idStrategy },
            { name: 'idOffice', value: this.idOffice }
          ]
        }
      ];
      this.cardCostAccountModel.isLoading = false;
    } else {
      this.costAccountModelCardItem = this.editPermission ? [
        {
          typeCardItem: 'newCardItem',
          iconSvg: true,
          icon: IconsEnum.Plus,
          urlCard: '/strategies/strategy/cost-account-model',
          paramsUrlCard: [{ name: 'idStrategy', value: this.idStrategy }, { name: 'idOffice', value: this.idOffice }]
        }
      ] : [];
      this.cardCostAccountModel.isLoading = false;
    }
    
  }

  async loadModels() {
    this.isLoading = true;
    const result = await this.workpackModelSvr.GetAll({ 'id-plan-model': this.idStrategy });
    if (result.success) {
      this.totalRecords = result.data.length ? result.data.length + 1 : 1;
      this.models = result.data;
    }
    this.loadCardItemsModels();
  }

  navigateToWorkpackModel(type: string) {
    this.router.navigate(['/workpack-model'], {
      queryParams: {
        type,
        idStrategy: this.idStrategy,
        idOffice: this.idOffice
      }
    });
  }

  loadCardItemsModels() {
    const itemsModels: ICardItem[] = this.editPermission ? [
      {
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        iconMenuItems: [
          {
            label: this.translateSrv.instant(`labels.${TypeWorkpackModelEnum.PortfolioModel}`),
            command: () => this.navigateToWorkpackModel(TypeWorkpackModelEnum.PortfolioModel),
            icon: 'fas fa-briefcase'
          },
          {
            label: this.translateSrv.instant(`labels.${TypeWorkpackModelEnum.ProgramModel}`),
            command: () => this.navigateToWorkpackModel(TypeWorkpackModelEnum.ProgramModel),
            icon: 'fas fa-cogs'
          },
          {
            label: this.translateSrv.instant(`labels.${TypeWorkpackModelEnum.ProjectModel}`),
            command: () => this.navigateToWorkpackModel(TypeWorkpackModelEnum.ProjectModel),
            icon: 'fas fa-cog'
          },
          {
            label: this.translateSrv.instant(`labels.${TypeWorkpackModelEnum.OrganizerModel}`),
            command: () => this.navigateToWorkpackModel(TypeWorkpackModelEnum.OrganizerModel),
            icon: 'fas fa-folder-open'
          },
        ],
        paramsUrlCard: [{ name: 'idStrategy', value: this.idStrategy }]
      }
    ] : [];
    if (this.models) {
      itemsModels.unshift(...this.models.map(workpackModel => (
        {
          typeCardItem: 'listItem',
          icon: workpackModel.fontIcon,
          nameCardItem: workpackModel.modelName,
          itemId: workpackModel.id,
          menuItems: [
            {
              label: this.translateSrv.instant('delete'),
              icon: 'fas fa-trash-alt',
              command: () => this.deleteWorkpackModel(workpackModel),
              disabled: !this.editPermission
            },
          ] as MenuItem[],
          urlCard: '/workpack-model',
          paramsUrlCard: [
            { name: 'id', value: workpackModel.id },
            { name: 'type', value: TypeWorkpackModelEnum[workpackModel.type] },
            { name: 'idStrategy', value: this.idStrategy },
            { name: 'idOffice', value: this.idOffice }
          ],
          breadcrumbWorkpackModel: this.getCurrentBreadcrumb(workpackModel)
        }
      )));
    }
    this.cardItemsModels = itemsModels;
    setTimeout(() => {
      this.isLoading = false;
    }, 300);
  }

  async loadReportModels() {
    const result = await this.reportModelSrv.GetAll({
      idPlanModel: this.idStrategy
    });
    if (result.success) {
      this.reports = result.data;
      const cardItems: ICardItem[] = this.isUserAdmin ? [
        {
          typeCardItem: 'newCardItem',
          iconSvg: true,
          icon: IconsEnum.Plus,
          urlCard: '/report-models/report-model',
          paramsUrlCard: [{ name: 'idStrategy', value: this.idStrategy }, { name: 'idOffice', value: this.idOffice },]
        }
      ] : [];
      if (this.reports) {
        cardItems.unshift(...this.reports.map(report => (
          {
            typeCardItem: 'listItem',
            icon: 'fas fa-file-invoice',
            iconColor: report.active ? '#44B39B' : '#888e96',
            nameCardItem: report.name,
            itemId: report.id,
            urlCard: '/report-models/report-model',
            paramsUrlCard: [
              { name: 'id', value: report.id },
              { name: 'idStrategy', value: this.idStrategy },
              { name: 'idOffice', value: this.idOffice },
            ],
            editPermission: this.isUserAdmin
          }
        )));
      }
      this.cardItemsReportModels = cardItems;
      this.reportModelsProperties.isLoading = false;
    }
  }

  getCurrentBreadcrumb(workpackModel) {
    const breadcrumb = [
      {
        key: 'administration',
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName,
        routerLink: ['/configuration-office'],
        admin: true,
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'configuration',
        info: 'planModels',
        tooltip: this.translateSrv.instant('planModels'),
        admin: true,
        routerLink: ['/strategies'],
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'planModel',
        info: this.propertiesStrategy?.name,
        tooltip: this.propertiesStrategy?.fullName,
        admin: true,
        routerLink: ['/strategies', 'strategy'],
        queryParams: { id: this.idStrategy, idOffice: this.idOffice }
      },
      {
        key: 'workpackModel',
        info: workpackModel.modelName,
        tooltip: workpackModel.modelNamePlural,
        admin: true,
        routerLink: ['/workpack-model'],
        queryParams: { idStrategy: this.idStrategy, id: workpackModel.id, type: workpackModel.type, idOffice: this.idOffice }
      }
    ];
    return breadcrumb;
  }

  async deleteWorkpackModel(worckpackModel: IWorkpackModel) {
    const result = await this.workpackModelSvr.delete(worckpackModel, { field: 'modelName' });
    if (result.success) {
      await this.loadModels();
      this.menuSrv.reloadMenuPlanModel();
    }
  }

  async deleteCostAccountModel(idCostAccountModel) {
    const result = await this.costAccountModelSrv.delete({id: idCostAccountModel}, {message: this.translateSrv.instant('messages.deleteCostAccountModelConfirmation')});
    if (result.success) {
      this.propertiesStrategy.idCostAccountModel = undefined;
      this.loadCostAccountModel();
    }
  }

  async handleOnSubmit() {
    this.cancelButton.hideButton();
    const isPut = !!this.idStrategy;
    this.formIsSaving = true;
    this.propertiesStrategy = {
      ...this.formStrategy.value,
      id: this.idStrategy,
      idOffice: this.idOffice,
      sharedWith: this.sharedWith,
      sharedWithAll: this.sharedWithAll
    };
    const { success, data } = isPut
      ? await this.planModelSvr.put({
        ...this.propertiesStrategy
      })
      : await this.planModelSvr.post({
        ...this.propertiesStrategy
      });

    if (success) {
      this.idStrategy = data.id;
      this.breadcrumbSrv.updateLastCrumb({
        key: 'planModel',
        routerLink: ['/strategies', 'strategy'],
        admin: true,
        queryParams: { id: this.idStrategy, idOffice: this.idOffice },
        info: isPut ? this.propertiesStrategy?.name : this.formStrategy.controls.name?.value,
        tooltip: isPut ? this.propertiesStrategy?.fullName : this.formStrategy.controls.fullName?.value,
      });
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.formStrategy.reset(this.formStrategy.value);
      if (!isPut) {
        this.formIsSaving = false;
        await this.loadModels();
        await this.loadCostAccountModel();
        this.loadReportModels();
      } else {
        this.formIsSaving = false;
      }
    }
  }

  async handleDeleteReport(event) {
    const deletedReport = this.reports.find(report => report.id === event.idReport);
    const result = await this.reportModelSrv.delete(deletedReport, {
      field: 'name'
    });
    if (result.success) {
      this.reports = this.reports.filter(report => report.id !== deletedReport.id)
      this.cardItemsReportModels = this.cardItemsReportModels.filter(report => report.itemId !== deletedReport.id);
    }
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    if (this.idStrategy) {
      this.formStrategy.reset({ name: this.propertiesStrategy.name, fullName: this.propertiesStrategy.fullName });
      this.sharedWith = this.propertiesStrategy.sharedWithAll ? [{
        id: null,
        name: this.translateSrv.instant('All'),
        fullName: 'All'
      }] : this.propertiesStrategy.sharedWith;
      this.sharedWithAll = this.propertiesStrategy.sharedWithAll;
    } else {
      this.formStrategy.reset();
      this.sharedWith = [];
      this.sharedWithAll = false;
    }
  }

}
