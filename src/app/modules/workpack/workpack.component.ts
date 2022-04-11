import { MilestoneStatusEnum } from './../../shared/enums/MilestoneStatusEnum';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { takeUntil } from 'rxjs/operators';
import { IWorkpackCardItem } from './../../shared/interfaces/IWorkpackCardItem';
import { IBaseline } from './../../shared/interfaces/IBaseline';
import { BaselineService } from './../../shared/services/baseline.service';
import { ProcessService } from './../../shared/services/process.service';
import { IProcess } from './../../shared/interfaces/IProcess';
import { IssuesPropertiesOptions } from './../../shared/constants/issuesPropertiesOptions';
import { IIssue } from './../../shared/interfaces/IIssue';
import { IssueService } from './../../shared/services/issue.service';
import { RisksPropertiesOptions } from './../../shared/constants/risksPropertiesOptions';
import { IRisk } from './../../shared/interfaces/IRisk';
import { RiskService } from './../../shared/services/risk.service';
import { TypePropertyModelEnum } from './../../shared/enums/TypePropertyModelEnum';
import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { FilterDataviewService } from 'src/app/shared/services/filter-dataview.service';
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService, MenuItem, MessageService, TreeNode } from 'primeng/api';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackModelService } from 'src/app/shared/services/workpack-model.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IWorkpack } from 'src/app/shared/interfaces/IWorkpack';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { IWorkpackModel } from 'src/app/shared/interfaces/IWorkpackModel';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { IWorkpackProperty } from 'src/app/shared/interfaces/IWorkpackProperty';
import { LocalityService } from 'src/app/shared/services/locality.service';
import { ILocalityList } from 'src/app/shared/interfaces/ILocality';
import { DomainService } from 'src/app/shared/services/domain.service';
import { IDomain } from 'src/app/shared/interfaces/IDomain';
import { OrganizationService } from 'src/app/shared/services/organization.service';
import { StakeholderService } from 'src/app/shared/services/stakeholder.service';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IOrganization } from 'src/app/shared/interfaces/IOrganization';
import { IMeasureUnit } from 'src/app/shared/interfaces/IMeasureUnit';
import { IStakeholder } from 'src/app/shared/interfaces/IStakeholder';
import { PlanService } from 'src/app/shared/services/plan.service';
import { TypeWorkpackEnum } from 'src/app/shared/enums/TypeWorkpackEnum';
import { CostAccountService } from 'src/app/shared/services/cost-account.service';
import { ICostAccount } from 'src/app/shared/interfaces/ICostAccount';
import { MeasureUnitService } from 'src/app/shared/services/measure-unit.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ScheduleService } from 'src/app/shared/services/schedule.service';
import { IScheduleDetail } from 'src/app/shared/interfaces/ISchedule';
import { IScheduleStepCardItem } from 'src/app/shared/interfaces/IScheduleStepCardItem';
import { OfficeService } from 'src/app/shared/services/office.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { PlanPermissionService } from 'src/app/shared/services/plan-permissions.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { MenuService } from 'src/app/shared/services/menu.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import * as moment from 'moment';
import { Subject } from 'rxjs';

interface ISection {
  idWorkpackModel?: number;
  cardSection: ICard;
  cardItemsSection?: ICardItem[];
}

interface ISectionWorkpacks {
  idWorkpackModel?: number;
  cardSection: ICard;
  cardItemsSection?: IWorkpackCardItem[];
}

interface IScheduleSection {
  cardSection: ICard;
  startScheduleStep?: IScheduleStepCardItem;
  endScheduleStep?: IScheduleStepCardItem;
  groupStep?: {
    year: number;
    cardItemSection?: IScheduleStepCardItem[];
    start?: boolean;
    end?: boolean;
  }[];
}


