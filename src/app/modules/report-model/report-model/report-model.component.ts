import { Component, OnInit, ViewChild } from '@angular/core';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { ReportModelService } from 'src/app/shared/services/report-model.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ConfirmationService, MenuItem, MessageService, SelectItem, TreeNode } from 'primeng/api';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { OfficeService } from 'src/app/shared/services/office.service';
import { PlanModelService } from 'src/app/shared/services/plan-model.service';
import { IPlanModel } from 'src/app/shared/interfaces/IPlanModel';
import { IReportModel, IReportModelFile } from 'src/app/shared/interfaces/IReportModel';
import { ReportPreferredFormatEnum } from 'src/app/shared/enums/ReportPreferredFormatEnum';
import { LocalityService } from 'src/app/shared/services/locality.service';
import { TypePropertyModelEnum as TypePropertyEnum } from 'src/app/shared/enums/TypePropertModelEnum';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { ILocalityList } from 'src/app/shared/interfaces/ILocality';
import { IconPropertyWorkpackModelEnum } from 'src/app/shared/enums/IconPropertyWorkpackModelEnum';
import { DomainService } from 'src/app/shared/services/domain.service';
import { OrganizationService } from 'src/app/shared/services/organization.service';
import { MeasureUnitService } from 'src/app/shared/services/measure-unit.service';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReportModelFileService } from 'src/app/shared/services/report-model-file.service';
import { MinLengthTextCustomValidator } from 'src/app/shared/utils/minLengthTextValidator';
import { TypeOrganization } from 'src/app/shared/enums/TypeOrganization';
import { IOrganization } from 'src/app/shared/interfaces/IOrganization';

