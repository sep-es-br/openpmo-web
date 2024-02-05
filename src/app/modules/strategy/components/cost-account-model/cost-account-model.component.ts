import { Component, OnInit, ViewChild } from '@angular/core';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmationService, MenuItem, MessageService, SelectItem, TreeNode } from 'primeng/api';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { OfficeService } from 'src/app/shared/services/office.service';
import { PlanModelService } from 'src/app/shared/services/plan-model.service';
import { IPlanModel } from 'src/app/shared/interfaces/IPlanModel';
import { LocalityService } from 'src/app/shared/services/locality.service';
import { TypePropertModelEnum as TypePropertyEnum } from 'src/app/shared/enums/TypePropertModelEnum';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { ILocalityList } from 'src/app/shared/interfaces/ILocality';
import { IconPropertyWorkpackModelEnum } from 'src/app/shared/enums/IconPropertyWorkpackModelEnum';
import { DomainService } from 'src/app/shared/services/domain.service';
import { OrganizationService } from 'src/app/shared/services/organization.service';
import { MeasureUnitService } from 'src/app/shared/services/measure-unit.service';
import { CostAccountModelService } from 'src/app/shared/services/cost-account-model.service';
import { ICostAccountModel } from 'src/app/shared/interfaces/ICostAccountModel';
import { IOrganization } from 'src/app/shared/interfaces/IOrganization';
import { TypeOrganization } from 'src/app/shared/enums/TypeOrganization';

