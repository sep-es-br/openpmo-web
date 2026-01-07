import { IPlanModel } from 'src/app/shared/interfaces/IPlanModel';
import { PlanModelService } from 'src/app/shared/services/plan-model.service';
import { IReusableWorkpackModel } from '../../shared/interfaces/IWorkpackModel';
import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { ConfirmationService, MenuItem, MessageService, SelectItem, TreeNode } from 'primeng/api';

import { IconPropertyWorkpackModelEnum as IconPropertyEnum } from 'src/app/shared/enums/IconPropertyWorkpackModelEnum';
import { TypePropertModelEnum as TypePropertyEnum } from 'src/app/shared/enums/TypePropertModelEnum';
import { TypeWorkpackModelEnum } from 'src/app/shared/enums/TypeWorkpackModelEnum';
import {
  IconsRegularEng,
  IconsRegularPt,
  IconsSolidEng,
  IconsSolidPt
} from 'src/app/shared/font-awesome-icons-constants';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { IWorkpackModel } from 'src/app/shared/interfaces/IWorkpackModel';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { DomainService } from 'src/app/shared/services/domain.service';
import { LocalityService } from 'src/app/shared/services/locality.service';
import { MeasureUnitService } from 'src/app/shared/services/measure-unit.service';
import { OrganizationService } from 'src/app/shared/services/organization.service';
import { WorkpackModelService } from 'src/app/shared/services/workpack-model.service';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IconsTypeWorkpackModelEnum } from 'src/app/shared/enums/IconsTypeWorkpackModelEnum';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { IBreadcrumb } from 'src/app/shared/interfaces/IBreadcrumb';
import { ILocalityList } from 'src/app/shared/interfaces/ILocality';
import { OfficeService } from 'src/app/shared/services/office.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { MenuService } from 'src/app/shared/services/menu.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { TypeOrganization } from 'src/app/shared/enums/TypeOrganization';
import { IOrganization } from 'src/app/shared/interfaces/IOrganization';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

interface IIcon {
  name: string;
  label: string;
}

interface IGroup {
  title: string;
  properties: IWorkpackModelProperty[];
  groups: IGroup[];
  menuProperties: MenuItem[];
}