@Component({
  selector: 'app-report-model',
  templateUrl: './report-model.component.html',
  styleUrls: ['./report-model.component.scss']
})
export class ReportModelComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'properties',
    collapseble: true
  };
  cardParameters: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'parameters',
    collapseble: true
  };
  cardFiles: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'jrxmlSourceFiles',
    collapseble: true
  }
  cardItemsFiles: ICardItem[] = [];
  propertiesOffice: IOffice;
  propertiesStrategy: IPlanModel;
  idStrategy: number;
  idOffice: number;
  responsive = false;
  formReport: FormGroup;
  idReport: number;
  $destroy = new Subject();
  editPermission: boolean;
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  isUserAdmin = false;
  report: IReportModel;
  preferredFormatOptions: SelectItem[];
  modelProperties: IWorkpackModelProperty[] = [];
  menuModelProperties: MenuItem[] = [];
  currentLang: string;
  listDomains: SelectItem[] = [];
  listOrganizations: IOrganization[] = [];
  listMeasureUnits: SelectItem[] = [];
  files: IReportModelFile[] = [];
  hasCompiledFiles = false;
  formIsSaving = false;

  constructor(
    private formBuilder: FormBuilder,
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private responsiveSvr: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private configDataViewSrv: ConfigDataViewService,
    private reportModelSrv: ReportModelService,
    private officePermissionSrv: OfficePermissionService,
    private authSrv: AuthService,
    private officeSrv: OfficeService,
    private planModelSvr: PlanModelService,
    private localitySrv: LocalityService,
    private confirmationSrv: ConfirmationService,
    private domainSrv: DomainService,
    private organizationSrv: OrganizationService,
    private measureUnitSrv: MeasureUnitService,
    private sanatizer: DomSanitizer,
    private reportModelFileSrv: ReportModelFileService
  ) {
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
    });
    this.setLanguage();
    this.setPreferredFormatOptions();
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.cardProperties = Object.assign({}, {
        ...this.cardProperties,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.cardParameters = Object.assign({}, {
        ...this.cardParameters,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.cardFiles = Object.assign({}, {
        ...this.cardFiles,
        initialStateCollapse: this.collapsePanelsStatus
      });
    });
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
    this.formReport = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25), MinLengthTextCustomValidator.minLengthText]],
      fullName: '',
      preferredOutputFormat: 'PDF'
    });
    this.formReport.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formReport.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formReport.dirty))
      .subscribe(() => {this.saveButton.showButton()});
    this.translateSrv.onLangChange
      .pipe(takeUntil(this.$destroy)).subscribe(({ lang }) => {
        this.currentLang = lang;
        setTimeout(() => {
          this.loadMenuProperty();
        }, 250);
      });
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.activeRoute.queryParams.subscribe(async ({ idStrategy, id, idOffice }) => {
      this.idStrategy = +idStrategy;
      this.idReport = +id;
      this.idOffice = +idOffice;
      this.cardFiles.isLoading = true;
      await this.checkPermissions();
      if (this.idReport) {
        this.cardProperties.isLoading = true;
        this.cardParameters.isLoading = true;
        this.loadReport();
      } else {
        this.loadCardItemsFiles();
      }
      this.cardProperties.initialStateCollapse = this.idReport ? true : false;
    });
    
  }

  ngOnInit(): void {
    this.setBreadCrumb();
    this.loadMenuProperty();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.currentLang = this.translateSrv.currentLang;
  }

  setPreferredFormatOptions() {
    this.preferredFormatOptions = Object.keys(ReportPreferredFormatEnum).map(key => {
      return {
        label: key,
        value: key
      };
    });
  }

  async checkPermissions() {
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    if (!this.isUserAdmin && !this.editPermission) {
      this.router.navigate(['/offices']);
    }
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
        key: 'reportModel',
        info: this.report?.name,
        tooltip: this.report?.fullName,
        routerLink: [],
      }
    ]);
  }

  async loadReport(dontSetFormReport = false) {
    this.cardParameters.isLoading = true;
    const result = await this.reportModelSrv.GetById(this.idReport);
    if (result.success) {
      this.cardProperties.isLoading = false;
      this.report = result.data;
      if (!dontSetFormReport) this.setFormReportValues();
      if (this.report.paramModels) {
        this.loadPropertiesParams();
      } else {
        this.cardParameters.isLoading = false;
      }
      this.cardFiles.isLoading = true;
      if (this.report && this.report.files) {
        this.files = this.report.files;
        this.hasCompiledFiles = this.files.filter(file => !file.compiled).length === 0;
      }
      this.loadCardItemsFiles();
    }
  }

  loadCardItemsFiles() {
    this.cardFiles.isLoading = true;
    this.cardItemsFiles = [];
    this.cardItemsFiles = this.files.map(file => {
      const menuItems = !!file.id ? [
        {
          label: this.translateSrv.instant('download'),
          icon: 'app-icon arrowDown',
          command: () => this.handleDownloadFile(file.id),
          disabled: !this.editPermission
        },
        {
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: () => this.handleDeleteFile(file.id),
          disabled: !this.isUserAdmin
        }
      ] : [];
      if (!file.main && !!file.id) {
        menuItems.unshift({
          label: this.translateSrv.instant('setAsMain'),
          icon: 'app-icon main',
          command: () => this.handleSetAsMain(file.id),
          disabled: !this.isUserAdmin
        });
      }
      return {
        typeCardItem: 'listItem',
        iconSvg: true,
        icon: IconsEnum.Jrxml,
        nameCardItem: file.userGivenName,
        fullNameCardItem: file.userGivenName,
        itemId: file.id,
        main: file.main,
        menuItems
      }
    });

    if (this.isUserAdmin) {
      this.cardItemsFiles.push({
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.ArrowUp,
      });
    }
    setTimeout(() => {
      this.cardFiles.isLoading = false;
    }, 300)
  }

  async handleSetAsMain(idFile) {
    const result = await this.reportModelFileSrv.setAsMain(idFile, this.idReport);
    if (result.success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.setAsMainSuccessfully')
      });
      this.files.forEach(file => {
        if (file.id === idFile) {
          file.main = true;
        } else {
          file.main = false;
        }
      });
      this.cardItemsFiles.forEach(card => {
        if (card.itemId === idFile) {
          card.main = true;
        } else {
          card.main = false;
        }
      })
    }
  }

  async handleDownloadFile(idFile) {
    const file = this.files.find( f => f.id === idFile);
    const result = await this.reportModelFileSrv.downloadFile(idFile, {
      'id-report-model': this.idReport
    });
    if (result.body) {
      const blob = result.body.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.userGivenName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    }
  }

  async handleDeleteFile(idFile) {
    const deletedFile = this.files.find(file => file.id === idFile);
    const result = await this.reportModelFileSrv.delete(deletedFile, {
      field: 'userGivenName'
    });
    if (result.success) {
      this.files = this.files.filter(file => file.id !== deletedFile.id);
      this.cardItemsFiles = this.cardItemsFiles.filter(file => file.itemId !== deletedFile.id);
      this.hasCompiledFiles = this.files.filter(file => file.compiled).length > 0;
    }
  }

  setFormReportValues() {
    this.formReport.controls.name.setValue(this.report.name);
    this.formReport.controls.fullName.setValue(this.report.fullName);
    this.formReport.controls.preferredOutputFormat.setValue(this.report.preferredOutputFormat);
    if (!this.isUserAdmin) {
      this.formReport.disable();
    }
  }

  async loadPropertiesParams() {
    const properties = this.report.paramModels;
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
    this.cardParameters.isLoading = false;
  }

  checkProperties() {
    const properties: IWorkpackModelProperty[] = [...this.modelProperties];
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
    property.viewOnly = !this.isUserAdmin;
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
    return this.listOrganizations.filter( org => sectors.includes(org.sector)).map(d => ({ label: d.name, value: d.id }));
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
        event.property.sectors = event.property?.sectorsList.map( sec => sec.toLowerCase()).join(',');
        event.property.list = await this.getListOrganizations(event.property.sectorsList);
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
      [TypeOrganization.Private.toUpperCase(), TypeOrganization.Public.toUpperCase(), TypeOrganization.Third.toUpperCase()] : [],
      selectedLocalities: type === TypePropertyEnum.LocalitySelectionModel && this.translateSrv.instant('selectDefaultValue'),
      showIconButtonSelectLocality: type === TypePropertyEnum.LocalitySelectionModel
    };
    newProperty.isCollapsed = false;
    await this.checkProperty(newProperty);
    this.saveButton?.hideButton();
    return this.modelProperties.push(newProperty);
  }

  handleUploadSourceFiles(files) {
    files.map(file => {
      const url = file.objectURL || this.createObjectUrl(file);
      this.files.push({
        url,
        mimeType: file.type,
        userGivenName: file.name,
        main: false,
        compiled: false
      });
    });
    if (this.formReport.valid) {
      this.saveButton.showButton();
      this.checkProperties();
    }
    this.loadCardItemsFiles();
  }

  createObjectUrl(file: File): SafeResourceUrl {
    return this.sanatizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
  }

  async handleOnSubmit() {
    this.formIsSaving = true;
    if (this.files && this.files.length > 0) {
      await this.sendUploadedFiles();
    } else {
      await this.saveReport();
    }
  }

  async saveReport() {
    const sender: IReportModel = {
      idPlanModel: this.idStrategy,
      id: this.idReport,
      name: this.formReport.controls.name.value,
      fullName: this.formReport.controls.fullName.value,
      preferredOutputFormat: this.formReport.controls.preferredOutputFormat.value,
      active: this.idReport ? this.report.active : false
    };
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
    sender.paramModels = [...propertiesClone];
    sender.files = [...this.files];
    if (sender.files && sender.files.length > 0 && sender.files.filter( file => !!file.main).length === 0) {
      sender.files[0].main = true;
    }
    const result = this.idReport ? await this.reportModelSrv.put(sender) : await this.reportModelSrv.post(sender);
    this.formIsSaving = false;
    if (result.success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.idReport = !this.idReport ? result.data.id : this.idReport;
      this.loadReport(true);
    }
  }

  async sendUploadedFiles() {
    const sendedFiles = this.files.filter(file => !!file.uniqueNameKey);
    const sendFiles = this.files.filter(file => !file.uniqueNameKey);
    this.files = [
      ...sendedFiles,
      ...await Promise.all(
        sendFiles.map(async (fileUploaded) => {
          const file = await fetch(fileUploaded.url.changingThisBreaksApplicationSecurity);
          const formData: FormData = new FormData();
          const blob = await file.blob();
          formData.append('file', blob, fileUploaded.userGivenName);
          const result = await this.reportModelFileSrv.sendSourceFile(formData);
          delete fileUploaded.url;
          if (result.success) {
            return {
              ...fileUploaded,
              ...result.data
            };
          }
        })
      )
    ]
    await this.saveReport();
  }

  async handleCompileModel() {
    try {
      this.formIsSaving = true;
      const result = await this.reportModelSrv.compileModel(this.idReport);
      this.formIsSaving = false;
      if (result.success) {
        this.hasCompiledFiles = true;
        this.files.forEach(file => file.compiled = true);
        this.report.active = true;
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.compiledSuccessfully')
        });
      }
    } catch (error) {
      this.hasCompiledFiles = false;
      this.report.active = false;
      this.files.forEach(file => file.compiled = false);
    }
  }

  showButtonCompile() {
    return this.idReport && this.report && this.files && this.files.length > 0 && this.files.filter(file => !file.id).length === 0
  }

  async changedActiveStatus(event) {
    const active = event.checked;
    this.formIsSaving = true;
    const result = await this.reportModelSrv.activeModel(this.idReport, active);
    this.formIsSaving = false;
    if (result.success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: active ? this.translateSrv.instant('messages.activedSuccessfully') : this.translateSrv.instant('messages.inactivedSuccessfully')
      });
    }
  }

}