@Component({
  selector: 'app-workpack',
  templateUrl: './workpack.component.html',
  styleUrls: ['./workpack.component.scss']
})
export class WorkpackComponent implements OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  responsive: boolean;
  idPlan: number;
  propertiesPlan: IPlan;
  idOffice: number;
  idOfficeOwnerWorkpackLinked: number;
  propertiesOffice: IOffice;
  idWorkpackModel: number;
  idWorkpack: number;
  idWorkpackParent: number;
  idWorkpackModelLinked: number;
  workpackModel: IWorkpackModel;
  cardWorkpackProperties: ICard;
  cardJournalProperties: ICard;
  workpack: IWorkpack;
  workpackName: string;
  workpackFullName: string;
  sectionPropertiesProperties: PropertyTemplateModel[];
  workpackProperties: IWorkpackProperty[];
  sectionStakeholder: ISection;
  sectionRisk: ISection;
  sectionIssue: ISection;
  sectionProcess: ISection;
  stakeholders: IStakeholder[];
  sectionCostAccount: ISection;
  sectionSchedule: IScheduleSection;
  sectionWorkpackModelChildren: boolean;
  stakeholderSectionShowInactives = false;
  riskSectionShowClosed = false;
  issueSectionShowClosed = false;
  baselinesSectionShowInactives = true;
  sectionBaselines: ISection;
  organizationsOffice: IOrganization[];
  unitMeasuresOffice: IMeasureUnit[];
  cardsWorkPackModelChildren: ISectionWorkpacks[];
  typePropertyModel = TypePropertyModelEnum;
  costAccounts: ICostAccount[];
  schedule: IScheduleDetail;
  showDetails: boolean;
  isUserAdmin: boolean;
  editPermission = false;
  editPermissionOffice = false;
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecordsWorkpacks: number[] = [];
  totalRecordsStakeholders: number;
  totalRecordsCostAccounts: number;
  totalRecordsRisks: number;
  totalRecordsIssues: number;
  totalRecordsProcesses: number;
  risks: IRisk[];
  issues: IIssue[];
  processes: IProcess[];
  baselines: IBaseline[];
  unitMeansure: IMeasureUnit;
  showDialogEndManagement = false;
  showDialogResumeManagement = false;
  endManagementWorkpack: {
    idWorkpackModel?: number;
    idWorkpack: number;
    reason: string;
    endManagementDate: Date;
  };
  calendarFormat = '';
  $destroy = new Subject();
  language: string;

  constructor(
    private actRouter: ActivatedRoute,
    private workpackModelSrv: WorkpackModelService,
    private workpackSrv: WorkpackService,
    private responsiveSrv: ResponsiveService,
    public translateSrv: TranslateService,
    private domainSrv: DomainService,
    private localitySrv: LocalityService,
    private costAccountSrv: CostAccountService,
    private organizationSrv: OrganizationService,
    private unitMeasureSrv: MeasureUnitService,
    private stakeholderSrv: StakeholderService,
    private planSrv: PlanService,
    private scheduleSrv: ScheduleService,
    private router: Router,
    private breadcrumbSrv: BreadcrumbService,
    private officeSrv: OfficeService,
    private authSrv: AuthService,
    private planPermissionSrv: PlanPermissionService,
    private officePermissionSrv: OfficePermissionService,
    private messageSrv: MessageService,
    private menuSrv: MenuService,
    private filterSrv: FilterDataviewService,
    private riskSrv: RiskService,
    private issueSrv: IssueService,
    private processSrv: ProcessService,
    private baselineSrv: BaselineService,
    private confirmationSrv: ConfirmationService,
  ) {
    this.actRouter.queryParams.subscribe(async({ id, idPlan, idWorkpackModel, idWorkpackParent, idWorkpackModelLinked }) => {
      this.idWorkpack = id && +id;
      this.idPlan = idPlan && +idPlan;
      this.idWorkpackModel = idWorkpackModel && +idWorkpackModel;
      this.idWorkpackParent = idWorkpackParent && +idWorkpackParent;
      this.idWorkpackModelLinked = idWorkpackModelLinked && +idWorkpackModelLinked;
      this.planSrv.nextIDPlan(this.idPlan);
      await this.resetWorkpack();
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.language = this.translateSrv.currentLang, 200);
    }
    );
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  handleChangeCollapseExpandPanel(event) {
    this.collapsePanelsStatus = event.mode === 'collapse' ? true : false;
    this.cardWorkpackProperties = Object.assign({}, {
      ...this.cardWorkpackProperties,
      initialStateCollapse: this.collapsePanelsStatus
    });
    this.cardJournalProperties = Object.assign({}, {
      ...this.cardJournalProperties,
      initialStateCollapse: this.collapsePanelsStatus
    });
    this.sectionCostAccount = this.sectionCostAccount && Object.assign({}, {
      ...this.sectionCostAccount,
      cardSection: {
        ...this.sectionCostAccount.cardSection,
        initialStateCollapse: this.collapsePanelsStatus
      }
    });
    this.sectionSchedule = this.sectionSchedule && Object.assign({}, {
      ...this.sectionSchedule,
      cardSection: {
        ...this.sectionSchedule.cardSection,
        initialStateCollapse: this.collapsePanelsStatus
      }
    });
    this.sectionStakeholder = this.sectionStakeholder && Object.assign({}, {
      ...this.sectionStakeholder,
      cardSection: {
        ...this.sectionStakeholder.cardSection,
        initialStateCollapse: this.collapsePanelsStatus
      }
    });
    this.sectionBaselines = this.sectionBaselines && Object.assign({}, {
      ...this.sectionBaselines,
      cardSection: {
        ...this.sectionBaselines.cardSection,
        initialStateCollapse: this.collapsePanelsStatus
      }
    });
    this.sectionRisk = this.sectionRisk && Object.assign({}, {
      ...this.sectionRisk,
      cardSection: {
        ...this.sectionRisk.cardSection,
        initialStateCollapse: this.collapsePanelsStatus
      }
    });
    this.sectionIssue = this.sectionIssue && Object.assign({}, {
      ...this.sectionIssue,
      cardSection: {
        ...this.sectionIssue.cardSection,
        initialStateCollapse: this.collapsePanelsStatus
      }
    });
    this.sectionProcess = this.sectionProcess && Object.assign({}, {
      ...this.sectionProcess,
      cardSection: {
        ...this.sectionProcess.cardSection,
        initialStateCollapse: this.collapsePanelsStatus
      }
    });
    this.cardsWorkPackModelChildren = this.cardsWorkPackModelChildren && this.cardsWorkPackModelChildren.map(card => (
      Object.assign({}, {
        ...card,
        cardSection: {
          ...card.cardSection,
          initialStateCollapse: this.collapsePanelsStatus
        }
      })
    ));
  }

  handleChangeDisplayMode(event) {
    this.displayModeAll = event.displayMode;
  }

  handleChangePageSize(event) {
    this.pageSize = event.pageSize;
  }

  checkProperties(property: PropertyTemplateModel) {
    const arePropertiesRequiredValid: boolean = this.checkPropertiesRequiredValid(property);
    const arePropertiesStringValid: boolean = this.checkPropertiesStringValid(property);
    const arePropertiesNumberValid: boolean = this.checkPropertiesNumberValid(property);
    return (arePropertiesRequiredValid && arePropertiesStringValid && arePropertiesNumberValid) ? this.saveButton?.showButton() : this.saveButton?.hideButton();
  }

  checkPropertiesRequiredValid(property: PropertyTemplateModel, groupedProperties?: PropertyTemplateModel[]) {
    const properties = !groupedProperties ? this.sectionPropertiesProperties : groupedProperties;
    const validated = properties
      .filter(propReq => !!propReq.required || (propReq.type === 'Group' && propReq.groupedProperties.filter(gp => !!gp.required).length > 0))
      .map((prop) => {
        let valid = (prop.value instanceof Array
          ? (prop.value.length > 0)
          : typeof prop.value == 'boolean' || typeof prop.value == 'number'
          || !!prop.value || (prop.value !== null && prop.value !== undefined && prop.value !== ''));
        if (['OrganizationSelection', 'UnitSelection', 'LocalitySelection'].includes(prop.type)) {
          if (prop.type === 'LocalitySelection') {
            if (!prop.multipleSelection) {
              const selectedLocality = prop.localitiesSelected as TreeNode;
              prop.selectedValues = [selectedLocality.data];
            }
            if (prop.multipleSelection) {
              const selectedLocality = prop.localitiesSelected as TreeNode[];
              prop.selectedValues = selectedLocality.filter(locality => locality.data !== prop.idDomain)
                .map(l => l.data);
            }
          }
          valid = (typeof prop.selectedValue === 'number' || (prop.selectedValues instanceof Array ?
            prop.selectedValues.length > 0 : typeof prop.selectedValues == 'number'));
        }
        const groupedPropertiesValid = prop.type === 'Group' ? this.checkPropertiesRequiredValid(property, prop.groupedProperties) : true;
        if (prop.type === 'Group') {
          valid = groupedPropertiesValid;
        }
        if (property.idPropertyModel === prop.idPropertyModel) {
          prop.invalid = !valid;
          prop.message = valid ? '' : this.translateSrv.instant('required');
        }
        return valid;
      })
      .reduce((a, b) => a ? b : a, true);
    return validated;
  }

  checkPropertiesStringValid(property: PropertyTemplateModel, groupedProperties?: PropertyTemplateModel[]) {
    const properties = !groupedProperties ? this.sectionPropertiesProperties : groupedProperties;
    return properties
      .filter(p => (((p.min || p.max) && (typeof p.value == 'string' && p.type !== 'Num')) || (p.type === 'Group' &&
        p.groupedProperties.filter(gp => ((gp.min || gp.max) && (typeof gp.value == 'string' && gp.type !== 'Number'))).length > 0)))
      .map((prop) => {
        let valid = true;
        valid = prop.min ? String(prop.value).length >= prop.min : true;
        if (property.idPropertyModel === prop.idPropertyModel) {
          prop.invalid = !valid;
          prop.message = !valid ? prop.message = this.translateSrv.instant('minLenght') : '';
        }
        if (valid) {
          valid = prop.max ? (!prop.required ? String(prop.value).length <= prop.max
            : String(prop.value).length <= prop.max && String(prop.value).length > 0) : true;
          if (property.idPropertyModel === prop.idPropertyModel) {
            prop.invalid = !valid;
            prop.message = !valid ? (String(prop.value).length > 0 ? prop.message = this.translateSrv.instant('maxLenght')
              : prop.message = this.translateSrv.instant('required')) : '';
          }
        }
        const groupedPropertiesValid = prop.type === 'Group' ? this.checkPropertiesStringValid(property, prop.groupedProperties) : true;
        if (prop.type === 'Group') {
          valid = groupedPropertiesValid;
        }
        return valid;
      })
      .reduce((a, b) => a ? b : a, true);
  }

  checkPropertiesNumberValid(property: PropertyTemplateModel, groupedProperties?: PropertyTemplateModel[]) {
    const properties = !groupedProperties ? this.sectionPropertiesProperties : groupedProperties;
    return properties
      .filter(p => (((p.min || p.max) && (p.type === 'Num')) || (p.type === 'Group' &&
        p.groupedProperties.filter(gp => ((gp.min || gp.max) && (gp.type === 'Num'))).length > 0)))
      .map((prop) => {
        let valid = true;
        valid = prop.min ? Number(prop.value) >= prop.min : true;
        if (property.idPropertyModel === prop.idPropertyModel) {
          prop.invalid = !valid;
          prop.message = !valid ? prop.message = this.translateSrv.instant('minValue') : '';
        }
        if (valid) {
          valid = prop.max ? (!prop.required ? Number(prop.value) <= prop.max
            : Number(prop.value) <= prop.max && Number(prop.value) > 0) : true;
          if (property.idPropertyModel === prop.idPropertyModel) {
            prop.invalid = !valid;
            prop.message = !valid ? (Number(prop.value) > 0 ? prop.message = this.translateSrv.instant('maxValue')
              : prop.message = this.translateSrv.instant('required')) : '';
          }
        }
        const groupedPropertiesValid = prop.type === 'Group' ? this.checkPropertiesStringValid(property, prop.groupedProperties) : true;
        if (prop.type === 'Group') {
          valid = groupedPropertiesValid;
        }
        return valid;
      })
      .reduce((a, b) => a ? b : a, true);
  }

  async resetWorkpack() {
    this.workpackModel = undefined;
    this.cardWorkpackProperties = undefined;
    this.cardJournalProperties = undefined;
    this.workpack = undefined;
    this.workpackName = undefined;
    this.workpackFullName = undefined;
    this.sectionPropertiesProperties = [];
    this.workpackProperties = [];
    this.sectionStakeholder = undefined;
    this.stakeholders = undefined;
    this.sectionRisk = undefined;
    this.sectionIssue = undefined;
    this.sectionProcess = undefined;
    this.sectionCostAccount = undefined;
    this.sectionBaselines = undefined;
    this.costAccounts = undefined;
    this.sectionSchedule = undefined;
    this.schedule = undefined;
    this.sectionWorkpackModelChildren = undefined;
    this.cardsWorkPackModelChildren = [];
    this.editPermission = false;
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    await this.loadProperties();
    await this.setBreadcrumb();
    this.calendarFormat = this.translateSrv.instant('dateFormat');
  }

  async setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      ... await this.getBreadcrumbs(),
      ... this.idWorkpack
        ? []
        : [{
          key: this.workpackModel?.type?.toLowerCase().replace('model', ''),
          info: this.workpackName,
          tooltip: this.workpackFullName,
          routerLink: ['/workpack'],
          queryParams: {
            idPlan: this.idPlan,
            idWorkpackModel: this.idWorkpackModel,
            idWorkpackParent: this.idWorkpackParent
          },
          modelName: this.workpackModel?.modelName
        }]
    ]);
  }

  async getBreadcrumbs() {
    const id = this.idWorkpack || this.idWorkpackParent;
    if (!id) {
      return [
        {
          key: 'office',
          info: this.propertiesOffice.name,
          tooltip: this.propertiesOffice.fullName,
          routerLink: ['/offices', 'office'],
          queryParams: { id: this.idOffice },
        },
        {
          key: 'plan',
          info: this.propertiesPlan.name,
          tooltip: this.propertiesPlan.fullName,
          routerLink: ['/plan'],
          queryParams: { id: this.propertiesPlan.id },
        }
      ];
    }
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(id, { 'id-plan': this.idPlan });
    return success
      ? data.map(p => ({
        key: !p.modelName ? p.type.toLowerCase() : p.modelName,
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: { id: p.id, idWorkpackModelLinked: p.idWorkpackModelLinked },
        modelName: p.modelName
      }))
      : [];
  }

  getRouterLinkFromType(type: string): string[] {
    switch (type) {
      case 'office':
        return ['/offices', 'office'];
      case 'plan':
        return ['plan'];
      default:
        return ['/workpack'];
    }
  }

  async loadProperties() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    if (this.isUserAdmin || !this.idWorkpack) {
      this.editPermission = true;
    }
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    this.loadCardWorkpackProperties();
    if (this.idWorkpack) {
      if (!this.idWorkpackModelLinked) {
        await this.loadWorkpack();
      } else {
        await this.loadWorkpackLinked();
      }
    } else {
      await this.loadWorkpackModel(this.idWorkpackModel);
    }
    const workpackModelActivesProperties = (!!this.idWorkpackModelLinked && !!this.idWorkpack) ?
      this.workpack.model?.properties?.filter(w => w.active && w.session === 'PROPERTIES') :
      this.workpackModel?.properties?.filter(w => w.active && w.session === 'PROPERTIES');
    this.sectionPropertiesProperties = await Promise.all(workpackModelActivesProperties.map(p => this.instanceProperty(p)));
    if (this.idWorkpack) {
      if (this.workpack.type === TypeWorkpackEnum.ProjectModel) {
        await this.loadBaselinesSection();
      }

      await this.loadSectionsWorkpackModel();
    }
  }

  loadCardWorkpackProperties() {
    this.cardWorkpackProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: this.idWorkpack ? true : false
    };
  }

  async loadWorkpack() {
    const result = await this.workpackSrv.GetWorkpackById(this.idWorkpack, { 'id-plan': this.idPlan });
    if (result.success) {
      this.workpack = result.data;
      const propertyNameWorkpackModel = this.workpack.model.properties.find(p => p.name === 'name' && p.session === 'PROPERTIES');
      const propertyNameWorkpack = this.workpack.properties.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
      this.workpackName = propertyNameWorkpack.value as string;
      const propertyFullNameWorkpackModel = this.workpack.model.properties.find(p => p.name === 'fullName' && p.session === 'PROPERTIES');
      const propertyFullNameWorkpack = this.workpack.properties.find(p => p.idPropertyModel === propertyFullNameWorkpackModel.id);
      this.workpackFullName = propertyFullNameWorkpack.value as string;
      this.planSrv.nextIDPlan(this.idPlan);
      if (this.workpack && (this.workpack.canceled || this.workpack.endManagementDate !== null)) {
        this.editPermission = false;
      } else if (!this.isUserAdmin && this.workpack) {
        await this.loadUserPermission();
      }
      await this.loadWorkpackModel(this.workpack.model.id);
    }
  }

  async loadWorkpackLinked() {
    const result = await this.workpackSrv.GetWorkpackLinked(this.idWorkpack, { 'id-workpack-model': this.idWorkpackModelLinked, 'id-plan': this.idPlan });
    if (result.success) {
      this.workpack = result.data;
      this.idOfficeOwnerWorkpackLinked = this.workpack.plan.idOffice;
      const propertyNameWorkpackModel = this.workpack.model.properties.find(p => p.name === 'name' && p.session === 'PROPERTIES');
      const propertyNameWorkpack = this.workpack.properties.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
      this.workpackName = propertyNameWorkpack.value as string;
      const propertyFullNameWorkpackModel = this.workpack.model.properties.find(p => p.name === 'fullName' && p.session === 'PROPERTIES');
      const propertyFullNameWorkpack = this.workpack.properties.find(p => p.idPropertyModel === propertyFullNameWorkpackModel.id);
      this.workpackFullName = propertyFullNameWorkpack.value as string;
      this.planSrv.nextIDPlan(this.idPlan);
      if (!this.isUserAdmin && this.workpack) {
        this.editPermission = !!this.workpack.permissions?.find(p => p.level === 'EDIT');
      }
      await this.loadWorkpackModel(this.workpack.model.id);
    }
  }

  async loadUserPermission() {
    const editPermission = !!this.workpack.permissions?.find(p => p.level === 'EDIT');
    if (!editPermission && !this.idWorkpackModelLinked) {
      this.editPermission = await this.planPermissionSrv.getPermissions(this.idPlan);
    } else {
      this.editPermission = editPermission;
    }
  }

  async loadWorkpackModel(idWorkpackModel) {
    const result = await this.workpackModelSrv.GetById(idWorkpackModel);
    if (result.success) {
      this.workpackModel = result.data;
      this.showCheckCompleted();
    }
    const plan = await this.planSrv.GetById(this.idPlan);
    if (plan.success) {
      this.propertiesPlan = plan.data;
      this.idOffice = plan.data.idOffice;
      const office = await this.officeSrv.GetById(this.idOffice);
      if (office.success) {
        this.propertiesOffice = office.data;
      }
      this.officeSrv.nextIDOffice(this.idOffice);
      await this.loadPermissionsOffice();
    }
  }

  showCheckCompleted() {
    if (!this.workpackModel.scheduleSessionActive) {
      this.cardWorkpackProperties.showCheckCompleted = true;
      this.cardWorkpackProperties.workpackCompleted = this.workpack && this.workpack.completed;
    }
  }

  async handleChangeCheckCompleted(event) {
    const completed = event;
    const result = await this.workpackSrv.completeDeliverable(this.idWorkpack, completed);
    if (result.success) {
      this.workpack.completed = completed;
    }
  }

  async loadPermissionsOffice() {
    const payload = this.authSrv.getTokenPayload();
    const result = await this.officePermissionSrv.GetAll({ 'id-office': this.idOffice, email: payload.email });
    if (result.success) {
      const permissions = result.data.filter(office => office.permissions.find(p => p.level === 'EDIT'));
      if (permissions && permissions.length > 0) {
        this.editPermissionOffice = true;
      }
    }
  }

  async instanceProperty(propertyModel: IWorkpackModelProperty, group?: IWorkpackProperty): Promise<PropertyTemplateModel> {
    const property = new PropertyTemplateModel();
    const propertyWorkpack = !group ? this.workpack && this.workpack.properties.find(wp => wp.idPropertyModel === propertyModel.id) :
      group.groupedProperties.find(gp => gp.idPropertyModel === propertyModel.id);

    property.id = propertyWorkpack && propertyWorkpack.id;
    property.idPropertyModel = propertyModel.id;
    property.type = TypePropertyModelEnum[propertyModel.type];
    property.active = propertyModel.active;
    property.fullLine = propertyModel.fullLine;
    property.label = propertyModel.label;
    property.name = propertyModel.name;
    property.required = propertyModel.required;
    property.disabled = !this.editPermission;
    property.session = propertyModel.session;
    property.sortIndex = propertyModel.sortIndex;
    property.multipleSelection = propertyModel.multipleSelection;
    property.rows = propertyModel.rows ? propertyModel.rows : 1;
    property.decimals = propertyModel.decimals;
    property.value = propertyWorkpack?.value ? propertyWorkpack?.value : propertyModel.defaultValue;
    property.defaultValue = propertyWorkpack?.value ? propertyWorkpack?.value : propertyModel.defaultValue;
    property.min = propertyModel.min;
    property.max = propertyModel.max;
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.DateModel) {
      const dateValue = propertyWorkpack?.value ? propertyWorkpack?.value.toLocaleString()
        : (propertyModel.defaultValue && propertyModel.defaultValue.toLocaleString());
      property.value = dateValue ? new Date(dateValue) : null;
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.SelectionModel && propertyModel.multipleSelection) {
      const listValues = propertyWorkpack?.value ? propertyWorkpack?.value as string : propertyModel.defaultValue as string;
      property.defaultValue = listValues.split(',');
      property.value = listValues.split(',');
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.SelectionModel) {
      const listOptions = (propertyModel.possibleValues as string).split(',');
      property.possibleValues = listOptions.map(op => ({ label: op, value: op }));
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.LocalitySelectionModel) {
      const domain = await this.loadDomain(propertyModel.idDomain);
      const localityList = await this.loadDomainLocalities(domain.id);
      const rootNode: TreeNode = {
        label: domain.localityRoot.name,
        data: domain.localityRoot.id,
        children: undefined,
        parent: undefined,
        selectable: (this.editPermission && property.multipleSelection)
      };
      rootNode.children = this.loadLocality(localityList[0].children, rootNode);
      property.idDomain = propertyModel.idDomain;
      property.localityList = [rootNode];
      const defaultSelectedLocalities = propertyWorkpack?.selectedValues ?
        propertyWorkpack?.selectedValues as number[] : (propertyModel.defaults ? propertyModel.defaults as number[] : undefined);
      if (defaultSelectedLocalities?.length > 0) {
        const totalLocalities = this.countLocalities(localityList);
        if (defaultSelectedLocalities.length === totalLocalities) {
          defaultSelectedLocalities.unshift(propertyModel.idDomain);
        }
        const selectedLocalityList = this.loadSelectedLocality(defaultSelectedLocalities, property.localityList);
        // selectedLocalityList.forEach(l => this.expandTreeToTreeNode(l));
        property.localitiesSelected = propertyModel.multipleSelection
          ? selectedLocalityList as TreeNode[]
          : selectedLocalityList[0] as TreeNode;
      }
      if (defaultSelectedLocalities && defaultSelectedLocalities.length === 1) {
        const resultLocality = await this.localitySrv.GetById(defaultSelectedLocalities[0]);
        if (resultLocality.success) {
          property.labelButtonLocalitySelected = resultLocality.data.name;
          property.showIconButton = false;
        }
      }
      if (defaultSelectedLocalities && defaultSelectedLocalities.length > 1) {
        property.labelButtonLocalitySelected = `${defaultSelectedLocalities.length} ${this.translateSrv.instant('selectedsLocalities')}`;
        property.showIconButton = false;
      }
      if (!defaultSelectedLocalities || (defaultSelectedLocalities && defaultSelectedLocalities.length === 0)) {
        property.labelButtonLocalitySelected = this.translateSrv.instant('selectDefaultValue');
        property.showIconButton = true;
      }
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.OrganizationSelectionModel) {
      property.possibleValuesIds = await this.loadOrganizationsOffice(this.idOfficeOwnerWorkpackLinked ? this.idOfficeOwnerWorkpackLinked : this.idOffice);
      if (propertyModel.multipleSelection) {
        property.selectedValues = propertyWorkpack?.selectedValues ? propertyWorkpack?.selectedValues : propertyModel.defaults as number[];
      }
      if (!propertyModel.multipleSelection) {
        const defaults = propertyModel.defaults && propertyModel.defaults as number[];
        const defaultsValue = defaults && defaults[0];
        property.selectedValues = propertyWorkpack?.selectedValues ? propertyWorkpack?.selectedValues[0] : (defaultsValue && defaultsValue);
      }
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.UnitSelectionModel) {
      property.possibleValuesIds = await this.loadUnitMeasuresOffice(!!this.idOfficeOwnerWorkpackLinked ? this.idOfficeOwnerWorkpackLinked : this.idOffice);
      property.selectedValue = propertyWorkpack?.selectedValue ? propertyWorkpack?.selectedValue : propertyModel.defaults as number;
      property.defaults = propertyModel.defaults as number;
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.GroupModel && propertyModel.groupedProperties) {
      property.groupedProperties = await Promise.all(propertyModel.groupedProperties.map(prop => this.instanceProperty(prop, propertyWorkpack)));
    }
    return property;
  }

  loadSelectedLocality(seletectedIds: number[], list: TreeNode[]) {
    let result = [];
    list.sort((a, b) => a.label < b.label ? -1 : a.label > b.label ? 1 : 0);
    list.forEach(l => {
      if (seletectedIds.includes(l.data)) {
        result.push(l);
      };
      if (l.children && l.children.length > 0) {
        const resultChildren = this.loadSelectedLocality(seletectedIds, l.children);
        result = result.concat(resultChildren);
      }
    });
    return result;
  }

  expandTreeToTreeNode(treeNode: TreeNode) {
    if (treeNode.parent) {
      treeNode.parent.expanded = true;
      if (treeNode.parent.parent) {
        this.expandTreeToTreeNode(treeNode.parent);
      }
    }
  }

  async loadDomain(idDomain: number) {
    const result = await this.domainSrv.GetById(idDomain);
    if (result.success) {
      return result.data as IDomain;
    }
    return null;
  }

  loadLocality(localityList: ILocalityList[], parent: TreeNode) {
    localityList.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    const list = localityList.map(locality => {
      if (locality.children) {
        const node = {
          label: locality.name,
          data: locality.id,
          children: undefined,
          parent,
          selectable: this.editPermission
        };
        node.children = this.loadLocality(locality.children, node);
        return node;
      }
      return { label: locality.name, data: locality.id, children: undefined, parent, selectable: this.editPermission };
    });
    return list;
  }

  countLocalities(list: ILocalityList[]) {
    return list.reduce((total, item) => {
      if (item.children) {
        return total + 1 + this.countLocalities(item.children);
      }
      return total + 1;
    }, 0);
  }

  async loadDomainLocalities(idDomain: number) {
    const result = await this.localitySrv.getLocalitiesTreeFromDomain({ 'id-domain': idDomain });
    if (result) {
      return result as ILocalityList[];
    }
  }

  async loadOrganizationsOffice(idOffice) {
    const result = await this.organizationSrv.GetAll({ 'id-office': idOffice });
    if (result.success) {
      const organizationsOffice = result.data;
      return organizationsOffice.map(org => ({
        label: org.name,
        value: org.id
      }));
    }
  }

  async loadUnitMeasuresOffice(idOffice) {
    const result = await this.unitMeasureSrv.GetAll({ idOffice });
    if (result.success) {
      const units = result.data;
      return units.map(org => ({
        label: org.name,
        value: org.id
      }));
    }
  }

  async loadBaselinesSection() {
    this.sectionBaselines = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: 'baselines',
        collapseble: true,
        initialStateCollapse: this.collapsePanelsStatus,
        showFilters: false,
        showCreateNemElementButton: false,
      },

      cardItemsSection: await this.loadSectionBaselinesCards(this.baselinesSectionShowInactives)
    };
  }

  async loadSectionBaselinesCards(showInactives: boolean) {
    const resultBaselines = await this.baselineSrv.GetAll({ 'id-workpack': this.idWorkpack });
    this.baselines = resultBaselines.success ? resultBaselines.data : [];
    if (this.baselines && this.baselines.length > 0) {
      const cardItems = this.baselines.filter(b => {
        if (!showInactives) {
          if (!!b.active) { return b; }
        } else {
          return b;
        }
      }).map(base => ({
        typeCardItem: 'listItem',
        icon: !!base.cancelation ? 'fas fa-times' : 'baseline',
        iconColor: base.cancelation && '#FF7F81',
        iconSvg: !base.cancelation ? true : false,
        nameCardItem: base.name,
        baselineStatus: base.status.toLowerCase(),
        baselineStatusDate: base.active ? base.activationDate : (base.status === 'PROPOSED' ? base.proposalDate : 'NONE'),
        baselineActive: base.active,
        itemId: base.id,
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          disabled: !this.editPermission || base.status !== 'DRAFT',
          command: (event) => this.deleteBaseline(base)
        }],
        urlCard: '/workpack/baseline',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.idWorkpack },
          { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked },
          { name: 'id', value: base.id },
        ]
      }));
      if (this.editPermission && !this.workpack.cancelPropose && !this.workpack.pendingBaseline) {
        cardItems.push({
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconColor: null,
          iconSvg: true,
          nameCardItem: null,
          baselineStatus: undefined,
          baselineStatusDate: undefined,
          baselineActive: undefined,
          itemId: null,
          menuItems: [],
          urlCard: '/workpack/baseline',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked },
          ]
        });
      }
      return cardItems;
    } else {
      const cardItem = (this.editPermission && !this.workpack.cancelPropose && !this.workpack.pendingBaseline) ?
        [{
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconColor: null,
          iconSvg: true,
          nameCardItem: null,
          itemId: null,
          urlCard: '/workpack/baseline',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked },
          ]
        }] : [];
      return cardItem;
    }
  }

  async handleBaselineShowInactiveToggle(event) {
    this.sectionBaselines.cardItemsSection = await this.loadSectionBaselinesCards(event.checked);
  }

  async deleteBaseline(base: IBaseline) {
    const result = await this.baselineSrv.delete(base, { useConfirm: true });
    if (result.success) {
      this.sectionBaselines.cardItemsSection = Array.from(this.sectionBaselines.cardItemsSection.filter(item => item.itemId !== base.id));
    }
  }

  async loadSectionsWorkpackModel() {
    if (!!this.workpackModel.stakeholderSessionActive
      && (((this.isUserAdmin || this.editPermissionOffice) && !this.idWorkpackModelLinked) || (this.editPermission && !!this.idWorkpackModelLinked))) {
      const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${this.workpack.model.id}/stakeholders`);
      const filters = resultFilters.success && Array.isArray(resultFilters.data) ? resultFilters.data : [];
      const idFilterSelected = filters.find(defaultFilter => !!defaultFilter.favorite) ?
        filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
      await this.loadStakeholders(idFilterSelected);
      this.sectionStakeholder = {
        cardSection: {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: 'stakeholdersAndPermissions',
          collapseble: true,
          initialStateCollapse: this.collapsePanelsStatus,
          showFilters: true,
          filters,
          showCreateNemElementButton: this.editPermission ? true : false,
          createNewElementMenuItems: [
            {
              label: this.translateSrv.instant('person'),
              icon: 'fas fa-user-circle',
              command: (event) => this.navigateToPageStakeholder('person')
            },
            {
              label: this.translateSrv.instant('organization'),
              icon: 'fas fa-building',
              command: (event) => this.navigateToPageStakeholder('organization')
            }
          ]
        },
        cardItemsSection: await this.loadSectionStakeholderCards(this.stakeholderSectionShowInactives)
      };
      this.totalRecordsStakeholders = this.sectionStakeholder.cardItemsSection && this.sectionStakeholder.cardItemsSection.length;
    }
    if (this.workpackModel.costSessionActive) {
      const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${this.workpack.model.id}/costAccounts`);
      const filters = resultFilters.success && resultFilters.data ? resultFilters.data : [];
      const idFilterSelected = filters.find(defaultFilter => !!defaultFilter.favorite) ?
        filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
      this.sectionCostAccount = {
        cardSection: {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: 'costAccounts',
          collapseble: true,
          initialStateCollapse: this.collapsePanelsStatus,
          showFilters: true,
          filters,
          showCreateNemElementButton: this.editPermission ? true : false
        },
        cardItemsSection: await this.loadCardItemsCostSession(idFilterSelected)
      };
      this.totalRecordsCostAccounts = this.sectionCostAccount.cardItemsSection ? this.sectionCostAccount.cardItemsSection.length + 1 : 1;
    }
    if (this.workpackModel.scheduleSessionActive && this.costAccounts) {
      await this.loadScheduleSession();
    }
    if (this.workpackModel.riskAndIssueManagementSessionActive) {
      const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${this.workpack.model.id}/risks`);
      const filters = resultFilters.success && Array.isArray(resultFilters.data) ? resultFilters.data : [];
      const idFilterSelected = filters.find(defaultFilter => !!defaultFilter.favorite) ?
        filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;

      this.sectionRisk = {
        cardSection: {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: 'risks',
          collapseble: true,
          initialStateCollapse: this.collapsePanelsStatus,
          showFilters: true,
          filters: filters && filters.length > 0 ? filters : [],
          showCreateNemElementButton: this.editPermission ? true : false,
        },

        cardItemsSection: await this.loadSectionRisksCards(this.riskSectionShowClosed, idFilterSelected)
      };
      this.totalRecordsRisks = this.sectionRisk.cardItemsSection && this.sectionRisk.cardItemsSection.length;


      const resultFiltersIssues = await this.filterSrv.getAllFilters(`workpackModels/${this.workpack.model.id}/issues`);
      const filtersIssues = resultFiltersIssues.success && Array.isArray(resultFiltersIssues.data) ? resultFiltersIssues.data : [];
      const idFilterIssueSelected = filtersIssues.find(defaultFilter => !!defaultFilter.favorite) ?
        filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
      this.sectionIssue = {
        cardSection: {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: 'issues',
          collapseble: true,
          initialStateCollapse: this.collapsePanelsStatus,
          showFilters: true,
          filters: filtersIssues && filtersIssues.length > 0 ? filtersIssues : [],
          showCreateNemElementButton: this.editPermission ? true : false,
        },

        cardItemsSection: await this.loadSectionIssuesCards(this.issueSectionShowClosed, idFilterIssueSelected)
      };
      this.totalRecordsIssues = this.sectionIssue.cardItemsSection && this.sectionIssue.cardItemsSection.length;
    }
    if (this.workpackModel.processesManagementSessionActive) {
      const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${this.workpack.model.id}/processes`);
      const filters = resultFilters.success && Array.isArray(resultFilters.data) ? resultFilters.data : [];
      const idFilterSelected = filters.find(defaultFilter => !!defaultFilter.favorite) ?
        filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;

      this.sectionProcess = {
        cardSection: {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: 'processes',
          collapseble: true,
          initialStateCollapse: this.collapsePanelsStatus,
          showFilters: true,
          filters: filters && filters.length > 0 ? filters : [],
          showCreateNemElementButton: this.editPermission ? true : false,
        },

        cardItemsSection: await this.loadSectionProcessesCards(idFilterSelected)
      };
      this.totalRecordsProcesses = this.sectionProcess.cardItemsSection && this.sectionProcess.cardItemsSection.length;
    }
    if (this.workpackModel.journalManagementSessionActive) {
      this.cardJournalProperties = {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: 'journal',
        collapseble: true,
        initialStateCollapse: this.collapsePanelsStatus,
      };
    }
    if (this.workpackModel.childWorkpackModelSessionActive && this.workpackModel.children) {
      this.sectionWorkpackModelChildren = true;
      if (!this.idWorkpackModelLinked) {
        await this.loadSectionsWorkpackChildren();
      } else {
        await this.loadSectionsWorkpackChildrenLinked();
      }
    }
  }

  async loadSectionsWorkpackChildren() {
    this.cardsWorkPackModelChildren = await Promise.all(this.workpackModel.children.map(async(workpackModel) => {
      const propertiesCard: ICard = {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: workpackModel.modelNameInPlural,
        collapseble: true,
        initialStateCollapse: this.collapsePanelsStatus,
        showFilters: true,
        showCreateNemElementButton: this.editPermission ? true : false
      };
      const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${workpackModel.id}/workpacks`);
      if (resultFilters.success && resultFilters.data) {
        propertiesCard.filters = resultFilters.data;
      }
      const idFilterSelected = propertiesCard.filters.find(defaultFilter => !!defaultFilter.favorite) ?
        propertiesCard.filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
      const workPackItemCardList = await this.loadWorkpacksFromWorkpackModel(this.workpack.plan.id, workpackModel.id, idFilterSelected);
      return {
        idWorkpackModel: workpackModel.id,
        cardSection: propertiesCard,
        cardItemsSection: workPackItemCardList
      };
    }));
    this.cardsWorkPackModelChildren.forEach((workpackModel, i) => {
      this.totalRecordsWorkpacks[i] = workpackModel.cardItemsSection ? workpackModel.cardItemsSection.length + 1 : 1;
    });
  }

  async loadWorkpacksFromWorkpackModel(idPlan: number, idWorkpackModel: number, idFilterSelected: number, idWorkpackModelLinked?: number) {
    const result = await this.workpackSrv.GetWorkpacksByParent({
      'id-plan': idPlan,
      'id-workpack-model': idWorkpackModel,
      'id-workpack-parent': this.idWorkpack,
      workpackLinked: idWorkpackModelLinked ? true : false,
      idFilter: idFilterSelected
    });
    const workpacks = result.success && result.data;
    if (workpacks && workpacks.length > 0) {
      const workpackItemCardList: IWorkpackCardItem[] = workpacks.map(workpack => {
        const propertyNameWorkpackModel = workpack.model?.properties?.find(p => p.name === 'name' && p.session === 'PROPERTIES');
        const propertyNameWorkpack = workpack.properties?.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
        const propertyFullnameWorkpackModel = workpack.model?.properties?.find(p => p.name === 'fullName' && p.session === 'PROPERTIES');
        const propertyFullnameWorkpack = workpack.properties?.find(p => p.idPropertyModel === propertyFullnameWorkpackModel.id);
        const menuItems: MenuItem[] = [];
        if (workpack.canceled) {
          menuItems.push({
            label: this.translateSrv.instant('restore'),
            icon: 'fas fa-redo-alt',
            command: (event) => this.handleRestoreWorkpack(workpack.id),
          });
        } else {
          if (workpack.type !== 'Project') {
            menuItems.push({
              label: this.translateSrv.instant('delete'),
              icon: 'fas fa-trash-alt',
              command: (event) => this.deleteWorkpackChildren(workpack),
              disabled: !this.editPermission
            });
          }
          if (workpack.type === 'Deliverable' && (!workpack.endManagementDate || workpack.endManagementDate === null)) {
            menuItems.push({
              label: this.translateSrv.instant('endManagement'),
              icon: 'far fa-stop-circle',
              command: (event) => this.endManagementOfDeliverable(workpack, idWorkpackModel),
              disabled: !this.editPermission
            });
          }
          if (workpack.type === 'Deliverable' && (!!workpack.endManagementDate && workpack.endManagementDate !== null)) {
            menuItems.push({
              label: this.translateSrv.instant('resumeManagement'),
              icon: 'far fa-play-circle',
              command: (event) => this.resumeManagementOfDeliverable(workpack, idWorkpackModel),
              disabled: !this.editPermission
            });
          }
          if (workpack.cancelable && this.editPermission) {
            menuItems.push({
              label: this.translateSrv.instant('cancel'),
              icon: 'fas fa-times',
              command: (event) => this.handleCancelWorkpack(workpack.id),
            });
          }
          if (workpack.type === 'Project' && this.editPermission) {
            if (!workpack.pendingBaseline && !workpack.cancelPropose && !!workpack.hasActiveBaseline) {
              menuItems.push({
                label: this.translateSrv.instant('cancel'),
                icon: 'fas fa-times',
                command: (event) => this.navigateToCancelProject(workpack.id, propertyNameWorkpack.value as string),
              });
            }
            menuItems.push({
              label: this.translateSrv.instant('changeControlBoard'),
              icon: 'app-icon ccb-member',
              command: (event) => this.navigateToConfigCCB(workpack.id),
            });
          }
          if (this.editPermission) {
            menuItems.push({
              label: this.translateSrv.instant('cut'),
              icon: 'fas fa-cut',
              command: (event) => this.handleCutWorkpack(workpack),
            });
          }
          if (workpack.model.id === idWorkpackModel && this.editPermission && !idWorkpackModelLinked) {
            menuItems.push({
              label: this.translateSrv.instant('sharing'),
              icon: 'app-icon share',
              command: (event) => this.handleSharing(workpack.id),
            });
          }
          if (!!workpack.linked) {
            menuItems.push({
              label: this.translateSrv.instant('unlink'),
              icon: 'app-icon unlink',
              command: (event) => this.unlinkedWorkpack(workpack.id, workpack.linkedModel),
            });
          }
        }
        return {
          typeCardItem: workpack.type,
          icon: workpack.model.fontIcon,
          iconSvg: false,
          nameCardItem: propertyNameWorkpack?.value as string,
          fullNameCardItem: propertyFullnameWorkpack?.value as string,
          itemId: workpack.id,
          menuItems,
          urlCard: '/workpack',
          paramsUrlCard: workpack.model.id !== idWorkpackModel ? [
            { name: 'idWorkpackModelLinked', value: idWorkpackModel },
            { name: 'idPlan', value: this.idPlan }
          ] : (idWorkpackModelLinked ? [{ name: 'idWorkpackModelLinked', value: idWorkpackModelLinked },
          { name: 'idPlan', value: this.idPlan }] : [{ name: 'idPlan', value: this.idPlan }]),
          linked: !!idWorkpackModelLinked ? true : (!!workpack.linked ? true : false),
          shared: workpack.sharedWith && workpack.sharedWith.length > 0 ? true : false,
          canceled: workpack.canceled,
          completed: workpack.completed,
          endManagementDate: workpack.endManagementDate,
          dashboard: workpack.dashboard,
          hasBaseline: workpack.hasActiveBaseline,
          baselineName: workpack.activeBaselineName,
          subtitleCardItem: workpack.type === 'Milestone' ? workpack.milestoneDate : '',
          statusItem: workpack.type === 'Milestone' ? MilestoneStatusEnum[workpack.milestoneStatus] : ''
        };
      });
      if (this.editPermission && !idWorkpackModelLinked) {
        const sharedWorkpackList = await this.loadSharedWorkpackList(idWorkpackModel);
        const iconMenuItems: MenuItem[] = [
          { label: this.translateSrv.instant('new'), command: () => this.handleNewWorkpack(idPlan, idWorkpackModel, this.idWorkpack) }
        ];
        if (sharedWorkpackList && sharedWorkpackList.length > 0) {
          iconMenuItems.push({
            label: this.translateSrv.instant('linkTo'),
            items: sharedWorkpackList.map(wp => ({
              label: wp.name,
              icon: `app-icon ${wp.icon}`,
              command: () => this.handleLinkToWorkpack(wp.id, idWorkpackModel)
            }))
          });
        }
        const workpackCuted = this.workpackSrv.getWorkpackCuted();
        if (workpackCuted) {
          const { canPaste, incompatiblesProperties } = await this.checkPasteWorkpack(workpackCuted, idWorkpackModel);
          const validPasteOutherOffice = workpackCuted.plan.idOffice === this.idOffice ? true : this.isUserAdmin;
          if (canPaste && validPasteOutherOffice) {
            iconMenuItems.push({
              label: `${this.translateSrv.instant('paste')} ${this.getNameWorkpack(workpackCuted)}`,
              icon: 'fas fa-paste',
              command: (event) => this.handlePasteWorkpack(idPlan, idWorkpackModel, this.idWorkpack, incompatiblesProperties)
            });
          }
        }
        workpackItemCardList.push(
          {
            typeCardItem: 'newCardItem',
            icon: IconsEnum.Plus,
            iconSvg: true,
            iconMenuItems
          }
        );
      }
      return workpackItemCardList;
    }
    if ((!workpacks || workpacks.length === 0) && this.editPermission) {
      const sharedWorkpackList = await this.loadSharedWorkpackList(idWorkpackModel);
      const iconMenuItems: MenuItem[] = [
        { label: this.translateSrv.instant('new'), command: () => this.handleNewWorkpack(idPlan, idWorkpackModel, this.idWorkpack) }
      ];
      if (sharedWorkpackList && sharedWorkpackList.length > 0) {
        iconMenuItems.push({
          label: this.translateSrv.instant('linkTo'),
          items: sharedWorkpackList.map(wp => ({
            label: wp.name,
            icon: `app-icon ${wp.icon}`,
            command: () => this.handleLinkToWorkpack(wp.id, idWorkpackModel)
          }))
        });
      }
      if (this.editPermission && !idWorkpackModelLinked) {
        const sharedWorkpackList = await this.loadSharedWorkpackList(idWorkpackModel);
        if (sharedWorkpackList && sharedWorkpackList.length > 0) {
          iconMenuItems.push({
            label: this.translateSrv.instant('linkTo'),
            items: sharedWorkpackList.map(wp => ({
              label: wp.name,
              icon: `app-icon ${wp.icon}`,
              command: () => this.handleLinkToWorkpack(wp.id, idWorkpackModel)
            }))
          });
        }
        const workpackCuted = this.workpackSrv.getWorkpackCuted();
        if (workpackCuted) {
          const { canPaste, incompatiblesProperties } = await this.checkPasteWorkpack(workpackCuted, idWorkpackModel);
          const validPasteOutherOffice = workpackCuted.plan.idOffice === this.idOffice ? true : this.isUserAdmin;
          if (canPaste && validPasteOutherOffice) {
            iconMenuItems.push({
              label: `${this.translateSrv.instant('paste')} ${this.getNameWorkpack(workpackCuted)}`,
              icon: 'fas fa-paste',
              command: (event) => this.handlePasteWorkpack(idPlan, idWorkpackModel, this.idWorkpack, incompatiblesProperties)
            });
          }
        }
      }
      const workpackItemCardList = [
        {
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconSvg: true,
          iconMenuItems
        }
      ];
      return workpackItemCardList;
    }
  }

  getNameWorkpack(workpack: IWorkpack): string {
    const propertyNameWorkpackModel = workpack.model?.properties?.find(p => p.name === 'name' && p.session === 'PROPERTIES');
    const propertyNameWorkpack = workpack.properties?.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
    return propertyNameWorkpack?.value as string;
  }

  async unlinkedWorkpack(idWorkpackLinked, idWorkpackModel) {
    const result = await this.workpackSrv.unlinkWorkpack(idWorkpackLinked, idWorkpackModel, { 'id-workpack-parent': this.idWorkpack, 'id-plan': this.idPlan });
    if (result.success) {
      const workpackModelIndex = this.cardsWorkPackModelChildren
        .findIndex(workpackModel => workpackModel.idWorkpackModel === idWorkpackModel);
      if (workpackModelIndex > -1) {
        const workpackIndex = this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection
          .findIndex(w => w.itemId === idWorkpackLinked);
        if (workpackIndex > -1) {
          this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection.splice(workpackIndex, 1);
          this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection =
            Array.from(this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection);
          this.totalRecordsWorkpacks[workpackModelIndex] = this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection.length;
        }
      }
    }
  }

  endManagementOfDeliverable(workpack: IWorkpack, idWorkpackModel) {
    this.showDialogEndManagement = true;
    this.endManagementWorkpack = {
      idWorkpackModel,
      idWorkpack: workpack.id,
      reason: '',
      endManagementDate: null
    };
  }

  async handleEndManagementDeliverable() {
    if (this.endManagementWorkpack && this.endManagementWorkpack.reason.length > 0 && this.endManagementWorkpack.endManagementDate !== null) {
      const result = await this.workpackSrv.endManagementDeliverable({
        idWorkpack: this.endManagementWorkpack.idWorkpack,
        endManagementDate: moment(this.endManagementWorkpack.endManagementDate).format('yyyy-MM-DD'),
        reason: this.endManagementWorkpack.reason
      });
      if (result.success) {
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('messages.endManagementSuccess'),
          detail: this.translateSrv.instant('messages.endManagementSuccess'),
          life: 3000
        });
        this.handleCancelEndManagement();
        if (!this.idWorkpackModelLinked) {
          await this.loadSectionsWorkpackChildren();
        } else {
          await this.loadSectionsWorkpackChildrenLinked();
        }
      }
    } else {
      this.messageSrv.add({
        severity: 'warn',
        summary: this.translateSrv.instant('messages.invalidForm'),
        detail: this.translateSrv.instant('messages.endManagementInputAlert'),
        life: 3000
      });
    }
  }

  handleCancelEndManagement() {
    this.showDialogEndManagement = false;
    this.endManagementWorkpack = undefined;
  }

  resumeManagementOfDeliverable(workpack: IWorkpack, idWorkpackModel) {
    this.showDialogResumeManagement = true;
    this.endManagementWorkpack = {
      idWorkpackModel,
      idWorkpack: workpack.id,
      reason: workpack.reason,
      endManagementDate: moment(workpack.endManagementDate, 'DD-MM-yyyy').toDate()
    };
  }

  handleCancelResumeManagement() {
    this.showDialogResumeManagement = false;
    this.endManagementWorkpack = undefined;
  }

  async handleResumeManagementDeliverable() {
    const result = await this.workpackSrv.endManagementDeliverable({
      endManagementDate: null,
      reason: this.endManagementWorkpack.reason,
      idWorkpack: this.endManagementWorkpack.idWorkpack
    });
    if (result.success) {
      this.handleCancelResumeManagement();
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('messages.endManagementSuccess'),
        detail: this.translateSrv.instant('messages.endManagementSuccess'),
        life: 3000
      });
      if (!this.idWorkpackModelLinked) {
        await this.loadSectionsWorkpackChildren();
      } else {
        await this.loadSectionsWorkpackChildrenLinked();
      }
    }
  }

  navigateToConfigCCB(idProject: number) {
    this.router.navigate(
      ['/workpack/change-control-board'],
      {
        queryParams: {
          idProject,
          idParent: this.idWorkpack,
          idOffice: this.idOffice
        }
      });
  }

  navigateToCancelProject(idProject: number, projectName: string) {
    this.router.navigate(
      ['/workpack/baseline-cancelling'],
      {
        queryParams: {
          idProject,
          idWorkpackModelLinked: this.idWorkpackModelLinked,
          projectName
        }
      });
  }

  async handleCancelWorkpack(idWorkpack: number) {
    const result = await this.workpackSrv.cancelWorkpack(idWorkpack);
    if (result.success) {
      await this.reloadSectionsWorkpackChildren();
    }
  }

  async handleRestoreWorkpack(idWorkpack: number) {
    const result = await this.workpackSrv.restoreWorkpack(idWorkpack);
    if (result.success) {
      await this.reloadSectionsWorkpackChildren();
    }
  }

  async handleCutWorkpack(workpack: IWorkpack) {
    this.workpackSrv.setWorkpackCuted({ ...workpack, idParent: this.idWorkpack });
    await this.reloadSectionsWorkpackChildren();
  }

  async checkPasteWorkpack(workpackCuted: IWorkpack, idWorkpackModelTo: number) {
    const result = await this.workpackSrv.checkPasteWorkpack(workpackCuted.id, idWorkpackModelTo, {
      idWorkpackModelFrom: workpackCuted.model.id,
    });
    if (result.success) {
      return result.data;
    } else {
      return {} as any;
    }
  }

  async handlePasteWorkpack(idPlanTo: number, idWorkpackModelTo: number, idParentTo: number, incompatiblesProperties: boolean) {
    const workpackCuted = this.workpackSrv.getWorkpackCuted();
    if (workpackCuted) {
      if (incompatiblesProperties) {
        this.confirmationSrv.confirm({
          message: this.translateSrv.instant('messages.confirmPaste'),
          key: 'pasteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async() => {
            await this.pasteWorkpack(workpackCuted, idWorkpackModelTo, idPlanTo, idParentTo);
          },
          reject: () => {
            return;
          }
        });
      } else {
        await this.pasteWorkpack(workpackCuted, idWorkpackModelTo, idPlanTo, idParentTo);
      }
    }
  }

  async pasteWorkpack(workpackCuted: IWorkpack, idWorkpackModelTo: number, idPlanTo: number, idParentTo: number) {
    const result = await this.workpackSrv.pasteWorkpack(workpackCuted.id, idWorkpackModelTo, {
      idPlanFrom: workpackCuted.plan.id,
      idParentFrom: workpackCuted.idParent,
      idPlanTo,
      idParentTo,
      idWorkpackModelFrom: workpackCuted.model.id
    });
    if (result.success) {
      await this.reloadSectionsWorkpackChildren();
    }
  }

  async loadSectionsWorkpackChildrenLinked() {
    this.cardsWorkPackModelChildren = await Promise.all(this.workpack.modelLinked.children.map(async(workpackModel) => {
      const propertiesCard: ICard = {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: workpackModel.nameInPluralWorkpackModelLinked,
        collapseble: true,
        initialStateCollapse: this.collapsePanelsStatus,
        showFilters: true,
        showCreateNemElementButton: false
      };
      const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${workpackModel.idWorkpackModelLinked}/workpacks`);
      if (resultFilters.success && resultFilters.data) {
        propertiesCard.filters = resultFilters.data;
      }
      const idFilterSelected = propertiesCard.filters.find(defaultFilter => !!defaultFilter.favorite) ?
        propertiesCard.filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
      const workPackItemCardList = await this.loadWorkpacksFromWorkpackModel(this.idPlan, workpackModel.idWorkpackModelOriginal, idFilterSelected, workpackModel.idWorkpackModelLinked);
      return {
        idWorkpackModel: workpackModel.idWorkpackModelLinked,
        cardSection: propertiesCard,
        cardItemsSection: workPackItemCardList
      };
    }));
    this.cardsWorkPackModelChildren.forEach((workpackModel, i) => {
      this.totalRecordsWorkpacks[i] = workpackModel.cardItemsSection ? workpackModel.cardItemsSection.length + 1 : 1;
    });
  }

  async reloadSectionsWorkpackChildren() {
    if (!this.idWorkpackModelLinked) {
      await this.loadSectionsWorkpackChildren();
    } else {
      await this.loadSectionsWorkpackChildrenLinked();
    }
  }

  handleNewWorkpack(idPlan, idWorkpackModel, idWorkpackParent) {
    this.router.navigate(['workpack'], {
      queryParams: {
        idPlan,
        idWorkpackModel,
        idWorkpackParent
      }
    });
  }

  async loadSharedWorkpackList(idWorkpackModel: number) {
    const result = await this.workpackSrv.GetSharedWorkpacks({ 'id-workpack-model': idWorkpackModel, 'id-plan': this.idPlan });
    if (result.success) {
      return result.data;
    }
    return [];
  }

  async handleLinkToWorkpack(idWorkpack: number, idWorkpackModel: number) {
    const result = await this.workpackSrv.linkWorkpack(idWorkpack, idWorkpackModel, { 'id-parent': this.idWorkpack, 'id-plan': this.idPlan });
    if (result.success) {
      this.router.navigate(['/workpack'], {
        queryParams: {
          id: idWorkpack,
          idWorkpackModelLinked: idWorkpackModel
        }
      });
    }
  }

  handleSharing(idWorkpack: number) {
    this.router.navigate(['/workpack/sharing'], {
      queryParams: {
        idWorkpack,
        idWorkpackParent: this.idWorkpack,
        idPlan: this.propertiesPlan.id
      }
    });
  }

  handleCreateNewWorkpack(idWorkpackModel: number) {
    this.router.navigate(['/workpack'], {
      queryParams: {
        idPlan: this.idPlan,
        idWorkpackModel,
        idWorkpackParent: this.idWorkpack
      }
    });
  }

  async deleteWorkpackChildren(workpack) {
    const result = await this.workpackSrv.delete(workpack);
    if (result.success) {
      const workpackModelIndex = this.cardsWorkPackModelChildren
        .findIndex(workpackModel => workpackModel.idWorkpackModel === workpack.model.id);
      if (workpackModelIndex > -1) {
        const workpackIndex = this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection
          .findIndex(w => w.itemId === workpack.id);
        if (workpackIndex > -1) {
          this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection.splice(workpackIndex, 1);
          this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection =
            Array.from(this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection);
          this.totalRecordsWorkpacks[workpackModelIndex] = this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection.length;
        }
      }
    }
  }

  async loadStakeholders(idFilter?: number) {
    const result = await this.stakeholderSrv.GetAll({ 'id-workpack': this.idWorkpack, idFilter });
    if (result.success) {
      this.stakeholders = result.data;
    }
  }

  async loadSectionStakeholderCards(showInactives: boolean) {
    if (this.stakeholders) {
      const cardItems = this.stakeholders.filter(stake => {
        if (!showInactives && stake.roles && stake.roles.length > 0) {
          return stake.roles.find(r => r.active && (!r.to || r.to === null || moment(r.to, 'yyyy-MM-DD').isSameOrAfter(moment()))
            && (!r.from || r.from === null || moment(r.from, 'yyyy-MM-DD').isSameOrBefore(moment())));
        } else { return stake; }
      }).map(stakeholder => {
        const editPermission = stakeholder.permissions && stakeholder.permissions.filter(p => p.level === 'EDIT').length > 0;
        const readPermission = stakeholder.permissions && stakeholder.permissions.filter(p => p.level === 'READ').length > 0;
        const samePlan = (!stakeholder.permissions || stakeholder.permissions.length === 0) || (stakeholder.permissions && stakeholder.permissions.filter(p => p.idPlan === this.idPlan).length > 0);
        return {
          typeCardItem: 'listItemStakeholder',
          icon: stakeholder.person ? (editPermission ? IconsEnum.UserEdit : (readPermission ? IconsEnum.UserRead : IconsEnum.UserCircle)) : IconsEnum.Building,
          iconSvg: true,
          nameCardItem: stakeholder.person ? stakeholder.person.name : stakeholder.organization.name,
          fullNameCardItem: stakeholder.person ? stakeholder.person.fullName : stakeholder.organization.fullName,
          subtitleCardItem: stakeholder.roles && stakeholder.roles.filter(r => r.active && (!r.to || r.to === null || moment(r.to, 'yyyy-MM-DD').isSameOrAfter(moment()))
            && (!r.from || r.from === null || moment(r.from, 'yyyy-MM-DD').isSameOrBefore(moment()))).map(role => this.translateSrv.instant(role.role)).join(', '),
          itemId: stakeholder.person ? stakeholder.person.id : stakeholder.organization.id,
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            disabled: !samePlan,
            command: (event) => this.deleteStakeholder(stakeholder)
          }],
          urlCard: !!samePlan ? (stakeholder.person ? '/stakeholder/person' : '/stakeholder/organization') : undefined,
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.idWorkpack },
            { name: 'idPlan', value: this.idPlan },
            { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked },
            {
              name: stakeholder.person ? 'idPerson' : 'idOrganization',
              value: stakeholder.person ? stakeholder.person.id : stakeholder.organization.id
            }
          ],
          iconMenuItems: null
        };
      });
      cardItems.push({
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        iconSvg: true,
        nameCardItem: null,
        fullNameCardItem: null,
        subtitleCardItem: null,
        itemId: null,
        menuItems: null,
        urlCard: null,
        paramsUrlCard: null,
        iconMenuItems: [
          {
            label: this.translateSrv.instant('person'),
            icon: 'fas fa-user-circle',
            command: (event) => this.navigateToPageStakeholder('person')
          },
          {
            label: this.translateSrv.instant('organization'),
            icon: 'fas fa-building',
            command: (event) => this.navigateToPageStakeholder('organization')
          }
        ]
      });
      return cardItems;
    } else {
      const cardItem = [{
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        iconSvg: true,
        nameCardItem: null,
        itemId: null,
        menuItems: null,
        urlCard: null,
        iconMenuItems: [
          {
            label: this.translateSrv.instant('person'),
            icon: 'fas fa-user-circle',
            command: (event) => this.navigateToPageStakeholder('person')
          },
          {
            label: this.translateSrv.instant('organization'),
            icon: 'fas fa-building',
            command: (event) => this.navigateToPageStakeholder('organization')
          }
        ]
      }];
      return cardItem;
    }
  }

  async deleteStakeholder(stakeholder: IStakeholder) {
    if (stakeholder.person) {
      const result = await this.stakeholderSrv.deleteStakeholderPerson({
        'id-workpack': stakeholder.idWorkpack,
        'id-person': stakeholder.person.id,
        'id-plan': this.idPlan
      }, { useConfirm: true });
      if (result.success) {
        const stakeholderIndex = this.sectionStakeholder.cardItemsSection.findIndex(stake => stake.itemId === stakeholder.person.id);
        if (stakeholderIndex > -1) {
          this.sectionStakeholder.cardItemsSection.splice(stakeholderIndex, 1);
          this.sectionStakeholder.cardItemsSection = Array.from(this.sectionStakeholder.cardItemsSection);
        }
      }
    } else {
      const result = await this.stakeholderSrv.deleteStakeholderOrganization({
        'id-workpack': stakeholder.idWorkpack,
        'id-organization': stakeholder.organization.id
      }, { useConfirm: true });
      if (result.success) {
        const stakeholderIndex = this.sectionStakeholder.cardItemsSection.findIndex(stake => stake.itemId === stakeholder.organization.id);
        if (stakeholderIndex > -1) {
          this.sectionStakeholder.cardItemsSection.splice(stakeholderIndex, 1);
          this.sectionStakeholder.cardItemsSection = Array.from(this.sectionStakeholder.cardItemsSection);
          this.totalRecordsStakeholders = this.sectionStakeholder.cardItemsSection.length;
        }
      }
    }
  }

  async handleStakeholderInactiveToggle() {
    this.sectionStakeholder.cardItemsSection = await this.loadSectionStakeholderCards(this.stakeholderSectionShowInactives);
  }

  navigateToPageStakeholder(url) {
    this.router.navigate(
      [`stakeholder/${url}`],
      {
        queryParams: {
          idWorkpack: this.idWorkpack,
          idPlan: this.idPlan,
          idWorkpackModelLinked: this.idWorkpackModelLinked
        }
      }
    );
  }

  async loadSectionRisksCards(showClosed: boolean, idFilterSelected?: number) {
    const resultRisks = await this.riskSrv.GetAll({ 'id-workpack': this.idWorkpack, idFilter: idFilterSelected });
    this.risks = resultRisks.success ? resultRisks.data : [];
    if (this.risks && this.risks.length > 0) {
      const cardItems = !showClosed ? this.risks.filter(r => RisksPropertiesOptions.status[r.status].label === 'open').map(risk => ({
        typeCardItem: 'listItem',
        icon: RisksPropertiesOptions.status[risk.status].icon,
        iconColor: RisksPropertiesOptions.importance[risk.importance].label,
        iconSvg: false,
        nameCardItem: risk.name,
        itemId: risk.id,
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteRisk(risk),
          disabled: !this.editPermission
        }] as MenuItem[],
        urlCard: '/workpack/risks',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.idWorkpack },
          { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked },
          { name: 'id', value: risk.id },
        ]
      })) :
        this.risks.map(risk => ({
          typeCardItem: 'listItem',
          icon: RisksPropertiesOptions.status[risk.status].icon,
          iconColor: RisksPropertiesOptions.importance[risk.importance].label,
          iconSvg: false,
          nameCardItem: risk.name,
          itemId: risk.id,
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteRisk(risk),
            disabled: !this.editPermission
          }] as MenuItem[],
          urlCard: '/workpack/risks',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked },
            { name: 'id', value: risk.id },
          ]
        }));
      if (this.editPermission) {
        cardItems.push({
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconColor: null,
          iconSvg: true,
          nameCardItem: null,
          itemId: null,
          menuItems: null,
          urlCard: '/workpack/risks',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked },
          ]
        });
      }
      return cardItems;
    } else {
      if (this.editPermission) {
        const cardItem = [{
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconSvg: true,
          nameCardItem: null,
          itemId: null,
          menuItems: null,
          urlCard: '/workpack/risks',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked },
          ]
        }];
        return cardItem;
      } else { return []; };
    }
  }

  handleCreateNewRisk() {
    this.router.navigate(['/workpack/risks'], {
      queryParams: {
        idWorkpack: this.idWorkpack,
        edit: this.editPermission,
      }
    });
  }

  async deleteRisk(risk: IRisk) {
    const result = await this.riskSrv.delete(risk, { useConfirm: true });
    if (result.success) {
      this.sectionRisk.cardItemsSection = Array.from(this.sectionRisk.cardItemsSection.filter(r => r.itemId !== risk.id));
    }
  }

  async handleRiskShowClosedToggle() {
    this.sectionRisk.cardItemsSection = await this.loadSectionRisksCards(this.riskSectionShowClosed);
  }

  async loadSectionIssuesCards(showClosed: boolean, idFilterIssueSelected?: number) {
    const resultIssues = await this.issueSrv.GetAll({ 'id-workpack': this.idWorkpack, idFilter: idFilterIssueSelected });
    this.issues = resultIssues.success ? resultIssues.data : [];
    if (this.issues && this.issues.length > 0) {
      const cardItems = !showClosed ? this.issues.filter(r => IssuesPropertiesOptions.status[r.status].value === 'OPEN').map(issue => ({
        typeCardItem: 'listItem',
        icon: 'Issue',
        iconColor: IssuesPropertiesOptions.importance[issue.importance].label,
        iconSvg: true,
        nameCardItem: issue.name,
        itemId: issue.id,
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteIssue(issue),
          disabled: !this.editPermission
        }] as MenuItem[],
        urlCard: '/workpack/issues',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.idWorkpack },
          { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked },
          { name: 'id', value: issue.id },
        ]
      })) :
        this.issues.map(issue => ({
          typeCardItem: 'listItem',
          icon: 'Issue',
          iconColor: IssuesPropertiesOptions.importance[issue.importance].label,
          iconSvg: true,
          nameCardItem: issue.name,
          itemId: issue.id,
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteIssue(issue),
            disabled: !this.editPermission
          }] as MenuItem[],
          urlCard: '/workpack/issues',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked },
            { name: 'id', value: issue.id },
          ]
        }));
      if (this.editPermission) {
        cardItems.push({
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconColor: null,
          iconSvg: true,
          nameCardItem: null,
          itemId: null,
          menuItems: null,
          urlCard: '/workpack/issues',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked },
          ]
        });
      }
      return cardItems;
    } else {
      const cardItem = this.editPermission ? [{
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        iconSvg: true,
        nameCardItem: null,
        itemId: null,
        menuItems: null,
        urlCard: '/workpack/issues',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.idWorkpack },
          { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked },
        ]
      }] : [];
      return cardItem;
    }
  }

  handleCreateNewIssue() {
    this.router.navigate(['/workpack/issues'], {
      queryParams: {
        idWorkpack: this.idWorkpack,
        edit: this.editPermission,
      }
    });
  }

  async deleteIssue(issue: IIssue) {
    const result = await this.issueSrv.delete(issue, { useConfirm: true });
    if (result.success) {
      this.sectionIssue.cardItemsSection = Array.from(this.sectionIssue.cardItemsSection.filter(i => i.itemId !== issue.id));
    }
  }

  async handleIssueShowClosedToggle() {
    this.sectionIssue.cardItemsSection = await this.loadSectionIssuesCards(this.issueSectionShowClosed);
  }

  async loadSectionProcessesCards(idFilterSelected: number) {
    const resultProcess = await this.processSrv.GetAll({ 'id-workpack': this.idWorkpack, idFilter: idFilterSelected });
    this.processes = resultProcess.success ? resultProcess.data : [];
    if (this.processes && this.processes.length > 0) {
      const cardItems = this.processes.map(proc => ({
        typeCardItem: 'listItemProcess',
        icon: 'process',
        iconSvg: true,
        nameCardItem: proc.name,
        subtitleCardItem: proc.processNumber,
        organizationName: proc.currentOrganization,
        itemId: proc.id,
        priority: proc.priority,
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteProcess(proc),
          disabled: !this.editPermission
        }] as MenuItem[],
        urlCard: '/workpack/processes',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.idWorkpack },
          { name: 'id', value: proc.id },
        ]
      }));
      cardItems.push({
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        iconSvg: true,
        nameCardItem: null,
        subtitleCardItem: null,
        organizationName: null,
        itemId: null,
        priority: false,
        menuItems: null,
        urlCard: '/workpack/processes',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.idWorkpack },
        ]
      });
      return cardItems;
    } else {
      const cardItem = [{
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        iconSvg: true,
        nameCardItem: null,
        itemId: null,
        menuItems: null,
        urlCard: '/workpack/processes',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.idWorkpack },
        ]
      }];
      return cardItem;
    }
  }

  async deleteProcess(process: IProcess) {
    const result = await this.processSrv.delete(process, { useConfirm: true });
    if (result.success) {
      this.sectionProcess.cardItemsSection = Array.from(this.sectionProcess.cardItemsSection.filter(i => i.itemId !== process.id));
    }
  }

  async loadCardItemsCostSession(idFilter?: number) {
    const result = await this.costAccountSrv.GetAll({ 'id-workpack': this.idWorkpack, idFilter });
    if (result.success && result.data.length > 0) {
      this.costAccounts = this.moveCostAccountOutherWorkpackToEnd(result.data);
      const funders = (this.idOffice || this.idOfficeOwnerWorkpackLinked) && await this.loadOrganizationsOffice(this.idOfficeOwnerWorkpackLinked ? this.idOfficeOwnerWorkpackLinked : this.idOffice);
      const namesWorckpack = await this.loadNameWorkpackCostAccount(result.data);
      const cardItems = this.costAccounts.map(cost => {
        const propertyName = cost.models.find(p => p.name === 'name');
        const propertyNameValue = propertyName && cost.properties.find(p => p.idPropertyModel === propertyName.id);
        const propertyfullName = cost.models.find(p => p.name === 'fullName');
        const propertyFullnameValue = propertyfullName && cost.properties.find(p => p.idPropertyModel === propertyfullName.id);
        const propertyNameWorkpack = namesWorckpack.find(names => names.idWorkpack === cost.idWorkpack);
        const propertyLimit = cost.models.find(p => p.name.toLowerCase() === 'limit');
        const propertyLimitValue = propertyLimit && cost.properties.find(p => p.idPropertyModel === propertyLimit.id);
        const propertyFunder = cost.models.find(p => p.name.toLowerCase() === 'funder');
        const propertyFunderValue = propertyFunder && cost.properties.find(p => p.idPropertyModel === propertyFunder.id);
        const selectedFunder = propertyFunderValue && (funders
          && funders.filter(org => org.value === propertyFunderValue.selectedValues[0]));
        const costThisWorkpack = cost.idWorkpack === this.idWorkpack;
        return {
          typeCardItem: 'listItemCostAccount',
          icon: 'fas fa-dollar-sign',
          iconSvg: false,
          nameCardItem: propertyNameValue && propertyNameValue.value as string,
          fullNameCardItem: costThisWorkpack ?
            propertyFullnameValue && propertyFullnameValue.value as string :
            propertyNameWorkpack && propertyNameWorkpack.name as string,
          subtitleCardItem: selectedFunder && selectedFunder[0]?.label,
          costAccountsValue: propertyLimitValue?.value as number,
          itemId: cost.id,
          idWorkpack: cost.idWorkpack.toString(),
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteCostAccount(cost),
            disabled: !this.editPermission
          }] as MenuItem[],
          urlCard: costThisWorkpack ? '/workpack/cost-account' : '/workpack',
          paramsUrlCard: [
            { name: costThisWorkpack ? 'idWorkpack' : 'id', value: cost.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked }
          ],
          iconMenuItems: null
        };
      });
      if (this.editPermission) {
        cardItems.push({
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconSvg: true,
          nameCardItem: null,
          fullNameCardItem: null,
          subtitleCardItem: null,
          costAccountsValue: null,
          itemId: null,
          idWorkpack: this.idWorkpack.toString(),
          menuItems: [],
          urlCard: '/workpack/cost-account',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked }
          ],
          iconMenuItems: null
        });
      }
      return cardItems;
    }
    const cardItemsNew = this.editPermission ? [{
      typeCardItem: 'newCardItem',
      icon: IconsEnum.Plus,
      iconSvg: true,
      nameCardItem: null,
      subtitleCardItem: null,
      costAccountsValue: null,
      itemId: null,
      idWorkpack: this.idWorkpack.toString(),
      menuItems: [],
      urlCard: '/workpack/cost-account',
      paramsUrlCard: [
        { name: 'idWorkpack', value: this.idWorkpack },
        { name: 'idWorkpackModelLinked', value: this.idWorkpackModelLinked }
      ],
      iconMenuItems: null
    }] : [];
    return cardItemsNew;
  }

  handleCreateNewCostAccount() {
    this.router.navigate(['/workpack/cost-account'], {
      queryParams: {
        idWorkpack: this.idWorkpack,
        idWorkpackModelLinked: this.idWorkpackModelLinked
      }
    });
  }

  moveCostAccountOutherWorkpackToEnd(costAccounts: ICostAccount[]) {
    costAccounts.sort((a, b) => {
      if (a.idWorkpack != this.idWorkpack) {
        return -1;
      }
      return 0;
    });
    costAccounts.reverse();
    return costAccounts;
  }

  async loadNameWorkpackCostAccount(costAccounts: ICostAccount[]) {
    const namesWorkpackCostAccount = await costAccounts
      .filter(cost => cost.idWorkpack != this.idWorkpack)
      .map(cost => cost.idWorkpack)
      .reduce((IdsWorkpack, idWorkpack) => IdsWorkpack.includes(idWorkpack) ? IdsWorkpack : [...IdsWorkpack, idWorkpack], [])
      .map(async(idWorkpack) => {
        const result = await this.workpackSrv.GetWorkpackById(idWorkpack, { 'id-plan': this.idPlan });
        if (result.success) {
          const workpack = result.data;
          const propertyNameWorkpackModel = this.workpack.model.properties.find(p => p.name === 'name' && p.session === 'PROPERTIES');
          const propertyNameWorkpack = this.workpack.properties.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
          this.workpackName = propertyNameWorkpack.value as string;
          return { idWorkpack, name: `${workpack.model.modelName}: ${propertyNameWorkpack.value}` };
        }
      });
    return Promise.all(await namesWorkpackCostAccount);
  }

  async deleteCostAccount(cost: ICostAccount) {
    const result = await this.costAccountSrv.delete(cost);
    if (result.success) {
      this.sectionCostAccount.cardItemsSection =
        Array.from(this.sectionCostAccount.cardItemsSection.filter(item => item.itemId !== cost.id));
      this.totalRecordsCostAccounts = this.sectionCostAccount.cardItemsSection.length;
      return;
    }
  }

  async loadScheduleSession() {
    const result = await this.scheduleSrv.GetSchedule({ 'id-workpack': this.idWorkpack });
    if (result.success && result.data && result.data.length > 0) {
      this.schedule = result.data[0];
      const unitMeasureWorkpack = this.sectionPropertiesProperties.find(prop => prop.type === this.typePropertyModel.UnitSelectionModel);
      const unitMeasure = await this.unitMeasureSrv.GetById(unitMeasureWorkpack?.selectedValue as number);
      this.unitMeansure = unitMeasure.success && unitMeasure.data;
      if (this.unitMeansure && !this.unitMeansure.precision) {
        this.unitMeansure.precision = 0;
      }
      const groupStep = this.schedule.groupStep.map((group, groupIndex, groupArray) => {
        const cardItemSection = group.steps.map((step, stepIndex, stepArray) => ({
          type: 'listStep',
          stepName: new Date(step.periodFromStart + 'T00:00:00'),
          menuItems: (groupIndex === 0 && stepIndex === 0) ? [{
            label: this.translateSrv.instant('properties'),
            icon: 'fas fa-edit',
            command: () => this.editScheduleStep(step.id, this.unitMeansure.name, this.unitMeansure.precision, 'start')
          }] : ((groupIndex === groupArray.length - 1 && stepIndex === stepArray.length - 1) ?
            [{
              label: this.translateSrv.instant('properties'),
              icon: 'fas fa-edit',
              command: () => this.editScheduleStep(step.id, this.unitMeansure.name, this.unitMeansure.precision, 'end')
            }] : [{
              label: this.translateSrv.instant('properties'),
              icon: 'fas fa-edit',
              command: () => this.editScheduleStep(step.id, this.unitMeansure.name, this.unitMeansure.precision, 'step')
            }]),
          stepOrder: (groupIndex === 0 && stepIndex === 0) ? 'start' : ((groupIndex === groupArray.length - 1 && stepIndex === stepArray.length - 1) ? 'end' : 'step'),
          unitPlanned: step.plannedWork ? step.plannedWork : 0,
          unitActual: step.actualWork ? step.actualWork : 0,
          unitBaseline: step.baselinePlannedWork ? step.baselinePlannedWork : 0,
          unitProgressBar: {
            total: step.plannedWork,
            progress: step.actualWork,
            color: '#FF8C00',
          },
          costPlanned: step.consumes?.reduce((total, v) => (total + (v.plannedCost ? v.plannedCost : 0)), 0),
          costActual: step.consumes?.reduce((total, v) => (total + (v.actualCost ? v.actualCost : 0)), 0),
          baselinePlannedCost: step.consumes?.reduce((total, v) => (total + (v.baselinePlannedCost ? v.baselinePlannedCost : 0)), 0),
          costProgressBar: {
            total: (step.consumes?.reduce((total, v) => (total + (v.plannedCost ? v.plannedCost : 0)), 0)),
            progress: step.consumes?.reduce((total, v) => (total + (v.actualCost ? v.actualCost : 0)), 0),
            color: '#44B39B'
          },
          unitName: this.unitMeansure && this.unitMeansure.name,
          unitPrecision: this.unitMeansure && this.unitMeansure.precision,
          idStep: step.id
        }));
        return {
          year: group.year,
          cardItemSection
        };
      });
      const startDate = this.schedule && new Date(this.schedule.start + 'T00:00:00');
      const endDate = this.schedule && new Date(this.schedule.end + 'T00:00:00');
      const startScheduleStep = !!this.editPermission && {
        type: 'newStart',
        stepOrder: 'newStart',
        unitName: this.unitMeansure.name,
        unitPrecision: this.unitMeansure.precision,
      };
      const endScheduleStep = !!this.editPermission && {
        type: 'newEnd',
        stepOrder: 'newEnd',
        unitName: this.unitMeansure.name,
        unitPrecision: this.unitMeansure.precision,
      };
      const initialDatePlanned = moment(startDate);
      const finalDatePlanned = moment(endDate);
      const daysToPlanned = finalDatePlanned.diff(initialDatePlanned, 'days');
      const dateActual = moment(new Date());
      const daysToNow = dateActual.diff(initialDatePlanned, 'days');
      const baselineStartDate = this.schedule && new Date(this.schedule.baselineStart + 'T00:00:00');
      const baselineEndDate = this.schedule && new Date(this.schedule.baselineEnd + 'T00:00:00');
      const baselineDaysPlanned = moment(baselineEndDate).diff(moment(baselineStartDate), 'days');
      this.sectionSchedule = {
        cardSection: {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: 'schedule',
          collapseble: true,
          initialStateCollapse: this.collapsePanelsStatus,
          headerDates: this.schedule && {
            startDate,
            endDate
          },
          progressBarValues: [
            {
              total: Number(this.schedule.planed.toFixed(this.unitMeansure.precision)),
              progress: Number(this.schedule.actual.toFixed(this.unitMeansure.precision)),
              labelTotal: 'planned',
              labelProgress: 'actual',
              valueUnit: this.unitMeansure && this.unitMeansure.name,
              color: '#ffa342',
              barHeight: 17,
              baselinePlanned: Number(this.schedule.baselinePlaned.toFixed(this.unitMeansure.precision)),
            },
            {
              total: this.schedule.planedCost,
              progress: this.schedule.actualCost,
              labelTotal: 'planned',
              labelProgress: 'actual',
              valueUnit: 'currency',
              color: '#6cd3bd',
              barHeight: 17,
              baselinePlanned: Number(this.schedule.baselineCost.toFixed(this.unitMeansure.precision)),
            },
            {
              total: daysToPlanned,
              progress: daysToNow < 0 ? 0 : daysToNow,
              labelTotal: 'planned',
              labelProgress: 'actual',
              valueUnit: 'time',
              color: '#659ee1',
              barHeight: 17,
              baselinePlanned: baselineDaysPlanned,
              startDateBaseline: baselineStartDate,
              endDateBaseline: baselineEndDate,
              startDateTotal: startDate,
              endDateTotal: endDate,
            }
          ],
        },
        startScheduleStep,
        endScheduleStep,
        groupStep
      };
      if (this.sectionSchedule.groupStep && this.sectionSchedule.groupStep[0].cardItemSection) {
        this.sectionSchedule.groupStep[0].start = true;
        const idStartStep = this.sectionSchedule.groupStep[0].cardItemSection[0].idStep;
        if (!!this.editPermission) {
          this.sectionSchedule.groupStep[0].cardItemSection[0].menuItems.push({
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteScheduleStep(idStartStep)
          });
        }
        this.sectionSchedule.groupStep[0].cardItemSection[0].stepDay = startDate;
        const groupStepItems: IScheduleStepCardItem[] = [startScheduleStep];
        this.sectionSchedule.groupStep[0].cardItemSection.forEach(card => {
          groupStepItems.push(card);
        });
        this.sectionSchedule.groupStep[0].cardItemSection = Array.from(groupStepItems);
      }
      const groupLenght = this.sectionSchedule.groupStep && this.sectionSchedule.groupStep.length;
      if (this.sectionSchedule.groupStep && this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection) {
        this.sectionSchedule.groupStep[groupLenght - 1].end = true;
        const cardItemSectionLenght = this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection.length;
        const idEndStep = this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection[cardItemSectionLenght - 1].idStep;
        if (!!this.editPermission) {
          this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection[cardItemSectionLenght - 1].menuItems.push({
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) =>
              this.deleteScheduleStep(idEndStep)
          });
        }
        this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection[cardItemSectionLenght - 1].stepDay = endDate;
        this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection.push(endScheduleStep);
      }
      return;
    }
    this.sectionSchedule = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: 'schedule',
        collapseble: true,
        initialStateCollapse: this.collapsePanelsStatus,
      }
    };
  }

  async handleNewSchedule() {
    if (!this.unitMeansure) {
      const unitMeasureWorkpack = this.sectionPropertiesProperties.find(prop => prop.type === this.typePropertyModel.UnitSelectionModel);
      const unitMeasure = await this.unitMeasureSrv.GetById(unitMeasureWorkpack?.selectedValue as number);
      this.unitMeansure = unitMeasure.success && unitMeasure.data;
    }
    this.router.navigate(
      ['workpack/schedule'],
      {
        queryParams: {
          idWorkpack: this.idWorkpack,
          unitMeansureName: this.unitMeansure?.name
        }
      }
    );
  }

  handleShowDetails() {
    this.showDetails = !this.showDetails;
  }

  async handleDeleteSchedule() {
    const result = await this.scheduleSrv.DeleteSchedule(this.schedule.id, { useConfirm: true });
    if (result.success) {
      this.schedule = null;
      this.sectionSchedule.groupStep = null;
      await this.loadScheduleSession();
    }
  }

  editScheduleStep(idStep: number, unitName: string, unitPrecision: number, stepType: string) {
    this.router.navigate(
      ['workpack/schedule/step'],
      {
        queryParams: {
          id: idStep,
          stepType,
          unitName,
          unitPrecision
        }
      }
    );
  }

  async deleteScheduleStep(idStep: number) {
    const result = await this.scheduleSrv.DeleteScheduleStep(idStep);
    if (result.success) {
      await this.loadScheduleSession();
    }
  }

  async saveStepChanged(groupYear: number, idStep: number) {
    const stepGroup = this.schedule.groupStep.find(group => group.year === groupYear);
    const step = stepGroup.steps.find(s => s.id === idStep);
    const stepChanged = this.sectionSchedule.groupStep.find(group => group.year === groupYear)
      .cardItemSection.find(s => s.idStep === idStep);
    const result = await this.scheduleSrv.putScheduleStep({
      id: step.id,
      plannedWork: stepChanged.unitPlanned,
      actualWork: stepChanged.unitActual,
      consumes: step.consumes?.map(consume => ({
        actualCost: consume.actualCost,
        plannedCost: consume.plannedCost,
        idCostAccount: consume.costAccount.id,
        id: consume.id
      }))
    });
    if (result.success) {
      const scheduleChanged = await this.scheduleSrv.GetScheduleById(this.schedule.id);
      if (scheduleChanged.success) {
        const scheduleValues = scheduleChanged.data;
        this.sectionSchedule.cardSection.progressBarValues[0].total = scheduleValues.planed;
        this.sectionSchedule.cardSection.progressBarValues[0].progress = scheduleValues.actual;
        this.sectionSchedule.cardSection.progressBarValues[1].total = scheduleValues.planedCost;
        this.sectionSchedule.cardSection.progressBarValues[1].progress = scheduleValues.actualCost;
      }
    }
  }

  scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async saveWorkpack() {
    this.workpackProperties = this.sectionPropertiesProperties.map(p => {
      if (p.type === TypePropertyModelEnum.GroupModel) {
        const groupedProperties = p.groupedProperties.map(groupProp => groupProp.getValues());
        return { ...p.getValues(), groupedProperties };
      }
      return p.getValues();
    });
    if (this.sectionPropertiesProperties.filter(p => p.invalid).length > 0) {
      this.messageSrv.add({
        severity: 'warn',
        summary: this.translateSrv.instant('messages.invalidField'),
        detail: this.translateSrv.instant('messages.invalidField'),
        life: 3000
      });
      this.scrollTop();
      return;
    }
    const isPut = !!this.idWorkpack;
    const workpack = isPut
      ? {
        id: this.idWorkpack,
        idParent: this.workpack.idParent,
        idPlan: this.workpack.plan.id,
        idWorkpackModel: this.workpack.model.id,
        type: this.workpack.type,
        properties: this.workpackProperties,
      }
      : {
        idPlan: this.idPlan,
        idWorkpackModel: this.idWorkpackModel,
        idParent: this.idWorkpackParent,
        type: TypeWorkpackEnum[this.workpackModel.type],
        properties: this.workpackProperties,
      };
    const { success, data } = isPut
      ? await this.workpackSrv.put(workpack)
      : await this.workpackSrv.post(workpack);

    if (success) {
      if (!isPut) {
        this.idWorkpack = data.id;
        await this.loadProperties();
      }
      const propertyNameWorkpackModel = (this.workpack?.model || this.workpackModel)
        .properties.find(p => p.name === 'name' && p.session === 'PROPERTIES');
      const propertyNameWorkpack = this.workpackProperties.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
      this.workpackName = propertyNameWorkpack.value as string;
      const propertyFullNameWorkpackModel = (this.workpack?.model || this.workpackModel)
        .properties.find(p => p.name === 'fullName' && p.session === 'PROPERTIES');
      const propertyFullNameWorkpack = this.workpackProperties.find(p => p.idPropertyModel === propertyFullNameWorkpackModel.id);
      this.workpackFullName = propertyFullNameWorkpack.value as string;
      this.breadcrumbSrv.updateLastCrumb({
        key: this.workpackModel?.type?.toLowerCase().replace('model', ''),
        info: this.workpackName,
        tooltip: this.workpackFullName,
        routerLink: ['/workpack'],
        queryParams: {
          id: this.idWorkpack
        }
      });
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.menuSrv.reloadMenuPortfolio();
    }
  }

  async handleEditFilterWorkpackModel(event, idWorkpackModel: number) {
    const idFilter = event.filter;
    if (idFilter) {
      await this.setBreadcrumbStorage();
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName: `workpacks`,
          idWorkpackModel,
          idOffice: this.idOffice
        }
      });
    }
  }

  async handleSelectedFilterWorkpackModel(event, idWorkpackModel: number) {
    const idFilter = event.filter;
    await this.reloadWorkpacksOfWorkpackModelSelectedFilter(idFilter, idWorkpackModel);
  }

  async handleNewFilterWorkpackModel(idWorkpackModel: number) {
    await this.setBreadcrumbStorage();
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: `workpacks`,
        idWorkpackModel,
        idOffice: this.idOffice
      }
    });
  }

  async reloadWorkpacksOfWorkpackModelSelectedFilter(idFilter: number, idWorkpackModel: number) {
    const workpacksByFilter = await this.loadWorkpacksFromWorkpackModel(this.workpack.plan.id, idWorkpackModel, idFilter);
    const workpackModelCardIndex = this.cardsWorkPackModelChildren.findIndex(card => card.idWorkpackModel === idWorkpackModel);
    if (workpackModelCardIndex > -1) {
      this.cardsWorkPackModelChildren[workpackModelCardIndex].cardItemsSection = Array.from(workpacksByFilter);
      this.totalRecordsWorkpacks[workpackModelCardIndex] = workpacksByFilter && workpacksByFilter.length;
    }
  }

  async handleEditFilterCostAccount(event) {
    const idFilter = event.filter;
    if (idFilter) {
      await this.setBreadcrumbStorage();
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName: `costAccounts`,
          idWorkpackModel: this.workpack.model.id,
          idOffice: this.idOffice
        }
      });
    }
  }

  async handleSelectedFilterCostAccount(event) {
    const idFilter = event.filter;
    this.sectionCostAccount = Object.assign({}, {
      ...this.sectionCostAccount,
      cardItemsSection: await this.loadCardItemsCostSession(idFilter)
    });
    this.totalRecordsCostAccounts = this.sectionCostAccount.cardItemsSection && this.sectionCostAccount.cardItemsSection.length;
  }

  async handleNewFilterCostAccount() {
    await this.setBreadcrumbStorage();
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: `costAccounts`,
        idWorkpackModel: this.workpack.model.id,
        idOffice: this.idOffice
      }
    });
  }

  async handleEditFilterEntity(event, entityName: string) {
    const idFilter = event.filter;
    if (idFilter) {
      const filterProperties = this.loadFilterPropertiesList(entityName);
      this.filterSrv.setFilterProperties(filterProperties);
      await this.setBreadcrumbStorage();
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName,
          idWorkpackModel: this.workpack.model.id,
          idOffice: this.idOffice
        }
      });
    }
  }

  async handleSelectedFilterStakeholder(event) {
    const idFilter = event.filter;
    await this.loadStakeholders(idFilter);
    this.sectionStakeholder = Object.assign({}, {
      ...this.sectionStakeholder,
      cardItemsSection: await this.loadSectionStakeholderCards(this.stakeholderSectionShowInactives)
    });
    this.totalRecordsStakeholders = this.sectionStakeholder.cardItemsSection && this.sectionStakeholder.cardItemsSection.length;
  }

  async handleNewFilterEntity(entityName: string) {
    await this.setBreadcrumbStorage();
    const filterProperties = this.loadFilterPropertiesList(entityName);
    this.filterSrv.setFilterProperties(filterProperties);
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName,
        idWorkpackModel: this.workpack.model.id,
        idOffice: this.idOffice
      }
    });
  }

  async handleSelectedFilterRisk(event) {
    const idFilter = event.filter;
    this.sectionRisk = Object.assign({}, {
      ...this.sectionRisk,
      cardItemsSection: await this.loadSectionRisksCards(this.riskSectionShowClosed, idFilter)
    });
    this.totalRecordsRisks = this.sectionRisk.cardItemsSection && this.sectionRisk.cardItemsSection.length;
  }

  async handleSelectedFilterIssue(event) {
    const idFilter = event.filter;
    this.sectionIssue = Object.assign({}, {
      ...this.sectionIssue,
      cardItemsSection: await this.loadSectionIssuesCards(this.issueSectionShowClosed, idFilter)
    });
    this.totalRecordsIssues = this.sectionIssue.cardItemsSection && this.sectionIssue.cardItemsSection.length;
  }

  async handleSelectedFilterProcess(event) {
    const idFilter = event.filter;
    this.sectionProcess = Object.assign({}, {
      ...this.sectionProcess,
      cardItemsSection: await this.loadSectionProcessesCards(idFilter)
    });
    this.totalRecordsIssues = this.sectionProcess.cardItemsSection && this.sectionProcess.cardItemsSection.length;
  }

  loadFilterPropertiesList(entityName: string) {
    const listProperties = FilterDataviewPropertiesEntity[entityName];
    const filterPropertiesList = listProperties.map(prop => {
      const property: IFilterProperty = {
        type: prop.type,
        label: prop.label,
        name: prop.apiValue,
        active: true,
        possibleValues: prop.possibleValues
      };
      if (prop.label === 'role' && entityName === 'stakeholders') {
        property.possibleValues = this.workpackModel.personRoles && this.workpackModel.personRoles.map(role => ({
          label: role,
          value: role
        }));
        property.possibleValues = this.workpackModel.organizationRoles && [...property.possibleValues, ...this.workpackModel.organizationRoles.filter(r => !property.possibleValues.find(pv => pv.label === r))
          .map(role => ({
            label: role,
            value: role
          }))];
      }
      return property;
    });
    return filterPropertiesList;
  }

  async setBreadcrumbStorage() {
    this.breadcrumbSrv.setBreadcrumbStorage([
      ... await this.getBreadcrumbs(),
      ... this.idWorkpack
        ? []
        : [{
          key: this.workpackModel?.type?.toLowerCase().replace('model', ''),
          info: this.workpackName,
          tooltip: this.workpackFullName,
          routerLink: ['/workpack'],
          queryParams: {
            idPlan: this.idPlan,
            idWorkpackModel: this.idWorkpackModel,
            idWorkpackParent: this.idWorkpackParent,
            idWorkpackModelLinked: this.idWorkpackModelLinked
          },
          modelName: this.workpackModel?.modelName
        }],
      ...[{
        key: 'filter',
        routerLink: ['/filter-dataview'],
      }]
    ]);
  }

}
