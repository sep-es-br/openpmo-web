import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ConfirmationService, MenuItem, MessageService, SelectItem } from 'primeng/api';

import { IconPropertyWorkpackModelEnum as IconPropertyEnum } from 'src/app/shared/enums/IconPropertyWorkpackModelEnum';
import { TypePropertyWorkpackModelEnum as TypePropertyEnum } from 'src/app/shared/enums/TypePropertyWorkpackModelEnum';
import { TypeWorkpackModelEnum } from 'src/app/shared/enums/TypeWorkpackModelEnum';
import { IconsRegularEng, IconsRegularPt, IconsSolidEng, IconsSolidPt } from 'src/app/shared/font-awesome-icons-constants';
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

interface IIcon {
  name: string;
  label: string;
};

interface IGroup {
  title: string;
  properties: IWorkpackModelProperty[];
  groups: IGroup[];
  menuProperties: MenuItem[];
};

enum PropertySessionEnum {
  PROPERTIES = 'PROPERTIES',
  COST = 'COST'
};

@Component({
  selector: 'app-workpack-model',
  templateUrl: './workpack-model.component.html',
  styleUrls: ['./workpack-model.component.scss']
})
export class WorkpackModelComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  idOffice: number;
  idStrategy: number;
  idWorkpackModel: number;
  idParentWorkpack: number;
  workpackModelType: TypeWorkpackModelEnum;
  cardProperties: ICard;
  cardPropertiesStakeholders: ICard;
  cardPropertiesCostAccount: ICard;
  cardPropertiesModels: ICard;
  cardPropertiesSchedule: ICard;
  posibleRolesPerson: string[] = [ 'User' ];
  posibleRolesOrg: string[] = [ 'Sponsor' ];
  formProperties: FormGroup;
  icons: IIcon[];
  modelProperties: IWorkpackModelProperty[] = [];
  menuModelProperties: MenuItem[] = [];
  modelCostProperties: IWorkpackModelProperty[] = [];
  menuCostProperties: MenuItem[] = [];
  listDomains: SelectItem[] = [];
  listOrganizations: SelectItem[] = [];
  listMeasureUnits: SelectItem[] = [];
  listLocalities: SelectItem[] = [];
  groups: IGroup[] = [];
  currentLang: string;
  childrenModels: IWorkpackModel[] = [];
  cardItemsModels: ICardItem[];
  $destroy = new Subject();
  isMobileView = false;
  editPermission = false;

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
    private officePermissionSrv: OfficePermissionService
  ) {
    this.activeRoute.queryParams.subscribe(async({ idOffice, idStrategy, id, idParent, type }) => {
      if (id && this.idWorkpackModel === Number(id)) {
        // refresh on adding id to query
        return;
      }
      this.idOffice = +idOffice;
      this.idStrategy = +idStrategy;
      this.idWorkpackModel = +id;
      this.idParentWorkpack = +idParent;
      this.workpackModelType = type;
      this.resetValues();
      this.editPermission = await this.officePermissionSrv.getPermissions(idOffice);
      await this.loadDetails();
      this.loadCardItemsModels();
      this.breadcrumbSrv.pushMenu({
        key: 'workpackModel',
        info: this.idWorkpackModel
          ? this.formProperties.controls.name.value
          : `${this.translateSrv.instant('new')} ${this.translateSrv.instant('labels.' + this.workpackModelType)}`,
        routerLink: [ '/workpack-model' ],
        queryParams: {
          idStrategy,
          id,
          type,
          idOffice
        }
      });
      this.scrollTop();
    });
    this.formProperties = this.fb.group({
      name: [ '', Validators.required ],
      nameInPlural: [ '', Validators.required ],
      icon: [ undefined, Validators.required ],
      sortedBy: 'Name'
    });
    this.formProperties.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formProperties.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formProperties.dirty && this.formProperties.valid))
      .subscribe(() => this.checkProperties());
    this.translateSrv.onLangChange
      .pipe(takeUntil(this.$destroy)).subscribe(({ lang }) => {
        this.currentLang = lang;
        this.loadIcons();
        this.loadMenuProperty(PropertySessionEnum.PROPERTIES);
        this.loadMenuProperty(PropertySessionEnum.COST);
      });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(r => this.isMobileView = r);
  }

  get sortedByList(): SelectItem[] {
    return this.modelProperties.filter(p => p.label !== undefined).map(p => ({ label: p.label, value: p.label }));
  }

  resetValues() {
    if (this.formProperties) {
      this.formProperties.reset();
      this.formProperties.controls.sortedBy.setValue('name');
    }
    this.posibleRolesOrg = [];
    this.posibleRolesPerson = [];
    this.modelProperties = [];
    this.modelCostProperties = [];
    this.childrenModels = [];
    this.cardItemsModels = [];
  }

  ngOnInit(): void {
    this.currentLang = this.translateSrv.getDefaultLang();
    this.loadIcons();
    this.loadMenuProperty(PropertySessionEnum.PROPERTIES);
    this.loadMenuProperty(PropertySessionEnum.COST);
  }

  async loadDetails() {
    this.loadCards();
    if (this.idWorkpackModel) {
      if (!this.editPermission) {
        this.formProperties.disable();
      }
      await this.loadWorkpackModel();
    } else if (this.editPermission){
      this.loadDefaultProperties();
    }
  }

  loadDefaultProperties() {
    const defaultProperties: IWorkpackModelProperty[] = [
      {
        active: true,
        label: this.translateSrv.instant('name'),
        name: 'name',
        type: TypePropertyEnum.TextModel,
        obligatory: true,
        max: 25,
        sortIndex: 0,
        fullLine: true,
        required: true
      },
      {
        active: true,
        label: this.translateSrv.instant('fullName'),
        name: 'fullName',
        type: TypePropertyEnum.TextAreaModel,
        sortIndex: 1,
        obligatory: true,
        fullLine: true,
        required: true
      }
    ];
    switch (this.workpackModelType) {
      case TypeWorkpackModelEnum.ProgramModel:
        defaultProperties.push({
          active: true,
          label: 'Status',
          name: 'Status',
          type: TypePropertyEnum.SelectionModel,
          multipleSelection: false,
          // Tradução ???
          possibleValues: Object.values(this.translateSrv.instant([ 'finished', 'structuring', 'execution', 'suspended' ])),
          sortIndex: 2,
          defaultValue: '',
          fullLine: true
        },
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
          type: TypePropertyEnum.NumberModel,
          sortIndex: 2,
          fullLine: true
        });
        break;
      case TypeWorkpackModelEnum.DeliverableModel:
        defaultProperties.push(
          {
            active: true,
            label: this.translateSrv.instant('type'),
            name: this.translateSrv.instant('type'),
            type: TypePropertyEnum.SelectionModel,
            multipleSelection: false,
            possibleValues: Object.values(this.translateSrv.instant([ 'construction', 'service', 'planStudySearch',
              'standard', 'equipment', 'others' ])),
            sortIndex: 2,
            defaultValue: '',
            fullLine: true
          },
          {
            active: true,
            label: 'Status',
            name: 'Status',
            type: TypePropertyEnum.SelectionModel,
            multipleSelection: false,
            possibleValues: Object.values(this.translateSrv.instant([ 'preparatoryActions', 'projectElaboration', 'projectElaborated',
              'agreementSigned', 'publishedNotice', 'biddingFinished', 'signedContract', 'executationStarted', 'finished', 'blocked' ])),
            defaultValue: this.translateSrv.instant('preparatoryActions'),
            sortIndex: 3,
            fullLine: true
          },
          {
            active: true,
            label: this.translateSrv.instant('annualOperationCost'),
            name: this.translateSrv.instant('annualOperationCost'),
            type: TypePropertyEnum.CurrencyModel,
            sortIndex: 4,
            fullLine: true
          },
          {
            active: true,
            label: this.translateSrv.instant('counties'),
            name: this.translateSrv.instant('counties'),
            type: TypePropertyEnum.LocalitySelectionModel,
            multipleSelection: true,
            sortIndex: 5,
            fullLine: true
          },
          {
            active: true,
            label: this.translateSrv.instant('measureUnit'),
            name: this.translateSrv.instant('measureUnit'),
            type: TypePropertyEnum.UnitSelectionModel,
            multipleSelection: false,
            obligatory: true,
            sortIndex: 6,
            fullLine: true
          }
        );
        this.loadDefaultPropertiesCostAccount();
        break;
      case TypeWorkpackModelEnum.ProjectModel:
        defaultProperties.push(
          {
            active: true,
            label: 'Status',
            name: 'Status',
            type: TypePropertyEnum.SelectionModel,
            multipleSelection: false,
            possibleValues: Object.values(this.translateSrv.instant([ 'finished', 'structuring', 'execution', 'suspended' ])),
            sortIndex: 2,
            defaultValue: '',
            fullLine: true
          },
          { active: true, label: this.translateSrv.instant('justification'), name: this.translateSrv.instant('justification'),
            type: TypePropertyEnum.TextModel, sortIndex: 3, fullLine: true },
          { active: true, label: this.translateSrv.instant('targetAudience'), name: this.translateSrv.instant('targetAudience'),
            type: TypePropertyEnum.TextModel, sortIndex: 4, fullLine: true },
          { active: true, label: this.translateSrv.instant('projectObjective'), name: this.translateSrv.instant('projectObjective'),
            type: TypePropertyEnum.TextModel, sortIndex: 5, fullLine: true },
          { active: true, label: this.translateSrv.instant('scope'), name: this.translateSrv.instant('scope'),
            type: TypePropertyEnum.TextModel, sortIndex: 6, fullLine: true },
          { active: true, label: this.translateSrv.instant('premises'), name: this.translateSrv.instant('premises'),
            type: TypePropertyEnum.TextModel, sortIndex: 7, fullLine: true },
          { active: true, label: this.translateSrv.instant('restrictions'), name: this.translateSrv.instant('restrictions'),
            type: TypePropertyEnum.TextModel, sortIndex: 8, fullLine: true }
        );
        break;
      case TypeWorkpackModelEnum.MilestoneModel:
        defaultProperties.push(
          { active: true, label: this.translateSrv.instant('date'), name: this.translateSrv.instant('date'),
            type: TypePropertyEnum.DateModel, sortIndex: 2, fullLine: true },
          { active: true, label: this.translateSrv.instant('statusCompleted'), name: this.translateSrv.instant('statusCompleted'),
            type: TypePropertyEnum.ToggleModel, sortIndex: 3, fullLine: true },
          {
            active: true,
            label: this.translateSrv.instant('type'),
            name: this.translateSrv.instant('type'),
            type: TypePropertyEnum.SelectionModel,
            multipleSelection: false,
            possibleValues: Object.values(this.translateSrv.instant([ 'projectManagement', 'agreement', 'environmentalLicensing',
              'standard', 'engineeringProject', 'construction', 'bidding', 'PPP', 'PMI', 'informationSystem'])),
            sortIndex: 4,
            fullLine: true
          }
        );
        break;
    }
    defaultProperties.forEach(prop => this.checkProperty(prop));
    this.modelProperties = defaultProperties;
  }

  loadDefaultPropertiesCostAccount() {
    const modelCostProperties: IWorkpackModelProperty[] = [
      {
        active: true,
        label: this.translateSrv.instant('name'),
        name: 'name',
        type: TypePropertyEnum.TextModel,
        obligatory: true,
        max: 25,
        sortIndex: 0,
        session: PropertySessionEnum.COST,
        fullLine: true,
        required: true
      },
      {
        active: true,
        label: this.translateSrv.instant('fullName'),
        name: 'fullName',
        type: TypePropertyEnum.TextAreaModel,
        sortIndex: 1,
        obligatory: true,
        session: PropertySessionEnum.COST,
        fullLine: true,
        required: true
      },
      {
        active: true,
        label: this.translateSrv.instant('limit'),
        name: 'limit',
        type: TypePropertyEnum.CurrencyModel,
        sortIndex: 2,
        obligatory: true,
        session: PropertySessionEnum.COST,
        fullLine: true
      },
      {
        active: true,
        label: this.translateSrv.instant('funder'),
        name: 'funder',
        type: TypePropertyEnum.OrganizationSelectionModel,
        sortIndex: 3,
        obligatory: true,
        session: PropertySessionEnum.COST,
        required: true,
        multipleSelection: false,
        fullLine: true
      },
      {
        active: true,
        label: this.translateSrv.instant('economicCategory'),
        name: this.translateSrv.instant('economicCategory'),
        type: TypePropertyEnum.SelectionModel,
        sortIndex: 4,
        session: PropertySessionEnum.COST,
        possibleValues: Object.values(this.translateSrv.instant([ 'capitalExpenses', 'currentExpenses' ])) as string[],
        multipleSelection: false,
        fullLine: true
      },
      {
        active: true,
        label: this.translateSrv.instant('source'),
        name: this.translateSrv.instant('source'),
        type: TypePropertyEnum.SelectionModel,
        sortIndex: 5,
        session: PropertySessionEnum.COST,
        possibleValues: Object.values(this.translateSrv.instant([ 'nonBudgetary', 'cashResources',
          'treasuryRelatedResources', 'ownResources' ])) as string[],
        multipleSelection: false,
        fullLine: true
      }
    ];
    modelCostProperties.map(prop => this.checkProperty(prop));
    this.modelCostProperties = modelCostProperties;
  }

  async loadWorkpackModel() {
    const { data, success } = await this.workpackModelSrv.GetById(this.idWorkpackModel);
    if (success) {
      this.workpackModelType = TypeWorkpackModelEnum[data.type];
      this.formProperties.reset({
        name: data.modelName,
        nameInPlural: data.modelNameInPlural || '',
        icon: data.fontIcon || '',
        sortedBy: data.sortBy?.label || 'Name'
      });
      this.posibleRolesOrg = data.organizationRoles || [];
      this.posibleRolesPerson = data.personRoles || [];
      if (data.properties) {
        const dataPropertiesAndIndex = (await Promise.all(data.properties
          .map(async(p, i) => {
            if (p.possibleValues) {
              p.possibleValues = (p.possibleValues as string).split(',');
            };
            if (p.defaultValue && p.multipleSelection) {
              p.defaultValue = (p.defaultValue as string).split(',');
            };
            if (p.idDomain) {
              p.extraList = await this.getListLocalities(p.idDomain);
            }
            //alterei aqui
            if (p.defaults) {
              const isArray = p.defaults instanceof Array;
              if (!p.multipleSelection && isArray) {
                p.defaults = (p.defaults as any[]).shift();
              }
            }
            await this.checkProperty(p);
            return [ p, i ];
          }))
        );
        const dataProperties = dataPropertiesAndIndex
          .sort((a, b) => a[1] > b[1] ? 1 : -1 )
          .map(prop => prop[0] as IWorkpackModelProperty);
        this.modelProperties = dataProperties.filter(p => !p.session || p.session === PropertySessionEnum.PROPERTIES);
        this.modelCostProperties = dataProperties.filter(p => p.session === PropertySessionEnum.COST);
      }
      this.cardPropertiesCostAccount.initialStateToggle = data.costSessionActive;
      this.cardPropertiesModels.initialStateToggle = data.childWorkpackModelSessionActive;
      this.cardPropertiesStakeholders.initialStateToggle = data.stakeholderSessionActive;
      if (this.workpackModelType === TypeWorkpackModelEnum.DeliverableModel) {
        this.cardPropertiesSchedule.initialStateToggle = data.scheduleSessionActive;
      }
      this.childrenModels = (data.children || []).sort((a,b) => a.id > b.id ? 1 : -1);
      this.loadCardItemsModels();
    };
  }

  async addProperty(type: TypePropertyEnum, session: PropertySessionEnum, group?: IGroup) {
    const newProperty: IWorkpackModelProperty  = {
      type,
      active: true,
      label: '',
      name: '',
      session,
      sortIndex: this.modelProperties.length,
      fullLine: true,
      required: false,
      multipleSelection: false
    };
    newProperty.isCollapsed = false;
    this.checkProperty(newProperty);
    return group
      ? group.properties.push(newProperty)
      : session === PropertySessionEnum.PROPERTIES
        ? this.modelProperties.push(newProperty)
        : this.modelCostProperties.push(newProperty);
  }

  async checkProperty(property: IWorkpackModelProperty) {
    let list = [];
    let requiredFields = [ 'name', 'label', 'sortIndex', 'session' ];
    switch (property.type) {
      case TypePropertyEnum.LocalitySelectionModel:
        requiredFields = requiredFields.concat([ 'idDomain', 'multipleSelection', 'defaults' ]);
        list = await this.getListDomains();
        break;
      case TypePropertyEnum.OrganizationSelectionModel:
        requiredFields = requiredFields.concat([ 'multipleSelection' ]);
        list = await this.getListOrganizations();
        break;
      case TypePropertyEnum.UnitSelectionModel:
        list = await this.getListMeasureUnits();
        break;
      case TypePropertyEnum.SelectionModel:
        requiredFields = requiredFields.concat([ 'possibleValues', 'multipleSelection', 'defaultValue' ]);
        break;
    }
    property.isCollapsed = property.isCollapsed === undefined || property.isCollapsed;
    property.list = list;
    property.session = property.session || PropertySessionEnum.PROPERTIES;
    property.requiredFields = requiredFields;
    property.viewOnly = !this.editPermission;
    property.obligatory = ['name', 'fullName'].includes(property.name);
  }

  async deleteProperty(property: IWorkpackModelProperty) {
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
        if (property.session === PropertySessionEnum.COST) {
          this.modelCostProperties = this.modelCostProperties.filter(p => p !== property);
        } else {
          this.modelProperties = this.modelProperties.filter(p => p !== property);
        }
        this.saveButton?.showButton();
      }
    });
  }

  async propertyChanged(event) {
    if (event?.property && this.editPermission) {
      // Domain selection changed
      event.property.extraList = await this.getListLocalities(event.property?.idDomain);
    }
    this.checkProperties();
  }

  checkProperties() {
    const properties: IWorkpackModelProperty[] = [ ... this.modelProperties, ... this.modelCostProperties ];
    // Value check
    const propertiesChecks: { valid: boolean; invalidKeys: string[]; prop: IWorkpackModelProperty}[] = properties.map(p => ({
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
      this.saveButton?.hideButton();
      return;
    };
    const separationForDuplicateCheck = properties.map(prop => [ prop.name + prop.session, prop.label + prop.session ])
      .reduce((a, b) => ((a[0].push(b[0])), a[1].push(b[1]), a),[[], []]);
    // Duplicated name check
    if (new Set(separationForDuplicateCheck[0]).size !== properties.length) {
      this.saveButton?.hideButton();
      return;
    };
    // Duplicated label check
    if (new Set(separationForDuplicateCheck[1]).size !== properties.length) {
      this.saveButton?.hideButton();
      return;
    }
    this.saveButton?.showButton();
    return;
  }

  addGroup(session: PropertySessionEnum, group?: IGroup) {
    const newGroup: IGroup = { title: '', groups: [], properties: [], menuProperties: [] };
    this.loadMenuProperty(session, newGroup);
    if (group) {
      return group.groups.push(newGroup);
    }
    return this.groups.push(newGroup);
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

  async getListOrganizations() {
    if (!this.listOrganizations.length) {
      const result = await this.organizationSrv.GetAll({ 'id-office': this.idOffice });
      if (result.success) {
        this.listOrganizations = result.data.map(d => ({ label: d.name, value: d.id }));
      }
    }
    return this.listOrganizations;
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

  async getListLocalities(idDomain: number) {
      const result = await this.localitySrv.GetAll({ 'id-domain': idDomain });
      if (result.success) {
        this.listLocalities = result.data.map(d => ({ label: d.name, value: d.id }));
      }
    return this.listLocalities;
  }

  loadMenuProperty(session: PropertySessionEnum, group?: IGroup) {
    if (this.currentLang && !['pt', 'en'].includes(this.currentLang)) {
      return;
    }
    if (group) {
      group.menuProperties = Object.keys(TypePropertyEnum)
        .map(type => ({
          label: this.translateSrv.instant(`labels.${TypePropertyEnum[type]}`),
          icon: IconPropertyEnum[TypePropertyEnum[type]],
          command: () => this.addProperty(TypePropertyEnum[type], session, group)
        }));
    } else {
      const menu = Object.keys(TypePropertyEnum)
        .map(type => ({
          label: this.translateSrv.instant(`labels.${TypePropertyEnum[type]}`),
          icon: IconPropertyEnum[TypePropertyEnum[type]],
          command: () => this.addProperty(TypePropertyEnum[type], session)
        }));
      if (session === PropertySessionEnum.COST) {
        this.menuCostProperties = menu;
      } else {
        this.menuModelProperties = menu;
      }
    }
  }

  loadIcons() {
    let regularIcons: IIcon[] = [];
    let solidIcons: IIcon[] = [];
    switch (this.currentLang) {
      case 'pt':
        regularIcons = IconsRegularPt
          .map((icon, index) => ({ name: `far fa-${IconsRegularEng[index]}`, label: icon.replace(/-/g, ' ') }));
        solidIcons = IconsSolidPt
          .map((icon, index) => ({ name: `fas fa-${IconsSolidEng[index]}`, label: icon.replace(/-/g, ' ') }));
        break;
      case 'en':
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
      initialStateCollapse: false
    };
    this.cardPropertiesStakeholders = {
      toggleable: this.editPermission,
      initialStateToggle: true,
      cardTitle: 'stakeholders',
      collapseble: true,
      initialStateCollapse: false,
      onToggle: new EventEmitter<boolean>()
    };
    this.cardPropertiesStakeholders.onToggle.pipe(takeUntil(this.$destroy)).subscribe(() => this.checkProperties());
    this.cardPropertiesCostAccount = {
      toggleable: this.editPermission,
      initialStateToggle: this.workpackModelType === TypeWorkpackModelEnum.DeliverableModel,
      cardTitle: 'costAccounts',
      collapseble: true,
      initialStateCollapse: false,
      onToggle: new EventEmitter<boolean>()
    };
    this.cardPropertiesCostAccount.onToggle.pipe(takeUntil(this.$destroy)).subscribe(toggleOn => {
      if (!toggleOn && this.cardPropertiesSchedule?.initialStateToggle) {
        this.messageSrv.add({
          severity: 'warn',
          summary: this.translateSrv.instant('warn'),
          detail: this.translateSrv.instant('messages.cantRemoveCostAccountWithScheduleOn')
        });
        setTimeout(() => this.cardPropertiesCostAccount.initialStateToggle = true, 0);
      } else {
        if (toggleOn) {
          this.loadDefaultPropertiesCostAccount();
        } else {
          this.modelCostProperties = [];
        }
        setTimeout(() => this.checkProperties(), 150);
      }
    });
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
    const propertiesClone: IWorkpackModelProperty[] = JSON.parse(JSON.stringify([ ...this.modelProperties, ...this.modelCostProperties ]));
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
    });
    const { name: modelName, nameInPlural: modelNameInPlural, icon, sortedBy: sortBy } = this.formProperties.value;
    const form: IWorkpackModel = {
      childWorkpackModelSessionActive: !!this.cardPropertiesModels?.initialStateToggle,
      scheduleSessionActive: !!this.cardPropertiesSchedule?.initialStateToggle,
      stakeholderSessionActive: !!this.cardPropertiesStakeholders?.initialStateToggle,
      costSessionActive: !!this.cardPropertiesCostAccount?.initialStateToggle,
      fontIcon: icon,
      type: this.workpackModelType,
      idPlanModel: this.idStrategy,
      modelName,
      modelNameInPlural,
      sortBy,
      organizationRoles: this.posibleRolesOrg,
      personRoles: this.posibleRolesPerson,
      properties: propertiesClone
    };
    const isPut = !!this.idWorkpackModel;
    const { success, data } = isPut
      ? await this.workpackModelSrv.put({
          ... { id: this.idWorkpackModel },
          ... form,
          ... this.idParentWorkpack ? { idParent: this.idParentWorkpack } : {}
        })
      : await this.workpackModelSrv.post({
          ... form,
          ... this.idParentWorkpack ? { idParent: this.idParentWorkpack } : {}
        });
    if (success) {
      if (!isPut) {
        this.idWorkpackModel = data.id;
        this.loadCardItemsModels();
        this.router.navigate([], {
          queryParams: {
            type: this.workpackModelType,
            idStrategy: this.idStrategy,
            idOffice: this.idOffice,
            id: this.idWorkpackModel,
            ... this.idParentWorkpack ? { idParent: this.idParentWorkpack} : {}
          }
        });
      }
      this.refreshPropertiesLists();
      this.breadcrumbSrv.updateLastCrumb({
        key: 'model',
        info: this.formProperties.controls.name.value,
        routerLink: [ '/workpack-model' ],
        queryParams: {
          idStrategy: this.idStrategy,
          id: this.idWorkpackModel,
          type: this.workpackModelType,
          idOffice: this.idOffice
        }
      });
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
    }
  }

  async loadCardItemsModels() {
    const { success , data: hasParentProject } = await this.workpackModelSrv.hasParentProject(this.idWorkpackModel || 0);
    if (!success) {
      this.messageSrv.add({
        severity: 'error',
        detail: this.translateSrv.instant('messages.error.couldNotCheckParentProject')
      });
    }
    const itemsModels: ICardItem[] = this.editPermission
      ? [{
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        iconMenuItems: Object.keys(TypeWorkpackModelEnum)
          .filter(type => ![ 'DeliverableModel', 'MilestoneModel' ].includes(type)
            || hasParentProject)
          .map(type => {
            const item = {
              label: this.translateSrv.instant(`labels.${TypeWorkpackModelEnum[type]}`),
              command: () => this.navigateToWorkpackModel(TypeWorkpackModelEnum[type]),
              icon: IconsTypeWorkpackModelEnum[type]
            };
            return item;
        }),
        paramsUrlCard: [{ name: 'idStrategy', value: this.idStrategy }]
      }]
      : [];
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
          { name: 'idOffice', value: this.idOffice }
        ]
      })));
    }
    this.cardItemsModels = itemsModels;
  }

  navigateToWorkpackModel(type: string){
    this.router.navigate([], {
      queryParams: {
        type,
        idStrategy: this.idStrategy,
        idOffice: this.idOffice,
        idParent: this.idWorkpackModel
      }
    });
  }

  async deleteWorkpackModel(workpackModel: IWorkpackModel){
    const { success } = await this.workpackModelSrv.delete(workpackModel, { field: 'modelName' });
    if (success) {
      this.childrenModels = Array.from(this.childrenModels.filter(c => c.id !== workpackModel.id));
      this.cardItemsModels = Array.from(this.cardItemsModels.filter(m => m.itemId !== workpackModel.id));
    };
  }

  scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async refreshPropertiesLists() {
    const { data, success } = await this.workpackModelSrv.GetById(this.idWorkpackModel);
    if (success) {
      if (data.properties) {
        const dataPropertiesAndIndex = (await Promise.all(data.properties
          .map(async(p, i) => {
            if (p.possibleValues) {
              p.possibleValues = (p.possibleValues as string).split(',');
            };
            if (p.defaultValue && p.multipleSelection) {
              p.defaultValue = (p.defaultValue as string).split(',');
            };
            if (p.idDomain) {
              p.extraList = await this.getListLocalities(p.idDomain);
            }
            if (p.defaults) {
              const isArray = p.defaults instanceof Array;
              if (!p.multipleSelection && isArray) {
                p.defaults = (p.defaults as any[]).shift();
              }
            }
            await this.checkProperty(p);
            return [ p, i ];
          }))
        );
        const dataProperties = dataPropertiesAndIndex
          .sort((a, b) => a[1] > b[1] ? 1 : -1 )
          .map(prop => prop[0] as IWorkpackModelProperty);
        this.modelProperties = dataProperties.filter(p => !p.session || p.session === PropertySessionEnum.PROPERTIES);
        this.modelCostProperties = dataProperties.filter(p => p.session === PropertySessionEnum.COST);
      }
    };
  }
}