@Component({
  selector: 'app-workpack-model',
  templateUrl: './workpack-model.component.html',
  styleUrls: ['./workpack-model.component.scss']
})
export class WorkpackModelComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

  idOffice: number;
  idStrategy: number;
  idWorkpackModel: number;
  modelName: string;
  modelNamePlural: string;
  idParentWorkpack: number;
  workpackModelType: TypeWorkpackModelEnum;
  cardProperties: ICard;
  cardPropertiesStakeholders: ICard;
  cardPropertiesCostAccount: ICard;
  cardPropertiesJournal: ICard;
  cardPropertiesModels: ICard;
  cardPropertiesSchedule: ICard;
  cardPropertiesRiskAndIssues: ICard;
  cardPropertiesProcesses: ICard;
  cardPropertiesNotifications: ICard;
  cardPropertiesDashboard: ICard;
  rolesPersonOptions = ['manager', 'teamMember', 'sponsor', 'partner'];
  rolesOrgOptions = ['funder', 'client', 'competitor'];
  posibleRolesPerson: string[];
  posibleRolesOrg: string[];
  formProperties: FormGroup;
  icons: IIcon[];
  modelProperties: IWorkpackModelProperty[] = [];
  menuModelProperties: MenuItem[] = [];
  menuCostProperties: MenuItem[] = [];
  listDomains: SelectItem[] = [];
  listOrganizations: IOrganization[] = [];
  listMeasureUnits: SelectItem[] = [];
  groups: IGroup[] = [];
  currentLang: string;
  childrenModels: IWorkpackModel[] = [];
  cardItemsModels: ICardItem[];
  $destroy = new Subject();
  isMobileView = false;
  editPermission = false;
  sortedByList: SelectItem[];
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  typePropertyEnum = TypePropertyEnum;
  propertiesOffice: IOffice;
  propertiesPlanModel: IPlanModel;
  reusableWorkpackModelsList: MenuItem[];
  stakeholders = ['manager', 'teamMember', 'sponsor', 'partner', 'funder', 'client', 'competitor'].map(item => this.translateSrv.instant(item));
  dashboardPanel = {
    dashboardShowEva: false,
    dashboardShowMilestones: false,
    dashboardShowRisks: false,
    dashboardShowStakeholders: this.stakeholders,
    dashboardStakeholderRolesOptions: this.stakeholders.map(item => ({
      label: this.translateSrv.instant(item),
      value: this.translateSrv.instant(item),
    })),
  };
  currentBreadcrumbItems: IBreadcrumb[];
  currentBreadcrumbSub: Subscription;
  isLoading = false;
  formIsSaving = false;
  nextPosition: number;
  workpackModel: IWorkpackModel;

  notificationsStakeholderRolesOptions: SelectItem[] = [];
  notifications = {
    selectedRoles: ['manager'].map(item => this.translateSrv.instant(item)),
    eventMilestone: {
      enabled: true,
      daysBefore: 5
    },
    eventSchedule: {
      enabled: true,
      dayOfMonth: 10
    }
  };
  // lista de dias 1–31
  daysList = Array.from({ length: 31 }, (_, i) => ({ label: `${i+1}`, value: i+1 }));


  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private translateSrv: TranslateService,
    private fb: FormBuilder,
    private domainSrv: DomainService,
    private organizationSrv: OrganizationService,
    private measureUnitSrv: MeasureUnitService,
    private localitySrv: LocalityService,
    private messageSrv: MessageService,
    private workpackModelSrv: WorkpackModelService,
    private responsiveSrv: ResponsiveService,
    private confirmationSrv: ConfirmationService,
    private officePermissionSrv: OfficePermissionService,
    private officeSrv: OfficeService,
    private planModelSrv: PlanModelService,
    private menuSrv: MenuService,
    private configDataViewSrv: ConfigDataViewService
  ) {
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.cardProperties = Object.assign({}, {
        ...this.cardProperties,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.cardPropertiesStakeholders = Object.assign({}, {
        ...this.cardPropertiesStakeholders,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.cardPropertiesNotifications = Object.assign({}, {
        ...this.cardPropertiesNotifications,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.cardPropertiesCostAccount = Object.assign({}, {
        ...this.cardPropertiesCostAccount,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.cardPropertiesJournal = Object.assign({}, {
        ...this.cardPropertiesJournal,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.cardPropertiesModels = Object.assign({}, {
        ...this.cardPropertiesModels,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.cardPropertiesSchedule = Object.assign({}, {
        ...this.cardPropertiesSchedule,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.cardPropertiesDashboard = Object.assign({}, {
        ...this.cardPropertiesDashboard,
        initialStateCollapse: this.collapsePanelsStatus
      });
    });
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
    this.activeRoute.queryParams.subscribe(async ({ idOffice, idStrategy, id, idParent, type }) => {
      if (id && this.idWorkpackModel === Number(id)) {
        // refresh on adding id to query
        return;
      }
      this.idOffice = +idOffice;
      this.idStrategy = +idStrategy;
      this.idWorkpackModel = +id;
      this.idParentWorkpack = +idParent;
      this.workpackModelType = type;
      this.posibleRolesOrg = this.rolesOrgOptions.map(role => this.translateSrv.instant(role));
      this.posibleRolesPerson = this.rolesPersonOptions.map(role => this.translateSrv.instant(role));
      this.notificationsStakeholderRolesOptions = this.posibleRolesPerson.map(item => ({
        label: this.translateSrv.instant(item),
        value: this.translateSrv.instant(item),
      }));
      this.resetValues();
      await this.setFormProperties();
      this.scrollTop();
      this.editPermission = await this.officePermissionSrv.getPermissions(idOffice);
      if (!this.editPermission) {
        await this.router.navigate(['offices']);
      }
      await this.getOfficeById();
      if (!this.idParentWorkpack) await this.getPlanModelById();
      await this.loadDetails();
    });
    this.currentBreadcrumbItems = [];
    this.currentBreadcrumbItems = this.breadcrumbSrv.get;
    this.currentBreadcrumbSub = this.breadcrumbSrv.ready.subscribe(data => {
      this.currentBreadcrumbItems = data;
      this.setCurrentBreadcrumb();
    });
    this.translateSrv.onLangChange
      .pipe(takeUntil(this.$destroy)).subscribe(({ lang }) => {
        this.currentLang = lang;
        this.loadIcons();
        setTimeout(() => {
          this.loadMenuProperty();
          this.modelProperties.filter(prop => prop.type === TypePropertyEnum.GroupModel).forEach(group => {
            group.menuModelProperties = this.loadMenuPropertyGroup(group);
          });
        }, 250);
      });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(r => this.isMobileView = r);
  }

  async setFormProperties() {
    this.nextPosition;
    if (!this.idWorkpackModel) {
      const result = await this.workpackModelSrv.getNextPosition({
        'id-workpack-model': Number(this.idParentWorkpack) ? this.idParentWorkpack : undefined,
        'id-plan-model': this.idStrategy
      });
      if (result.success) {
        this.nextPosition = result.data.nextPosition;
      }
    }
    this.formProperties = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      nameInPlural: ['', [Validators.required, Validators.maxLength(600)]],
      icon: this.workpackModelType ? [IconsTypeWorkpackModelEnum[this.workpackModelType], Validators.required] :
        [undefined, Validators.required],
      position: [this.nextPosition || 1, Validators.required],
      sortedBy: 'name'
    });
    this.getSortedByList();
    if (this.sortedByList.length === 0) {
      this.sortedByList = [
        { label: this.translateSrv.instant('name'), value: 'name' },
        { label: this.translateSrv.instant('fullName'), value: "fullName" }
      ];
    if (this.workpackModelType === TypeWorkpackModelEnum.MilestoneModel) {
        this.sortedByList.push({
          label: this.translateSrv.instant('date'), value: 'date'
        });
      }
    }
    this.formProperties.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formProperties.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formProperties.dirty && this.formProperties.valid))
      .subscribe(() => this.checkProperties());
  }

  getSortedByList() {
    this.sortedByList = this.modelProperties
      .filter(p => p.type !== TypePropertyEnum.GroupModel)
      .filter(p => p.label !== undefined && p.label.length > 0)
      .filter(p => p.name !== undefined && p.name.length > 0)
      .filter(p => p.active)
      .map(p => ({ label: p.label, value: p.name }));
    if (this.sortedByList.length > 0) {
      this.sortedByList.unshift(
        ...[
          { label: this.translateSrv.instant('name'), value: 'name' },
          { label: this.translateSrv.instant('fullName'), value: "fullName" }
        ]
      );
      if (this.workpackModelType === TypeWorkpackModelEnum.MilestoneModel) {
        this.sortedByList.push({
          label: this.translateSrv.instant('date'), value: 'date'
        });
      }
    } else {
      this.sortedByList =[
          { label: this.translateSrv.instant('name'), value: 'name' },
          { label: this.translateSrv.instant('fullName'), value: "fullName" }
      ];
      if (this.workpackModelType === TypeWorkpackModelEnum.MilestoneModel) {
        this.sortedByList.push({
          label: this.translateSrv.instant('date'), value: 'date'
        });
      }
    }
    
  }

  resetValues() {
    if (this.formProperties) {
      this.formProperties.reset();
      this.formProperties.controls.icon.setValue(this.workpackModelType ?
        [IconsTypeWorkpackModelEnum[this.workpackModelType], Validators.required] :
        [undefined, Validators.required]);
      this.formProperties.controls.sortedBy.setValue('name');
      this.sortedByList = [
        { label: this.translateSrv.instant('name'), value: 'name' }
      ];
    }
    this.stakeholders = ['manager', 'teamMember', 'sponsor', 'partner', 'funder', 'client', 'competitor'].map(item => this.translateSrv.instant(item));
    this.dashboardPanel = {
      dashboardShowEva: false,
      dashboardShowMilestones: false,
      dashboardShowRisks: false,
      dashboardShowStakeholders: this.stakeholders,
      dashboardStakeholderRolesOptions: this.stakeholders.map(item => ({
        label: this.translateSrv.instant(item),
        value: this.translateSrv.instant(item)
      })),
    };
    this.posibleRolesPerson = this.rolesPersonOptions.map(role => this.translateSrv.instant(role));
    this.posibleRolesOrg = this.rolesOrgOptions.map(role => this.translateSrv.instant(role));
    this.modelProperties = [];
    this.childrenModels = [];
    this.cardItemsModels = [];
    this.cardProperties = null;
    this.cardPropertiesStakeholders = null;
    this.cardPropertiesNotifications = null;
    this.cardPropertiesDashboard = null;
    this.cardPropertiesRiskAndIssues = null;
    this.cardPropertiesCostAccount = null;
    this.cardPropertiesProcesses = null;
    this.cardPropertiesJournal = null;
    this.cardPropertiesModels = null;
    this.cardPropertiesSchedule = null;
    this.setCurrentBreadcrumb();
  }

  ngOnInit(): void {
    this.currentLang = this.translateSrv.getDefaultLang();
    this.loadIcons();
    this.loadMenuProperty();
  }

  async loadDetails() {
    this.loadCards();
    if (this.idWorkpackModel) {
      if (!this.editPermission) {
        this.formProperties.disable();
      }
      await this.loadWorkpackModel();
    } else if (this.editPermission) {
      this.loadDefaultProperties();
      await this.loadCardItemsModels();
    }
    this.setCurrentBreadcrumb();
  }

  async getOfficeById() {
    this.propertiesOffice = await this.officeSrv.getCurrentOffice(this.idOffice);
    this.idOffice = this.propertiesOffice.id;
  }

  async getPlanModelById() {
    const { data, success } = await this.planModelSrv.GetById(this.idStrategy);
    if (success) {
      this.propertiesPlanModel = data;
    }
  }

  setCurrentBreadcrumb() {
    this.breadcrumbSrv.setMenu(this.getCurrentBreadcrumb());
  }

  startNewBreadcrumb() {
    const { idOffice, idStrategy, workpackModelType: type } = this;
    return [
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
        info: this.translateSrv.instant('planModels'),
        tooltip: 'planModels',
        routerLink: ['/strategies'],
        admin: true,
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'planModel',
        info: this.propertiesPlanModel?.name,
        tooltip: this.propertiesPlanModel?.fullName,
        routerLink: ['/strategies', 'strategy'],
        admin: true,
        queryParams: { id: this.idStrategy, idOffice: this.idOffice }
      },
      ...this.idWorkpackModel
        ? [{
          key: 'workpackModel',
          info: this.modelName,
          tooltip: this.modelNamePlural,
          routerLink: ['/workpack-model'],
          admin: true,
          queryParams: { idStrategy, id: this.idWorkpackModel, type, idOffice }
        }]
        : [{
          key: 'workpackModel',
          routerLink: ['/workpack-model'],
          admin: true,
          queryParams: { idStrategy, type, idOffice, idParent: this.idParentWorkpack }
        }]
    ];
  }

  getCurrentBreadcrumb() {
    const { idOffice, idStrategy, workpackModelType: type } = this;
    let breadcrumb;
    if (this.currentBreadcrumbItems && this.currentBreadcrumbItems.length > 0) {
      const breadcrumbIndex = this.currentBreadcrumbItems.findIndex(item => item.queryParams?.id === this.idWorkpackModel);
      if (breadcrumbIndex > -1) {
        breadcrumb = this.currentBreadcrumbItems.slice(0, breadcrumbIndex + 1);
      } else {
        const breadcrumbOfficeIndex = this.currentBreadcrumbItems.findIndex(item => item.queryParams?.idOffice === idOffice);
        const breadcrumbPlanModelIndex = this.currentBreadcrumbItems.findIndex(item => item.key === 'planModel' && item.queryParams?.id === idStrategy);
        const breadcrumbParentIndex = this.currentBreadcrumbItems.findIndex(item => item.key === 'workpackModel' && item.queryParams?.id === this.idParentWorkpack);
        if (breadcrumbOfficeIndex > -1 && breadcrumbPlanModelIndex > -1 && breadcrumbParentIndex > -1) {
          breadcrumb = [...this.currentBreadcrumbItems,
          ...[{
            key: 'workpackModel',
            info: this.modelName,
            tooltip: this.modelNamePlural,
            admin: true,
            routerLink: ['/workpack-model'],
            queryParams: { idStrategy, id: this.idWorkpackModel, type, idOffice, idParent: this.idParentWorkpack }
          }]
          ];
        } else {
          breadcrumb = this.startNewBreadcrumb();
        }
      }
      return breadcrumb;
    } else {
      breadcrumb = this.startNewBreadcrumb();
      return breadcrumb;
    }
  }

  loadDefaultProperties() {

    const defaultProperties: IWorkpackModelProperty[] = [];
    switch (this.workpackModelType) {
      case TypeWorkpackModelEnum.ProgramModel:
        defaultProperties.push(
          {
            active: true,
            label: this.translateSrv.instant('programObjective'),
            name: this.translateSrv.instant('programObjective'),
            type: TypePropertyEnum.TextAreaModel,
            sortIndex: 3,
            fullLine: true
          },
          {
            active: true,
            label: this.translateSrv.instant('targetAudience'),
            name: this.translateSrv.instant('targetAudience'),
            type: TypePropertyEnum.TextAreaModel,
            sortIndex: 4,
            fullLine: true
          });
        break;
      case TypeWorkpackModelEnum.OrganizerModel:
        defaultProperties.push({
          active: true,
          label: this.translateSrv.instant('orderNumber'),
          name: this.translateSrv.instant('orderNumber'),
          type: TypePropertyEnum.IntegerModel,
          sortIndex: 2,
          fullLine: true
        });
        break;
      case TypeWorkpackModelEnum.DeliverableModel:
        const possibleValuesObj = {
          concluida: "Concluída",
          cancelada: "Cancelada",
          Acancelar: "A cancelar",
          emExecucao: "Em execução",
          aLicitar: "Planejamento\\A Licitar",
          acoesPreparatorias: "Planejamento\\Ações preparatórias",
          contratoAssinado: "Planejamento\\Contrato assinado",
          convenioAssinado: "Planejamento\\Convênio assinado",
          editalPublicado: "Planejamento\\Edital Publicado",
          emLicitacao: "Planejamento\\Em Licitação",
          licitacaoConcluida: "Planejamento\\Licitação concluída",
          projetoElaborado: "Planejamento\\Projeto elaborado",
          projetoEmElaboracao: "Planejamento\\Projeto em elaboração",
          paralisada: "Paralisada"
        };

        defaultProperties.push(
          {
            active: true,
            label: this.translateSrv.instant('type'),
            name: this.translateSrv.instant('type'),
            type: TypePropertyEnum.SelectionModel,
            multipleSelection: false,
            possibleValuesOptions: Object.values(this.translateSrv.instant(['construction', 'service', 'planStudySearch',
              'standard', 'equipment', 'others'])),
            sortIndex: 2,
            defaultValue: this.translateSrv.instant('construction'),
            fullLine: false,
            required: true
          },
          {
            active: true,
            label: this.translateSrv.instant('status'),
            name: this.translateSrv.instant('status'),
            type: TypePropertyEnum.SelectionModel,
            multipleSelection: false,
            obligatory: true,
            disableMultipleSelection: true,
            possibleValuesOptions: Object.values(possibleValuesObj),
            defaultValue: "Planejamento\\Ações preparatórias",
            sortIndex: 3,
            fullLine: false,
            required: true,
            
          },
          {
            active: true,
            label: this.translateSrv.instant('annualOperationCost'),
            name: this.translateSrv.instant('annualOperationCost'),
            type: TypePropertyEnum.CurrencyModel,
            sortIndex: 4,
            fullLine: false
          },
          {
            active: true,
            label: this.translateSrv.instant('measureUnit'),
            name: this.translateSrv.instant('measureUnit'),
            type: TypePropertyEnum.UnitSelectionModel,
            multipleSelection: false,
            obligatory: true,
            required: true,
            sortIndex: 5,
            fullLine: false,
          }
        );
        break;
      case TypeWorkpackModelEnum.ProjectModel:
        defaultProperties.push(
          {
            active: true,
            label: this.translateSrv.instant('justification'),
            name: this.translateSrv.instant('justification'),
            type: TypePropertyEnum.TextAreaModel,
            sortIndex: 2,
            fullLine: true,
            required: true,
            rows: 3,
            max: 500
          },
          {
            active: true,
            label: this.translateSrv.instant('Status do Projeto'),
            name: this.translateSrv.instant('status'),
            type: TypePropertyEnum.SelectionModel,
            multipleSelection: false,
            obligatory: true,
            disableMultipleSelection: true,
            possibleValuesOptions: [
              "Concluído",
              "Cancelado",
              "A cancelar",
              "Execução",
              "Estruturação",
              "Suspenso",
              "Paralisado",
              "Planejamento"
            ],
            defaultValue: "Execução",
            sortIndex: 3,
            fullLine: false,
            required: true,
            
          },
          {
            active: true,
            label: this.translateSrv.instant('projectObjective'),
            name: this.translateSrv.instant('projectObjective'),
            type: TypePropertyEnum.TextAreaModel,
            sortIndex: 3,
            fullLine: true,
            required: true,
            rows: 3,
            max: 500
          },
          {
            active: true, label: this.translateSrv.instant('scope'), name: this.translateSrv.instant('scope'),
            type: TypePropertyEnum.TextAreaModel,
            sortIndex: 4,
            fullLine: true,
            required: true,
            rows: 3,
            max: 500
          },
          {
            active: true,
            label: this.translateSrv.instant('targetAudience'),
            name: this.translateSrv.instant('targetAudience'),
            type: TypePropertyEnum.TextAreaModel,
            sortIndex: 5,
            fullLine: true,
            required: true,
            rows: 3,
            max: 500
          },

          {
            active: true, label: this.translateSrv.instant('premises'), name: this.translateSrv.instant('premises'),
            type: TypePropertyEnum.TextAreaModel,
            sortIndex: 6,
            fullLine: true,
            required: true,
            rows: 3,
            max: 500
          },
          {
            active: true,
            label: this.translateSrv.instant('restrictions'),
            name: this.translateSrv.instant('restrictions'),
            type: TypePropertyEnum.TextAreaModel,
            sortIndex: 7,
            fullLine: true,
            required: true,
            rows: 3,
            max: 500
          }
        );
        break;
      case TypeWorkpackModelEnum.MilestoneModel:
        defaultProperties.push(
          {
            active: true,
            label: this.translateSrv.instant('type'),
            name: this.translateSrv.instant('type'),
            type: TypePropertyEnum.SelectionModel,
            multipleSelection: false,
            possibleValuesOptions: Object.values(this.translateSrv.instant(['projectManagement', 'agreement', 'environmentalLicensing',
              'standard', 'engineeringProject', 'construction', 'bidding', 'PPP', 'PMI', 'informationSystem'])),
            sortIndex: 4,
            defaultValue: this.translateSrv.instant('construction'),
            fullLine: false,
            required: true
          }
        );
        break;
    }
    defaultProperties.forEach(prop => this.checkProperty(prop));
    this.modelProperties = defaultProperties;
  }

  async loadWorkpackModel() {
    const { data, success } = await this.workpackModelSrv.GetById(this.idWorkpackModel);
    if (success) {
      this.modelName = data.modelName,
        this.modelNamePlural = data.modelNameInPlural;
      this.workpackModelType = TypeWorkpackModelEnum[data.type];
      this.formProperties.reset({
        name: data.modelName,
        nameInPlural: data.modelNameInPlural || '',
        icon: data.fontIcon || '',
        position: data.position || 1,
        sortedBy: data.sortBy ? data.sortBy.name : (data.sortByField || 'name' ) 
      });
      this.posibleRolesOrg = data.organizationRoles || [];
      this.posibleRolesPerson = data.personRoles || [];
      if (data.properties) {
        const dataPropertiesAndIndex = (await Promise.all(data.properties.filter(property => property.session !== 'COST')
          .map(async (p, i) => {
            if (p.possibleValues) {
              p.possibleValuesOptions = (p.possibleValues as string).split(',');
            }
            if (p.defaultValue && p.multipleSelection) {
              p.defaultValue = (p.defaultValue as string).split(',');
            }
            if (p.idDomain) {
              p.extraList = await this.getListLocalities(p.idDomain, p.multipleSelection);
              p.extraListDefaults = await this.getListLocalitiesDefaults(p);
              const defaultsLocalities = p.defaults as number[];
              if (defaultsLocalities && defaultsLocalities.length === 1) {
                const resultLocality = await this.localitySrv.GetById(defaultsLocalities[0]);
                if (resultLocality.success) {
                  p.selectedLocalities = resultLocality.data.name;
                  p.showIconButtonSelectLocality = false;
                }
              }
              if (defaultsLocalities && defaultsLocalities.length > 1) {
                p.selectedLocalities = `${defaultsLocalities.length} ${this.translateSrv.instant('selectedsLocalities')}`;
                p.showIconButtonSelectLocality = false;
              }
              if (!defaultsLocalities || (defaultsLocalities && defaultsLocalities.length === 0)) {
                p.selectedLocalities = this.translateSrv.instant('selectDefaultValue');
                p.showIconButtonSelectLocality = true;
              }
            }
            if (p.sectors) {
              p.sectorsList = p.sectors.split(',').map(sector => sector.toUpperCase());
            }
            if (p.defaults) {
              const isArray = p.defaults instanceof Array;
              if (!p.multipleSelection && isArray) {
                p.defaults = (p.defaults as any[]).shift();
              }
            }
            if (p.type === TypePropertyEnum.DateModel) {
              const value = p.defaultValue && p.defaultValue.toLocaleString();
              p.defaultValue = value && new Date(value);
            }
            p.helpText = p.helpText ? p.helpText : '';
            if (p.type === TypePropertyEnum.GroupModel) {
              p.menuModelProperties = this.loadMenuPropertyGroup(p);
              p.groupedProperties.forEach(async (gp) => {
                if (gp.possibleValues) {
                  gp.possibleValuesOptions = (gp.possibleValues as string).split(',');
                }
                if (gp.defaultValue && gp.multipleSelection) {
                  gp.defaultValue = (gp.defaultValue as string).split(',');
                }
                if (gp.sectors) {
                  gp.sectorsList = gp.sectors.split(',').map(sector => sector.toUpperCase());
                }
                gp.helpText = gp.helpText ? gp.helpText : '';
                if (gp.idDomain) {
                  gp.extraList = await this.getListLocalities(gp.idDomain, gp.multipleSelection);
                  gp.extraListDefaults = await this.getListLocalitiesDefaults(gp);
                  const defaultsLocalities = gp.defaults as number[];
                  if (defaultsLocalities && defaultsLocalities.length === 1) {
                    const resultLocality = await this.localitySrv.GetById(defaultsLocalities[0]);
                    if (resultLocality.success) {
                      gp.selectedLocalities = resultLocality.data.name;
                      gp.showIconButtonSelectLocality = false;
                    }
                  }
                  if (defaultsLocalities && defaultsLocalities.length > 1) {
                    gp.selectedLocalities = `${defaultsLocalities.length} ${this.translateSrv.instant('selectedsLocalities')}`;
                    gp.showIconButtonSelectLocality = false;
                  }
                  if (!defaultsLocalities || (defaultsLocalities && defaultsLocalities.length === 0)) {
                    gp.selectedLocalities = this.translateSrv.instant('selectDefaultValue');
                    gp.showIconButtonSelectLocality = true;
                  }
                }
                if (gp.defaults) {
                  const isArray = gp.defaults instanceof Array;
                  if (!gp.multipleSelection && isArray) {
                    gp.defaults = (gp.defaults as any[]).shift();
                  }
                }
                if (gp.type === TypePropertyEnum.DateModel) {
                  const value = gp.defaultValue && gp.defaultValue.toLocaleString();
                  gp.defaultValue = value && new Date(value);
                }
                delete gp.defaultsDetails;
                await this.checkProperty(gp);
              });
            }
            delete p.defaultsDetails;
            await this.checkProperty(p);
            return [p, i];
          }))
        );
        const dataProperties = dataPropertiesAndIndex
          .sort((a, b) => a[1] > b[1] ? 1 : -1)
          .map(prop => prop[0] as IWorkpackModelProperty);
        this.modelProperties = dataProperties;
      }
      this.getSortedByList();
      this.cardPropertiesCostAccount.initialStateToggle = data.costSessionActive;
      this.cardPropertiesJournal.initialStateToggle = data.journalManagementSessionActive;
      this.cardPropertiesModels.initialStateToggle = data.childWorkpackModelSessionActive;
      this.cardPropertiesStakeholders.initialStateToggle = data.stakeholderSessionActive;
      this.cardPropertiesNotifications.initialStateToggle = data.notificationsSessionActive;
      this.cardPropertiesDashboard.initialStateToggle = data.dashboardSessionActive;
      this.dashboardPanel = {
        dashboardShowEva: data.dashboardShowEva,
        dashboardShowMilestones: data.dashboardShowMilestones,
        dashboardShowRisks: data.dashboardShowRisks,
        dashboardShowStakeholders: data.dashboardShowStakeholders,
        dashboardStakeholderRolesOptions: ((data.organizationRoles && data.organizationRoles.length > 0)
          || (data.personRoles && data.personRoles.length > 0)) ?
          data.organizationRoles.concat(data.personRoles).map(item => ({ label: item, value: item })) :
          this.stakeholders.map(item => ({ label: this.translateSrv.instant(item), value: this.translateSrv.instant(item) })),
      };
      this.notificationsStakeholderRolesOptions = (data.personRoles && data.personRoles.length > 0) ?
          data.personRoles.map(item => ({ label: item, value: item })) :
          this.posibleRolesPerson.map(item => ({
            label: this.translateSrv.instant(item),
            value: this.translateSrv.instant(item),
          }));
      this.notifications = {
        selectedRoles: data.notificationsSelectedRoles,
        eventMilestone: {
          enabled: data.notificationsEventMilestoneEnabled,
          daysBefore: data.notificationsEventMilestoneDaysBefore
        },
        eventSchedule: {
          enabled: data.notificationsEventScheduleEnabled,
          dayOfMonth: data.notificationsEventScheduleDayOfMonth
        }
      };
      this.cardPropertiesRiskAndIssues.initialStateToggle = data.riskAndIssueManagementSessionActive;
      this.cardPropertiesProcesses.initialStateToggle = data.processesManagementSessionActive;
      if (this.workpackModelType === TypeWorkpackModelEnum.DeliverableModel) {
        this.cardPropertiesSchedule.initialStateToggle = data.scheduleSessionActive;
      }
      this.childrenModels = (data.children || []);
      this.totalRecords = data.children && data.children.length + 1;
      await this.loadCardItemsModels();
      this.cardProperties.isLoading = false;
    }
  }

  async addProperty(type: TypePropertyEnum, groupProperty?: IWorkpackModelProperty) {
    const newProperty: IWorkpackModelProperty = {
      type,
      active: true,
      label: '',
      name: '',
      sortIndex: !groupProperty ? this.modelProperties.length : groupProperty.groupedProperties.length,
      fullLine: true,
      required: false,
      multipleSelection: false,
      sectorsList: type === TypePropertyEnum.OrganizationSelectionModel ?
        [TypeOrganization.Private.toUpperCase(), TypeOrganization.Public.toUpperCase(), TypeOrganization.Third.toUpperCase()] : [],
      selectedLocalities: type === TypePropertyEnum.LocalitySelectionModel && this.translateSrv.instant('selectDefaultValue'),
      showIconButtonSelectLocality: type === TypePropertyEnum.LocalitySelectionModel
    };
    newProperty.isCollapsed = false;
    await this.checkProperty(newProperty);
    this.saveButton?.hideButton();
    if (type === TypePropertyEnum.GroupModel) {
      newProperty.groupedProperties = [];
      newProperty.menuModelProperties = this.loadMenuPropertyGroup(newProperty);
    }
    return groupProperty
      ? groupProperty.groupedProperties.push(newProperty)
      : this.modelProperties.push(newProperty);
  }

  async checkProperty(property: IWorkpackModelProperty) {
    let list = [];
    let requiredFields = ['name', 'label', 'sortIndex'];
    switch (property.type) {
      case TypePropertyEnum.LocalitySelectionModel:
        requiredFields = requiredFields.concat(['idDomain', 'multipleSelection']);
        list = await this.getListDomains();
        break;
      case TypePropertyEnum.OrganizationSelectionModel:
        requiredFields = requiredFields.concat(['multipleSelection', 'sectors']);
        property.sectors = property.sectorsList.map(sec => sec.toLowerCase()).join(',');
        list = await this.getListOrganizations(property.sectorsList);
        break;
      case TypePropertyEnum.UnitSelectionModel:
        list = await this.getListMeasureUnits();
        break;
      case TypePropertyEnum.SelectionModel:
        requiredFields = requiredFields.concat(['possibleValuesOptions', 'multipleSelection']);
        break;
      case TypePropertyEnum.GroupModel:
        requiredFields = ['name', 'sortIndex', 'groupedProperties'];
        break;
      case TypePropertyEnum.NumberModel:
        requiredFields = requiredFields.concat(['precision']);
        property.precision = 3;
        break;
      default:
        break;
    }
    property.isCollapsed = property.isCollapsed === undefined || property.isCollapsed;
    property.list = list;
    property.requiredFields = requiredFields;
    property.viewOnly = !this.editPermission;
    property.obligatory = !!property.obligatory ||
      [
        ...(this.workpackModelType === TypeWorkpackModelEnum.DeliverableModel
          ? ['Measure Unit', 'Unidade de Medida', 'Situação', 'Status']
          : []),
        ...(this.workpackModelType === TypeWorkpackModelEnum.ProjectModel
          ? ['Situação', 'Status']
          : []),
      ].includes(property.name);

    property.disableMultipleSelection = property.name === 'Situação' || property.name === 'Status';
  }

  async deleteProperty(property: IWorkpackModelProperty, group?: IWorkpackModelProperty) {
    if (property.id) {
      const result = await this.workpackModelSrv.canDeleteProperty(property.id);
      if (!result.success || result.data === false) {
        this.messageSrv.add({
          severity: 'warn',
          summary: this.translateSrv.instant('warn'),
          detail: this.translateSrv.instant('messages.cantRemovePropertyUsedInWorkpack')
        });
        return;
      }
    }

    this.confirmationSrv.confirm({
      message: `${this.translateSrv.instant('messages.deletePropertyConfirmation')} ${property.label}?`,
      key: 'deleteConfirm',
      acceptLabel: this.translateSrv.instant('yes'),
      rejectLabel: this.translateSrv.instant('no'),
      accept: () => {
        if (group) {
          group.groupedProperties = group.groupedProperties.filter(prop => prop !== property);
        } else {
          this.modelProperties = this.modelProperties.filter(p => p !== property);
        }
        if (property.id) {
          this.saveButton?.showButton();
        }
      }
    });
  }

  async propertyChanged(event) {
    if (event?.property && event.property?.idDomain && this.editPermission) {
      // Domain selection changed

      if (!!event.domainChanged || !!event.multipleSelectedChanged) {
        event.property.extraList = await this.getListLocalities(event.property?.idDomain, event.property?.multipleSelection);
        event.property.extraListDefaults = await this.getListLocalitiesDefaults(event.property);
        event.property.selectedLocalities = this.translateSrv.instant('selectDefaultValue');
        event.property.showIconButtonSelectLocality = true;
      } else {
        if (!event.property.multipleSelection) {
          const selectedLocality = event.property.extraListDefaults as TreeNode;
          event.property.defaults = [selectedLocality.data];
          event.property.selectedLocalities = selectedLocality.label;
          event.property.showIconButtonSelectLocality = false;
        }
        if (event.property.multipleSelection) {
          const selectedLocality = event.property.extraListDefaults as TreeNode[];
          event.property.defaults = selectedLocality.filter(local => local.data && !local.data.toString().includes('SELECTALL')).map(l => l.data);
          if (selectedLocality.length > 1) {
            event.property.selectedLocalities =
              `${selectedLocality.filter(local => local.data && !local.data.toString().includes('SELECTALL')).length} ${this.translateSrv.instant('selectedsLocalities')}`;
            event.property.showIconButtonSelectLocality = false;
          } else {
            event.property.selectedLocalities = selectedLocality.length > 0 ?
              selectedLocality[0].label : this.translateSrv.instant('selectDefaultValue');
            event.property.showIconButtonSelectLocality = selectedLocality.length <= 0;
          }
        }
      }
    }
    if (event?.property && event.property?.sectorsList && this.editPermission) {
      if (!!event.sectorChanged) {
        event.property.sectors = event.property?.sectorsList.map(sec => sec.toLowerCase()).join(',');
        event.property.list = await this.getListOrganizations(event.property.sectorsList);
        event.property.defaults = [];
      }
    }
    this.checkProperties();
  }

  checkProperties(changeStakeholderRoles = false) {
    this.cancelButton.showButton();
    if (this.formProperties.invalid) {
      this.saveButton?.hideButton();
      return;
    }
    const properties: IWorkpackModelProperty[] = [...this.modelProperties];
    const hasInvalidMax = properties.some(p =>
      [TypePropertyEnum.IntegerModel, TypePropertyEnum.TextModel, TypePropertyEnum.TextAreaModel]
        .includes(p.type as TypePropertyEnum) &&
      (p.max === null || p.max === undefined || p.max <= 0)
    );
    if (hasInvalidMax) {
      this.saveButton?.hideButton();
      return;
    }
    // Value check
    const propertiesChecks: { valid: boolean; invalidKeys: string[]; prop: IWorkpackModelProperty }[] = properties.map(p => ({
      valid: p.requiredFields
        .map(r => (p[r] instanceof Array
          ? p[r].length > 0
          : typeof p[r] == 'boolean' || typeof p[r] == 'number' || !!p[r]))
        .reduce((acc, v) => acc ? v : acc, true),
      invalidKeys: p.requiredFields
        .filter(r => !(p[r] instanceof Array
          ? p[r].length > 0
          : typeof p[r] == 'boolean' || typeof p[r] == 'number' || !!p[r])),
      prop: p
    }));
    const arePropertiesValid = propertiesChecks.reduce((a, b) => a ? b.valid : a, true);
    // Stakeholder
    const arePossiblesValuesValid = (this.posibleRolesOrg.length > 0 || this.posibleRolesPerson.length > 0)
      || !this.cardPropertiesStakeholders.initialStateToggle
      || this.workpackModelType === TypeWorkpackModelEnum.MilestoneModel;

    if (this.formProperties.invalid || !arePropertiesValid || !arePossiblesValuesValid) {
      this.saveButton?.hideButton();
      return;
    }
    if (this.dashboardPanel && !!changeStakeholderRoles) {
      this.dashboardPanel.dashboardStakeholderRolesOptions = ((this.posibleRolesPerson && this.posibleRolesPerson.length > 0) || (this.posibleRolesOrg && this.posibleRolesOrg.length > 0)) ?
        this.posibleRolesPerson.concat(this.posibleRolesOrg).map(item => ({ label: item, value: item })) :
        this.stakeholders.map(item => ({ label: this.translateSrv.instant(item), value: this.translateSrv.instant(item) }));

      this.dashboardPanel.dashboardShowStakeholders = this.dashboardPanel.dashboardShowStakeholders
        .filter(option => this.dashboardPanel.dashboardStakeholderRolesOptions.find(role => role.value === option));
    }
    if (this.cardPropertiesNotifications?.initialStateToggle && changeStakeholderRoles) {

      const roles = this.posibleRolesPerson || [];
      this.notificationsStakeholderRolesOptions = roles.map(item => ({
        label: this.translateSrv.instant(item),
        value: this.translateSrv.instant(item),
      }));
      this.notifications.selectedRoles =
        this.notifications.selectedRoles.filter(role =>
          this.notificationsStakeholderRolesOptions.find(opt => opt.value === role)
        );
    }
    const separationForDuplicateCheck = properties.map(prop => [prop.name, prop.label])
      .reduce((a, b) => ((a[0].push(b[0])), a[1].push(b[1]), a), [[], []]);
    // Duplicated name check
    if (new Set(separationForDuplicateCheck[0]).size !== properties.length) {
      this.saveButton?.hideButton();
      return;
    }
    // Duplicated label check
    if (new Set(separationForDuplicateCheck[1]).size !== properties.length) {
      this.saveButton?.hideButton();
      return;
    }
    let showButton = true;
    properties.filter(prop => prop.type === TypePropertyEnum.GroupModel).forEach(propGroup => {
      const showSaveButton = this.checkPropertiesGroupeds(propGroup.groupedProperties);
      if (!showSaveButton) {
        this.saveButton?.hideButton();
        showButton = false;
        return;
      }
    });
    if (showButton) {
      this.saveButton?.showButton();
      return;
    }
  }

  checkPropertiesGroupeds(groupedProperties?: IWorkpackModelProperty[]) {
    const properties: IWorkpackModelProperty[] = [...groupedProperties];
    // Value check
    const propertiesChecks: { valid: boolean; invalidKeys: string[]; prop: IWorkpackModelProperty }[] = properties.map(p => ({
      valid: p.requiredFields
        .map(r => (p[r] instanceof Array
          ? p[r].length > 0
          : typeof p[r] == 'boolean' || typeof p[r] == 'number' || !!p[r]))
        .reduce((acc, v) => acc ? v : acc, true),
      invalidKeys: p.requiredFields
        .filter(r => !(p[r] instanceof Array
          ? p[r].length > 0
          : typeof p[r] == 'boolean' || typeof p[r] == 'number' || !!p[r])),
      prop: p
    }));
    const arePropertiesValid = propertiesChecks.reduce((a, b) => a ? b.valid : a, true);
    // Stakeholder
    const arePossiblesValuesValid = (this.posibleRolesOrg.length > 0 && this.posibleRolesPerson.length > 0)
      || !this.cardPropertiesStakeholders.initialStateToggle
      || this.workpackModelType === TypeWorkpackModelEnum.MilestoneModel;

    if (this.formProperties.invalid || !arePropertiesValid || !arePossiblesValuesValid) {
      return false;
    }
    const separationForDuplicateCheck = properties.map(prop => [prop.name, prop.label])
      .reduce((a, b) => ((a[0].push(b[0])), a[1].push(b[1]), a), [[], []]);
    // Duplicated name check
    if (new Set(separationForDuplicateCheck[0]).size !== properties.length) {
      return false;
    }
    // Duplicated label check
    return new Set(separationForDuplicateCheck[1]).size === properties.length;
  }

  addGroup(groupProperty?: IWorkpackModelProperty) {
    return this.addProperty(TypePropertyEnum.GroupModel, groupProperty);
  }

  async getListDomains() {
    if (!this.listDomains.length) {
      const result = await this.domainSrv.GetAll();
      if (result.success) {
        this.listDomains = result.data
          .filter(d => d.office?.id === this.idOffice)
          .map(d => ({ label: d.name, value: d.id }));
      }
    }
    return this.listDomains;
  }

  async getListOrganizations(sectors: string[]) {
    if (!this.listOrganizations.length) {
      const result = await this.organizationSrv.GetAll({ 'id-office': this.idOffice });
      if (result.success) {
        this.listOrganizations = result.data;
      }
    }
    return this.listOrganizations.filter(org => sectors && sectors.includes(org.sector)).map(d => ({ label: d.name, value: d.id }));
  }

  async getListMeasureUnits() {
    if (!this.listMeasureUnits.length) {
      const result = await this.measureUnitSrv.GetAll({ idOffice: this.idOffice });
      if (result.success) {
        this.listMeasureUnits = result.data.map(d => ({ label: d.name, value: d.id }));
      }
    }
    return this.listMeasureUnits;
  }

  async getListLocalities(idDomain: number, multipleSelection: boolean) {
    const localityList = await this.loadDomainLocalities(idDomain);
    const selectable = this.editPermission;
    const localityRoot = localityList[0];
    const rootNode: TreeNode = {
      label: localityRoot.name,
      data: localityRoot.id,
      children: this.loadLocality(localityRoot.children, selectable, multipleSelection),
      selectable
    };
    return [rootNode];
  }

  async getListLocalitiesDefaults(property: IWorkpackModelProperty) {
    const defaultSelectedLocalities = property.defaults ? property.defaults as number[] : undefined;
    if (defaultSelectedLocalities?.length > 0) {
      const selectedLocalityList = this.loadSelectedLocality(defaultSelectedLocalities, property.extraList);
      return property.multipleSelection
        ? selectedLocalityList as TreeNode[]
        : selectedLocalityList[0] as TreeNode;
    }
  }

  loadSelectedLocality(seletectedIds: number[], list: TreeNode[]) {
    let result = [];
    list.forEach(l => {
      if (seletectedIds.includes(l.data)) {
        result.push(l);
      }
      if (l.children && l.children.length > 0) {
        const resultChildren = this.loadSelectedLocality(seletectedIds, l.children);
        result = result.concat(resultChildren);
      }
    });
    return result;
  }

  loadLocality(localityList: ILocalityList[], selectable: boolean, multipleSelection: boolean) {
    const list: TreeNode[] = localityList?.map(locality => {
      if (locality.children) {
        return {
          label: locality.name,
          data: locality.id,
          children: this.loadLocality(locality.children, selectable, multipleSelection),
          selectable,
        };
      }
      return { label: locality.name, data: locality.id, selectable };
    });
    list.sort((a, b) => a.label < b.label ? -1 : 0)
    if (selectable && multipleSelection) {
      this.addSelectAllNode(list, localityList, selectable);
    }

    return list;
  }

  addSelectAllNode(list: TreeNode[], localityList: ILocalityList[], selectable: boolean) {
    list?.unshift({
      label: this.translateSrv.instant('selectAll'),
      key: 'SELECTALL' + localityList[0]?.id,
      selectable,
      styleClass: 'green-node',
      data: 'SELECTALL' + localityList[0]?.id,
    });
  }

  async loadDomainLocalities(idDomain: number) {
    const result = await this.localitySrv.getLocalitiesTreeFromDomain({ 'id-domain': idDomain });
    if (result) {
      return result as ILocalityList[];
    }
  }


  loadMenuProperty() {
    if (this.currentLang && !['pt-BR', 'en-US'].includes(this.currentLang)) {
      return;
    }
    const menu = Object.keys(TypePropertyEnum).filter(k => k !== TypePropertyEnum.GroupModel)
      .map(type => ({
        label: this.translateSrv.instant(`labels.${TypePropertyEnum[type]}`),
        icon: IconPropertyEnum[TypePropertyEnum[type]],
        command: () => this.addProperty(TypePropertyEnum[type])
      }));
    this.menuModelProperties = menu;
  }

  loadMenuPropertyGroup(groupProperty?: IWorkpackModelProperty) {
    if (this.currentLang && !['pt-BR', 'en-US'].includes(this.currentLang)) {
      return;
    }
    if (groupProperty) {
      return Object.keys(TypePropertyEnum).filter(k => k !== TypePropertyEnum.GroupModel)
        .map(type => ({
          label: this.translateSrv.instant(`labels.${TypePropertyEnum[type]}`),
          icon: IconPropertyEnum[TypePropertyEnum[type]],
          command: () => this.addProperty(TypePropertyEnum[type], groupProperty)
        }));
    }
  }

  loadIcons() {
    let regularIcons: IIcon[] = [];
    let solidIcons: IIcon[] = [];
    switch (this.currentLang) {
      case 'pt-BR':
        regularIcons = IconsRegularPt
          .map((icon, index) => ({ name: `far fa-${IconsRegularEng[index]}`, label: icon.replace(/-/g, ' ') }));
        solidIcons = IconsSolidPt
          .map((icon, index) => ({ name: `fas fa-${IconsSolidEng[index]}`, label: icon.replace(/-/g, ' ') }));
        break;
      case 'en-US':
        regularIcons = IconsRegularEng
          .map(icon => ({ name: `far fa-${icon}`, label: icon.replace(/-/g, ' ') }));
        solidIcons = IconsSolidEng
          .map(icon => ({ name: `fas fa-${icon}`, label: icon.replace(/-/g, ' ') }));
        break;
    }
    this.icons = regularIcons.concat(solidIcons);
  }

  loadCards() {
    this.cardProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      isLoading: this.idWorkpackModel ? true : false,
      initialStateCollapse: false
    };
    this.cardPropertiesStakeholders = {
      toggleable: this.editPermission,
      initialStateToggle: this.workpackModelType === TypeWorkpackModelEnum.ProjectModel,
      cardTitle: 'stakeholders',
      collapseble: true,
      initialStateCollapse: false,
      onToggle: new EventEmitter<boolean>()
    };
    this.cardPropertiesNotifications = {
      toggleable: this.editPermission,
      initialStateToggle: this.workpackModelType === TypeWorkpackModelEnum.ProjectModel,
      cardTitle: 'notifications',
      collapseble: true,
      initialStateCollapse: false,
      onToggle: new EventEmitter<boolean>()
    };
    this.cardPropertiesDashboard = {
      toggleable: this.editPermission,
      initialStateToggle: false,
      cardTitle: 'dashboard',
      collapseble: true,
      initialStateCollapse: false,
      onToggle: new EventEmitter<boolean>()
    };
    this.cardPropertiesRiskAndIssues = {
      toggleable: this.editPermission,
      initialStateToggle: false,
      cardTitle: 'riskAndIssuesManagement',
      collapseble: false,
      initialStateCollapse: true,
      onToggle: new EventEmitter<boolean>()
    };
    this.cardPropertiesProcesses = {
      toggleable: this.editPermission,
      initialStateToggle: false,
      cardTitle: 'processesManagement',
      collapseble: false,
      initialStateCollapse: true,
      onToggle: new EventEmitter<boolean>()
    };
    this.cardPropertiesRiskAndIssues.onToggle.pipe(takeUntil(this.$destroy)).subscribe(e => {
      this.checkProperties();
    });
    this.cardPropertiesProcesses.onToggle.pipe(takeUntil(this.$destroy)).subscribe(e => {
      this.checkProperties();
    });
    this.cardPropertiesStakeholders.onToggle.pipe(takeUntil(this.$destroy)).subscribe(() => {
      if (!!this.cardPropertiesStakeholders.initialStateToggle) {
        this.posibleRolesPerson = this.rolesPersonOptions.map(role => this.translateSrv.instant(role));
        this.posibleRolesOrg = this.rolesOrgOptions.map(role => this.translateSrv.instant(role));
        this.cardPropertiesStakeholders = Object.assign({}, {
          ...this.cardPropertiesStakeholders,
          initialStateCollapse: true
        });
        this.dashboardPanel.dashboardShowStakeholders = this.posibleRolesPerson && this.posibleRolesOrg ? this.posibleRolesPerson.concat(this.posibleRolesOrg) : [];
        this.dashboardPanel.dashboardStakeholderRolesOptions = this.posibleRolesPerson && this.posibleRolesOrg ?
          this.posibleRolesPerson.concat(this.posibleRolesOrg).map(item => ({
            label: item,
            value: item
          })) : [];
      } else {
        this.posibleRolesPerson = [];
        this.posibleRolesOrg = [];
      }
      this.checkProperties();
    });
    this.cardPropertiesNotifications.onToggle
      .pipe(takeUntil(this.$destroy))
      .subscribe(() => {
        if (!!this.cardPropertiesNotifications.initialStateToggle) {

          this.notifications.selectedRoles = ['manager'].map(item => this.translateSrv.instant(item));

          this.notifications.eventMilestone = {
            enabled: true,
            daysBefore: 7
          };

          this.notifications.eventSchedule = {
            enabled: true,
            dayOfMonth: 10
          };

          this.cardPropertiesNotifications = {
            ...this.cardPropertiesNotifications,
            initialStateCollapse: true
          };

        } else {
          this.notifications.selectedRoles = [];
          this.notifications.eventMilestone = {
            enabled: false,
            daysBefore: null
          };
          this.notifications.eventSchedule = {
            enabled: false,
            dayOfMonth: null
          };
        }

        this.checkProperties();
    });
    this.cardPropertiesDashboard.onToggle.pipe(takeUntil(this.$destroy)).subscribe(() => {
      if (!!this.cardPropertiesDashboard.initialStateToggle) {
        this.cardPropertiesDashboard = Object.assign({}, {
          ...this.cardPropertiesDashboard,
          initialStateCollapse: true
        });
        if (this.posibleRolesOrg.length === 0 && this.posibleRolesPerson.length === 0) {
          this.dashboardPanel = {
            dashboardShowEva: false,
            dashboardShowMilestones: false,
            dashboardShowRisks: false,
            dashboardShowStakeholders: this.stakeholders,
            dashboardStakeholderRolesOptions: this.stakeholders.map(item => ({
              label: this.translateSrv.instant(item),
              value: this.translateSrv.instant(item)
            })),
          };
        } else {
          this.stakeholders = this.posibleRolesPerson.concat(this.posibleRolesOrg);
          this.dashboardPanel = {
            dashboardShowEva: false,
            dashboardShowMilestones: false,
            dashboardShowRisks: false,
            dashboardShowStakeholders: this.stakeholders,
            dashboardStakeholderRolesOptions: this.stakeholders.map(item => ({
              label: this.translateSrv.instant(item),
              value: this.translateSrv.instant(item)
            })),
          };
        }
      } else {
        this.dashboardPanel = {
          dashboardShowEva: false,
          dashboardShowMilestones: false,
          dashboardShowRisks: false,
          dashboardShowStakeholders: [],
          dashboardStakeholderRolesOptions: this.stakeholders.map(item => ({
            label: this.translateSrv.instant(item),
            value: this.translateSrv.instant(item)
          })),
        };
      }
      this.checkProperties();
    });
    this.cardPropertiesCostAccount = {
      toggleable: this.editPermission,
      initialStateToggle: this.workpackModelType === TypeWorkpackModelEnum.DeliverableModel,
      cardTitle: 'costAccounts',
      collapseble: false,
      initialStateCollapse: false,
      onToggle: new EventEmitter<boolean>()
    };
    this.cardPropertiesCostAccount.onToggle.pipe(takeUntil(this.$destroy)).subscribe(() => this.checkProperties())
    this.cardPropertiesJournal = {
      toggleable: this.editPermission,
      initialStateToggle: false,
      cardTitle: 'journal',
      collapseble: false,
      initialStateCollapse: false,
      onToggle: new EventEmitter<boolean>()
    };
    this.cardPropertiesJournal.onToggle.pipe(takeUntil(this.$destroy)).subscribe(() => this.checkProperties());
    this.cardPropertiesModels = {
      toggleable: this.editPermission,
      initialStateToggle: true,
      cardTitle: 'models',
      collapseble: true,
      initialStateCollapse: false,
      onToggle: new EventEmitter<boolean>()
    };
    this.cardPropertiesModels.onToggle.pipe(takeUntil(this.$destroy)).subscribe(() => this.checkProperties());
    if (this.workpackModelType === TypeWorkpackModelEnum.DeliverableModel) {
      this.cardPropertiesSchedule = {
        toggleable: this.editPermission,
        initialStateToggle: true,
        cardTitle: 'schedule',
        collapseble: false,
        initialStateCollapse: true,
        onToggle: new EventEmitter<boolean>()
      };
      this.cardPropertiesSchedule.onToggle.pipe(takeUntil(this.$destroy)).subscribe(e => {
        if (e && !this.cardPropertiesCostAccount.initialStateToggle) {
          this.messageSrv.add({
            severity: 'warn',
            summary: this.translateSrv.instant('warn'),
            detail: this.translateSrv.instant('messages.cantEnableScheduleWithoutCostAccountOn')
          });
          setTimeout(() => this.cardPropertiesSchedule.initialStateToggle = false, 0);
        }
        this.checkProperties();
      });
    }
  }

  async handleSubmit() {
    this.cancelButton.hideButton();
    this.formIsSaving = true;
    this.modelProperties.forEach(prop => {
      delete prop.extraList;
      delete prop.extraListDefaults;
      prop.possibleValues = prop.possibleValuesOptions && prop.possibleValuesOptions.join(',');
    });
    const propertiesClone: IWorkpackModelProperty[] =
      JSON.parse(JSON.stringify([...this.modelProperties.filter(prop => prop.type !== TypePropertyEnum.GroupModel)]));
    propertiesClone.map(prop => {
      Object.keys(prop).map(key => {
        if (prop[key] && prop[key] instanceof Array && key !== 'defaults') {
          prop[key] = prop[key].map(v => typeof v == 'string' ? v.trim() : v).join(',') as string;
        }
        if (prop[key] && !(prop[key] instanceof Array) && key === 'defaults' && prop.type !== 'UnitSelectionModel') {
          prop[key] = [prop[key]] as number[];
        }
      });
      delete prop.requiredFields;
      delete prop.list;
      delete prop.extraList;
      delete prop.isCollapsed;
      delete prop.viewOnly;
      delete prop.obligatory;
      delete prop.defaultsDetails;
      delete prop.disableMultipleSelection;
    });
    const propertiesGroupClone = [...this.modelProperties.filter(prop => prop.type === TypePropertyEnum.GroupModel)];
    propertiesGroupClone.forEach(propGroup => {
      propGroup.groupedProperties.forEach(p => {
        delete p.extraList;
        delete p.extraListDefaults;
        p.possibleValues = p.possibleValuesOptions && p.possibleValuesOptions.join(',');
      });
      propGroup.label = propGroup.name;
      propGroup.groupedProperties = JSON.parse(JSON.stringify([...propGroup.groupedProperties]));
      propGroup.groupedProperties.map(propGrouped => {
        Object.keys(propGrouped).map(key => {
          if (propGrouped[key] && propGrouped[key] instanceof Array && key !== 'defaults') {
            propGrouped[key] = propGrouped[key].map(v => typeof v == 'string' ? v.trim() : v).join(',') as string;
          }
          if (propGrouped[key] && !(propGrouped[key] instanceof Array) && key === 'defaults' && propGrouped.type !== 'UnitSelectionModel') {
            propGrouped[key] = [propGrouped[key]] as number[];
          }
        });
        delete propGrouped.requiredFields;
        delete propGrouped.list;
        delete propGrouped.extraList;
        delete propGrouped.isCollapsed;
        delete propGrouped.viewOnly;
        delete propGrouped.obligatory;
      });
    });
    const { name: modelName, nameInPlural: modelNameInPlural, icon, sortedBy: sortBy, position } = this.formProperties.value;
    const form: IWorkpackModel = {
      childWorkpackModelSessionActive: !!this.cardPropertiesModels?.initialStateToggle,
      scheduleSessionActive: !!this.cardPropertiesSchedule?.initialStateToggle,
      stakeholderSessionActive: !!this.cardPropertiesStakeholders?.initialStateToggle,
      riskAndIssueManagementSessionActive: !!this.cardPropertiesRiskAndIssues?.initialStateToggle,
      notificationsSessionActive: !!this.cardPropertiesNotifications?.initialStateToggle,
      processesManagementSessionActive: !!this.cardPropertiesProcesses.initialStateToggle,
      costSessionActive: !!this.cardPropertiesCostAccount?.initialStateToggle,
      journalManagementSessionActive: !!this.cardPropertiesJournal?.initialStateToggle,
      dashboardSessionActive: !!this.cardPropertiesDashboard?.initialStateToggle,
      dashboardShowEva: this.dashboardPanel?.dashboardShowEva,
      dashboardShowMilestones: this.dashboardPanel?.dashboardShowMilestones,
      dashboardShowRisks: this.dashboardPanel?.dashboardShowRisks,
      dashboardShowStakeholders: this.dashboardPanel?.dashboardShowStakeholders,
      notificationsSelectedRoles: this.notifications?.selectedRoles,
      notificationsEventMilestoneEnabled: this.notifications?.eventMilestone?.enabled,
      notificationsEventMilestoneDaysBefore: this.notifications?.eventMilestone?.daysBefore,
      notificationsEventScheduleEnabled: this.notifications?.eventSchedule?.enabled,
      notificationsEventScheduleDayOfMonth: this.notifications?.eventSchedule?.dayOfMonth,
      fontIcon: icon,
      type: this.workpackModelType,
      idPlanModel: this.idStrategy,
      modelName,
      modelNameInPlural,
      position,
      sortBy,
      organizationRoles: !!this.cardPropertiesStakeholders?.initialStateToggle ? this.posibleRolesOrg : [],
      personRoles: !!this.cardPropertiesStakeholders?.initialStateToggle ? this.posibleRolesPerson : [],
      properties: [...propertiesClone, ...propertiesGroupClone]
    };
    const isPut = !!this.idWorkpackModel;
    const { success, data } = isPut
      ? await this.workpackModelSrv.put({
        ...{ id: this.idWorkpackModel },
        ...form,
        ...this.idParentWorkpack ? { idParent: this.idParentWorkpack } : {}
      })
      : await this.workpackModelSrv.post({
        ...form,
        ...this.idParentWorkpack ? { idParent: this.idParentWorkpack } : {}
      });
    if (success) {
      if (!isPut) {
        this.idWorkpackModel = data.id;
        this.modelName = this.formProperties.controls.name.value;
        this.modelNamePlural = this.formProperties.controls.nameInPlural.value;
        await this.loadCardItemsModels();
        await this.router.navigate([], {
          queryParams: {
            type: this.workpackModelType,
            idStrategy: this.idStrategy,
            idOffice: this.idOffice,
            id: this.idWorkpackModel,
            ...this.idParentWorkpack ? { idParent: this.idParentWorkpack } : {}
          }
        });
        this.formIsSaving = false;
      }
      await this.refreshPropertiesLists();
      this.setCurrentBreadcrumb();
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.formIsSaving = false;
      this.menuSrv.reloadMenuPlanModel();
    }
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    if (this.idWorkpackModel) {
      this.loadDetails();
    } else {
      this.formProperties.reset({
        name: '',
        nameInPlural: '',
        icon: this.workpackModelType ? [IconsTypeWorkpackModelEnum[this.workpackModelType]] :
          [undefined],
        position: [this.nextPosition || 1],
        sortedBy: 'name'
      });
      this.loadDetails();
    }
  }

  async loadCardItemsModels() {
    this.isLoading = true;
    if (this.idWorkpackModel) {
      await this.loadReusableWorkpackModels();
    }
    const itemsModels: ICardItem[] = this.editPermission
      ? [{
        typeCardItem: 'newCardItemModel',
        iconSvg: true,
        icon: IconsEnum.Plus,
        iconMenuItems: Object.keys(TypeWorkpackModelEnum)
          .map(type => ({
            label: this.translateSrv.instant(`labels.${TypeWorkpackModelEnum[type]}`),
            command: () => this.navigateToWorkpackModel(TypeWorkpackModelEnum[type]),
            icon: IconsTypeWorkpackModelEnum[type]
          })),
        paramsUrlCard: [{ name: 'idStrategy', value: this.idStrategy }]
      }]
      : [];
    if (this.reusableWorkpackModelsList && this.reusableWorkpackModelsList.length > 0 && itemsModels.length > 0) {
      this.reusableWorkpackModelsList.forEach(l => this.expandTreeToTreeNode(l, true));
      itemsModels[0].reuseModelMenuItems = this.reusableWorkpackModelsList;
    }
    if (this.childrenModels) {
      itemsModels.unshift(...this.childrenModels.map(workpackModel => ({
        typeCardItem: 'listItem',
        icon: workpackModel.fontIcon,
        nameCardItem: workpackModel.modelName,
        itemId: workpackModel.id,
        menuItems: this.editPermission ? [
          {
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: () => this.deleteWorkpackModel(workpackModel)
          }
        ] : [],
        urlCard: '/workpack-model',
        paramsUrlCard: [
          { name: 'id', value: workpackModel.id },
          { name: 'type', value: TypeWorkpackModelEnum[workpackModel.type] },
          { name: 'idStrategy', value: this.idStrategy },
          { name: 'idOffice', value: this.idOffice },
          { name: 'idParent', value: this.idWorkpackModel }
        ],
        breadcrumbWorkpackModel: this.getCurrentBreadcrumb()
      })));
    }
    this.cardItemsModels = itemsModels;
    setTimeout(() => {
      this.isLoading = false;
    }, 300)
  }

  loadReuseListOptions(data: IReusableWorkpackModel[], parent?: TreeNode) {
    return data.map(model => {
      if (model.children) {
        const node = {
          label: model.name,
          icon: `${model.icon}`,
          data: model.id,
          children: undefined,
          parent,
          selectable: this.editPermission && model.reusable,
        };
        node.children = this.loadReuseListOptions(model.children, node);
        return node;
      }
      return {
        label: model.name,
        icon: `${model.icon}`,
        data: model.id,
        children: undefined,
        parent,
        selectable: this.editPermission && model.reusable
      };
    });
  }

  expandTreeToTreeNode(node: TreeNode, isExpand: boolean) {
    node.expanded = isExpand;
    if (node.children) {
      node.children.forEach(childNode => {
        this.expandTreeToTreeNode(childNode, isExpand);
      });
    }
  }

  async loadReusableWorkpackModels() {
    const result = await this.workpackModelSrv.getReusableWorkpackModel(this.idWorkpackModel, { 'id-plan-model': this.idStrategy });
    if (result.success) {
      this.reusableWorkpackModelsList = this.loadReuseListOptions(result.data);
    }
  }

  async handleReuseWorkpackModel(event) {
    const idReusableWorkpackModelSelected = event.idModel;
    this.isLoading = true;
    const result = await this.workpackModelSrv.reuseWorkpackModel(idReusableWorkpackModelSelected, this.idWorkpackModel);
    if (result.success) {
      this.childrenModels.push({ ...result.data });
      this.loadCardItemsModels();
    }
  }

  async navigateToWorkpackModel(type: string) {
    const breadcrumb = this.getCurrentBreadcrumb();
    this.breadcrumbSrv.setBreadcrumbStorage(breadcrumb);
    await this.router.navigate([], {
      queryParams: {
        type,
        idStrategy: this.idStrategy,
        idOffice: this.idOffice,
        idParent: this.idWorkpackModel
      }
    });
  }

  async deleteWorkpackModel(workpackModel: IWorkpackModel) {
    const message = workpackModel.children && workpackModel.children.length > 0 ? this.translateSrv.instant('messages.deleteWorkpackModelConfirmation') :
      this.translateSrv.instant('messages.deleteConfirmation');

    const { success } = await this.workpackModelSrv.deleteWokpackModel(workpackModel, {
      message,
      field: 'modelName',
      useConfirm: true,
      idParent: this.idWorkpackModel
    });
    if (success) {
      this.childrenModels = Array.from(this.childrenModels.filter(c => c.id !== workpackModel.id));
      this.cardItemsModels = Array.from(this.cardItemsModels.filter(m => m.itemId !== workpackModel.id));
      this.menuSrv.reloadMenuPlanModel();
    }
  }

  scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async refreshPropertiesLists() {
    const { data, success } = await this.workpackModelSrv.GetById(this.idWorkpackModel);
    if (success) {
      if (data.properties) {
        const dataPropertiesAndIndex = await this.refreshProperties(data.properties);
        const dataProperties = dataPropertiesAndIndex
          .sort((a, b) => a[1] > b[1] ? 1 : -1)
          .map(prop => prop[0] as IWorkpackModelProperty);
        this.modelProperties = dataProperties;
        this.modelProperties.filter(prop => prop.type === TypePropertyEnum.GroupModel).forEach(group => {
          group.menuModelProperties = this.loadMenuPropertyGroup(group);
        });
      }
    }
  }

  async refreshProperties(properties) {
    return (await Promise.all(properties
      .map(async (p, i) => {
        if (p.possibleValues) {
          p.possibleValuesOptions = (p.possibleValues as string).split(',');
        }
        if (p.defaultValue && p.multipleSelection) {
          p.defaultValue = (p.defaultValue as string).split(',');
        }
        if (p.idDomain) {
          p.extraList = await this.getListLocalities(p.idDomain, p.multipleSelection);
          p.extraListDefaults = await this.getListLocalitiesDefaults(p);
          const defaultsLocalities = p.defaults as number[];
          if (defaultsLocalities && defaultsLocalities.length === 1) {
            const resultLocality = await this.localitySrv.GetById(defaultsLocalities[0]);
            if (resultLocality.success) {
              p.selectedLocalities = resultLocality.data.name;
              p.showIconButtonSelectLocality = false;
            }
          }
          if (defaultsLocalities && defaultsLocalities.length > 1) {
            p.selectedLocalities = `${defaultsLocalities.length} ${this.translateSrv.instant('selectedsLocalities')}`;
            p.showIconButtonSelectLocality = false;
          }
          if (!defaultsLocalities || (defaultsLocalities && defaultsLocalities.length === 0)) {
            p.selectedLocalities = this.translateSrv.instant('selectDefaultValue');
            p.showIconButtonSelectLocality = true;
          }
        }
        if (p.sectors) {
          p.sectorsList = p.sectors.split(',').map(sector => sector.toUpperCase());
        }
        if (p.defaults) {
          const isArray = p.defaults instanceof Array;
          if (!p.multipleSelection && isArray) {
            p.defaults = (p.defaults as any[]).shift();
          }
        }
        if (p.type === TypePropertyEnum.DateModel) {
          const value = p.defaultValue && p.defaultValue.toLocaleString();
          p.defaultValue = value && new Date(value);
        }
        await this.checkProperty(p);
        if (p.type === TypePropertyEnum.GroupModel && p.groupedProperties && p.groupedProperties.length > 0) {
          const groupedPropertiesAndIndex = await this.refreshProperties(p.groupedProperties);
          p.groupedProperties = groupedPropertiesAndIndex
            .sort((a, b) => a[1] > b[1] ? 1 : -1)
            .map(prop => prop[0] as IWorkpackModelProperty);
        }
        return [p, i];
      }))
    );
  }

}