@Component({
  selector: 'app-cost-account-model',
  templateUrl: './cost-account-model.component.html',
  styleUrls: ['./cost-account-model.component.scss']
})
export class CostAccountModelComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'properties',
    collapseble: false,
    initialStateCollapse: false
  };
  currentLang: string;
  $destroy = new Subject();
  propertiesOffice: IOffice;
  propertiesStrategy: IPlanModel;
  idStrategy: number;
  idOffice: number;
  responsive = false;
  isUserAdmin = false;
  editPermission = false;
  idModel: number;
  costAccountModel: ICostAccountModel;
  modelProperties: IWorkpackModelProperty[] = [];
  menuModelProperties: MenuItem[] = [];
  listDomains: SelectItem[] = [];
  listOrganizations: IOrganization[] = [];
  listMeasureUnits: SelectItem[] = [];
  typeOrganizationEnum = TypeOrganization;

  constructor(
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private officeSrv: OfficeService,
    private planModelSvr: PlanModelService,
    private localitySrv: LocalityService,
    private domainSrv: DomainService,
    private organizationSrv: OrganizationService,
    private measureUnitSrv: MeasureUnitService,
    private officePermissionSrv: OfficePermissionService,
    private authSrv: AuthService,
    private confirmationSrv: ConfirmationService,
    private costAccountModelSrv: CostAccountModelService
  ) {
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
    });
    this.activeRoute.queryParams.subscribe(async ({ idStrategy, id, idOffice }) => {
      this.idStrategy = +idStrategy;
      this.idModel = +id;
      this.idOffice = +idOffice;
      await this.checkPermissions();
      if (this.idModel) {
        this.cardProperties.isLoading = true;
        this.loadModel();
      } else {
        this.loadDefaultPropertiesCostAccount();
      }
    });
    this.setLanguage();
  }

  ngOnInit(): void {
    this.setBreadCrumb();
    this.loadMenuProperty();
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
        fullLine: false,
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
        required: true,
        rows: 3
      },
      {
        active: true,
        label: this.translateSrv.instant('limit'),
        name: 'limit',
        type: TypePropertyEnum.CurrencyModel,
        sortIndex: 2,
        obligatory: true,
        fullLine: false
      },
      {
        active: true,
        label: this.translateSrv.instant('funder'),
        name: 'funder',
        type: TypePropertyEnum.OrganizationSelectionModel,
        sortIndex: 3,
        obligatory: true,
        required: true,
        sectors: [this.typeOrganizationEnum.Private,
          this.typeOrganizationEnum.Public,
          this.typeOrganizationEnum.Third].join(','),
        sectorsList: [this.typeOrganizationEnum.Private.toUpperCase(),
          this.typeOrganizationEnum.Public.toUpperCase(),
          this.typeOrganizationEnum.Third.toUpperCase()],
        multipleSelection: false,
        fullLine: true
      },
      {
        active: true,
        label: this.translateSrv.instant('economicCategory'),
        name: this.translateSrv.instant('economicCategory'),
        type: TypePropertyEnum.SelectionModel,
        sortIndex: 4,
        possibleValuesOptions: Object.values(this.translateSrv.instant(['capitalExpenses', 'currentExpenses'])) as string[],
        defaultValue: this.translateSrv.instant('capitalExpenses'),
        multipleSelection: false,
        fullLine: false
      },
      {
        active: true,
        label: this.translateSrv.instant('source'),
        name: this.translateSrv.instant('source'),
        type: TypePropertyEnum.SelectionModel,
        sortIndex: 5,
        possibleValuesOptions: Object.values(this.translateSrv.instant(['nonBudgetary', 'cashResources',
          'treasuryRelatedResources', 'ownResources'])) as string[],
        multipleSelection: false,
        defaultValue: this.translateSrv.instant('nonBudgetary'),
        fullLine: false
      }
    ];
    modelCostProperties.map(prop => this.checkProperty(prop));
    this.modelProperties = modelCostProperties;
    this.saveButton.showButton();
  }


  setLanguage() {
    this.currentLang = this.translateSrv.currentLang;
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async setBreadCrumb() {
    await this.loadPropertiesOffice();
    await this.loadPropertiesStrategy();
    this.breadcrumbSrv.setMenu([
      {
        key: 'administration',
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName,
        routerLink: ['/configuration-office'],
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'configuration',
        info: 'planModels',
        tooltip: this.translateSrv.instant('planModels'),
        routerLink: ['/strategies'],
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'planModel',
        info: this.propertiesStrategy?.name,
        tooltip: this.propertiesStrategy?.fullName,
        routerLink: ['/strategies', 'strategy'],
        queryParams: { id: this.idStrategy, idOffice: this.idOffice }
      },
      {
        key: 'costAccountModel',
        info: this.translateSrv.instant('model'),
        tooltip: this.translateSrv.instant('costAccountModel'),
        routerLink: [],
      }
    ]);
  }

  async loadPropertiesOffice() {
    this.propertiesOffice = await this.officeSrv.getCurrentOffice(this.idOffice);
  }

  async loadPropertiesStrategy() {
    if (this.idStrategy) {
      const { data, success } = await this.planModelSvr.GetById(this.idStrategy);
      if (success) {
        this.propertiesStrategy = data;
      }
    }
  }

  async checkPermissions() {
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    if (this.isUserAdmin === undefined) {
      this.isUserAdmin = await this.authSrv.isUserAdmin();
      if (!this.editPermission) {
        this.editPermission = this.isUserAdmin;
      }
    }
  }

  async loadModel() {
    const result = await this.costAccountModelSrv.GetById(this.idModel);
    if (result.success) {
      this.costAccountModel = result.data;
      this.loadPropertiesModel();
    }
  }

  async loadPropertiesModel() {
    const properties = this.costAccountModel.properties;
    const dataPropertiesAndIndex = (await Promise.all(properties
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
        if (p.defaults) {
          const isArray = p.defaults instanceof Array;
          if (!p.multipleSelection && isArray) {
            p.defaults = (p.defaults as any[]).shift();
          }
        }
        if (p.sectors) {
          p.sectorsList = p.sectors.split(',').map( sector => sector.toUpperCase());
        }
        if (p.type === TypePropertyEnum.DateModel) {
          const value = p.defaultValue && p.defaultValue.toLocaleString();
          p.defaultValue = value && new Date(value);
        }
        await this.checkProperty(p);
        return [p, i];
      }))
    );
    const dataProperties = dataPropertiesAndIndex
      .sort((a, b) => a[1] > b[1] ? 1 : -1)
      .map(prop => prop[0] as IWorkpackModelProperty);
    this.modelProperties = dataProperties;
    this.cardProperties.isLoading = false;
  }

  checkProperties() {
    const properties: IWorkpackModelProperty[] = [...this.modelProperties];
    // Value check
    const propertiesChecks: { valid: boolean; invalidKeys: string[]; prop: IWorkpackModelProperty }[] = properties.map(p => ({
      valid: p.requiredFields && p.requiredFields
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
    if (!arePropertiesValid) {
      this.saveButton?.hideButton();
      return;
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
    if (showButton) {
      this.saveButton?.showButton();
      return;
    }
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
        list = await this.getListOrganizations(property.sectorsList);
        property.sectors = property.sectorsList.map(sec => sec.toLowerCase()).join(',');
        break;
      case TypePropertyEnum.UnitSelectionModel:
        list = await this.getListMeasureUnits();
        break;
      case TypePropertyEnum.SelectionModel:
        requiredFields = requiredFields.concat(['possibleValuesOptions', 'multipleSelection']);
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
    property.obligatory = !!property.obligatory;
  }

  async deleteProperty(property: IWorkpackModelProperty, group?: IWorkpackModelProperty) {
    this.confirmationSrv.confirm({
      message: `${this.translateSrv.instant('messages.deletePropertyConfirmation')} ${property.label}?`,
      key: 'deleteConfirm',
      acceptLabel: this.translateSrv.instant('yes'),
      rejectLabel: this.translateSrv.instant('no'),
      accept: () => {
        this.modelProperties = this.modelProperties.filter(p => p !== property);
        if (property.id) {
          this.saveButton?.showButton();
        }
      }
    });
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
    return this.listOrganizations.filter( org => sectors && sectors.includes(org.sector)).map(d => ({ label: d.name, value: d.id }));
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

  async propertyChanged(event) {
    if (event?.property && event.property?.idDomain && this.editPermission) {
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
    if (event?.property && event.property?.sectors && this.editPermission) {
      if(!!event.sectorChanged) {
        event.property.list = await this.getListOrganizations(event.property.sectorsList);
        event.property.sectors = event.property?.sectorsList.map( sec => sec.toLowerCase()).join(',');
        event.property.defaults = [];
      }
    }
    this.checkProperties();
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
        icon: IconPropertyWorkpackModelEnum[TypePropertyEnum[type]],
        command: () => this.addProperty(TypePropertyEnum[type])
      }));
    this.menuModelProperties = menu;
  }

  async addProperty(type: TypePropertyEnum) {
    const newProperty: IWorkpackModelProperty = {
      type,
      active: true,
      label: '',
      name: '',
      sortIndex: this.modelProperties.length,
      fullLine: true,
      required: false,
      multipleSelection: false,
      sectorsList: type === TypePropertyEnum.OrganizationSelectionModel ?
      [TypeOrganization.Private.toLocaleUpperCase(), TypeOrganization.Public.toLocaleUpperCase(), TypeOrganization.Third.toLocaleUpperCase()] : [],
      sectors: type === TypePropertyEnum.OrganizationSelectionModel ?
      [TypeOrganization.Private.toLocaleUpperCase(), TypeOrganization.Public.toLocaleUpperCase(), TypeOrganization.Third.toLocaleUpperCase()].join(',') : '',
      selectedLocalities: type === TypePropertyEnum.LocalitySelectionModel && this.translateSrv.instant('selectDefaultValue'),
      showIconButtonSelectLocality: type === TypePropertyEnum.LocalitySelectionModel
    };
    newProperty.isCollapsed = false;
    await this.checkProperty(newProperty);
    this.saveButton?.hideButton();
    return this.modelProperties.push(newProperty);
  }

  async handleOnSubmit() {
    this.modelProperties.forEach(prop => {
      delete prop.extraList;
      delete prop.extraListDefaults;
      prop.possibleValues = prop.possibleValuesOptions && prop.possibleValuesOptions.join(',');
    });
    const propertiesClone: IWorkpackModelProperty[] =
      JSON.parse(JSON.stringify([...this.modelProperties]));
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
    const sender: ICostAccountModel = {
      idPlanModel: this.idStrategy,
      id: this.idModel,
      properties: [...propertiesClone]
    };
    const result = this.idModel ? await this.costAccountModelSrv.put(sender) : await this.costAccountModelSrv.post(sender);
    if (result.success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.idModel = !this.idModel ? result.data.id : this.idModel;
      this.loadModel();
    }
  }


}
