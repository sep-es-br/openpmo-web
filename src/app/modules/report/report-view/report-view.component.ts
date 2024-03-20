import { takeUntil } from 'rxjs/operators';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IReportModel } from 'src/app/shared/interfaces/IReportModel';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ReportModelService } from 'src/app/shared/services/report-model.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ActivatedRoute } from '@angular/router';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { IWorkpackProperty } from 'src/app/shared/interfaces/IWorkpackProperty';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { MenuItem, MessageService, SelectItem, TreeNode } from 'primeng/api';
import { ILocalityList } from 'src/app/shared/interfaces/ILocality';
import { OrganizationService } from 'src/app/shared/services/organization.service';
import { DomainService } from 'src/app/shared/services/domain.service';
import { LocalityService } from 'src/app/shared/services/locality.service';
import { TranslateService } from '@ngx-translate/core';
import { MeasureUnitService } from 'src/app/shared/services/measure-unit.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IDomain } from 'src/app/shared/interfaces/IDomain';
import { ReportService } from 'src/app/shared/services/report.service';
import { ITreeViewScope } from 'src/app/shared/interfaces/IReportScope';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ReportPreferredFormatEnum } from 'src/app/shared/enums/ReportPreferredFormatEnum';
import { IReportGenerate } from 'src/app/shared/interfaces/IReportGenerate';
import { MenuService } from 'src/app/shared/services/menu.service';
import { IMenuWorkpack } from 'src/app/shared/interfaces/IMenu';

@Component({
  selector: 'app-report-view',
  templateUrl: './report-view.component.html',
  styleUrls: ['./report-view.component.scss']
})
export class ReportViewComponent implements OnInit, OnDestroy {

  reportViewProperties: ICard;
  $destroy = new Subject();
  responsive = false;
  reportModel: IReportModel;
  idReportModel: number;
  idPlan: number;
  isLoading = false;
  reportProperties: PropertyTemplateModel[];
  typePropertyModel = TypePropertyModelEnum;
  organizationsOffice;
  propertiesOffice: IOffice;
  reportScope: TreeNode[];
  selectedWorkpacks: TreeNode[] = [];
  reportFormat: string;
  formatOptions: MenuItem[];
  isGenerating = false;
  generateReportEnabled = false;
  scope = [];

  constructor(
    private responsiveSvr: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private reportModelSrv: ReportModelService,
    private activeRoute: ActivatedRoute,
    private domainSrv: DomainService,
    private localitySrv: LocalityService,
    private translateSrv: TranslateService,
    private organizationSrv: OrganizationService,
    private unitMeasureSrv: MeasureUnitService,
    private reportSrv: ReportService,
    private messageSrv: MessageService,
    private menuSrv: MenuService
  ) {
    this.setPreferredFormatOptions();
    const plan = localStorage.getItem('@currentPlan');
    this.idPlan = plan ? Number(plan) : undefined;
    this.loadPropertiesOffice();
    this.activeRoute.queryParams.subscribe(async({ id }) => {
      this.idReportModel = +id;
      this.loadReportModel();
    });
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.menuSrv.obsMenuPortfolioItems.pipe(takeUntil(this.$destroy)).subscribe(menuItems => {
      if (menuItems && menuItems.length > 0 ) {this.loadScope(menuItems);}
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setPreferredFormatOptions() {
    this.formatOptions = Object.keys(ReportPreferredFormatEnum).map(key => ({
      label: key,
      command: (event) => this.biddingReport(event)
    }));
    this.formatOptions[0].styleClass = 'selected-format';
  }

  biddingReport(event: any) {
    this.formatOptions.forEach(item => item.styleClass = '');
    this.formatOptions[this.formatOptions.findIndex(item => item.label === event.item.label)].styleClass = 'selected-format';
    this.reportFormat = event.item.label;
  }

  async loadPropertiesOffice() {
    const office = localStorage.getItem('@pmo/propertiesCurrentOffice');
    if (office) {
      this.propertiesOffice = JSON.parse(office);
    }
  }

  async loadReportModel() {
    this.isLoading = true;
    const result = await this.reportModelSrv.GetById(this.idReportModel);
    this.isLoading = false;
    if (result.success) {
      this.reportModel = result.data;
      this.reportFormat = this.reportModel.preferredOutputFormat;
      this.loadCardProperties();
      this.instancePropertiesModel();
      this.checkProperties();
      this.setBreadcrumb();
    }
  }

  async loadScope(menuItems: IMenuWorkpack[]) {
    if (this.reportViewProperties) {this.reportViewProperties.isLoading = true;}
    const planStorage = localStorage.getItem('@pmo/propertiesCurrentPlan');
    const planProperties = JSON.parse(planStorage);
    const scopeData = menuItems;
    const rootNode = {
      label: planProperties && planProperties.name,
      icon: IconsEnum.Plan,
      data: planProperties && planProperties.id,
      children: this.loadTreeNodeScope(scopeData),
      parent: undefined,
      type: 'plan',
      expanded: true,
    };
    this.reportScope = [
      rootNode
    ];
    this.selectedWorkpacks.push(rootNode);
    if (this.reportViewProperties) {this.reportViewProperties.isLoading = false;}
    this.checkProperties();
  }

  loadTreeNodeScope(children: IMenuWorkpack[], parent?: TreeNode): TreeNode[] {
    if (!children) {
      return [];
    }
    return children.map((workpack) => {
      if (workpack.children) {
        const node = {
          label: workpack.name,
          icon: workpack.fontIcon,
          data: workpack.id,
          children: undefined,
          parent,
          type: 'workpack',
          expanded: false,
        };
        this.selectedWorkpacks.push(node);
        node.children = this.loadTreeNodeScope(workpack.children, node);
        return node;
      }
      return {
        label: workpack.name,
        data: workpack.id,
        children: undefined,
        parent,
        icon: workpack.fontIcon,
      };
    });
  }

  async instancePropertiesModel() {
    if (this.reportModel.paramModels && this.reportModel.paramModels
      .filter(prop => this.typePropertyModel[prop.type] === TypePropertyModelEnum.OrganizationSelectionModel).length > 0) {
      await this.loadOrganizationsOffice();
    }
    this.reportProperties = await Promise.all(this.reportModel.paramModels.map(p => this.instanceProperty(p)));
    this.reportViewProperties.isLoading = false;
  }

  async instanceProperty(propertyModel: IWorkpackModelProperty, group?: IWorkpackProperty): Promise<PropertyTemplateModel> {
    const property = new PropertyTemplateModel();
    property.idPropertyModel = propertyModel.id;
    property.type = TypePropertyModelEnum[propertyModel.type];
    property.active = propertyModel.active;
    property.fullLine = propertyModel.fullLine;
    property.label = propertyModel.label;
    property.name = propertyModel.name;
    property.required = propertyModel.required;
    property.sortIndex = propertyModel.sortIndex;
    property.multipleSelection = propertyModel.multipleSelection;
    property.rows = propertyModel.rows ? propertyModel.rows : 1;
    property.decimals = propertyModel.decimals;
    property.helpText = propertyModel.helpText;
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.ToggleModel) {
      property.value = propertyModel.defaultValue;
    } else {
      property.value = propertyModel.defaultValue;
    }
    property.defaultValue = propertyModel.defaultValue;
    property.min = propertyModel.min && propertyModel.min !== null ? Number(propertyModel.min) : propertyModel.min;
    property.max = propertyModel.max && propertyModel.max !== null ? Number(propertyModel.max) : propertyModel.max;
    property.precision = propertyModel.precision;
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.DateModel) {
      const dateValue = propertyModel.defaultValue && propertyModel.defaultValue.toLocaleString();
      property.value = dateValue ? new Date(dateValue) : null;
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.SelectionModel && propertyModel.multipleSelection) {
      const listValues = propertyModel.defaultValue as string;
      property.defaultValue = listValues.length > 0 ? listValues.split(',') : null;
      property.value = listValues.length > 0 ? listValues.split(',') : null;
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.SelectionModel) {
      const listOptions = propertyModel.possibleValues ?
        (propertyModel.possibleValues as string).split(',').sort((a, b) => a.localeCompare(b)) : [];
      property.possibleValues = listOptions.map(op => ({ label: op, value: op }));
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.LocalitySelectionModel) {
      const domain = await this.loadDomain(propertyModel.idDomain);
      const localityList = await this.loadDomainLocalities(domain.id);
      const rootNode: TreeNode = {
        label: domain.localityRoot.name,
        data: domain.localityRoot.id,
        children: this.loadLocality(localityList[0].children, property.multipleSelection),
      };
      property.idDomain = propertyModel.idDomain;
      property.localityList = [rootNode];
      const defaultSelectedLocalities = (propertyModel.defaults ? propertyModel.defaults as number[] : undefined);
      if (defaultSelectedLocalities?.length > 0) {
        const selectedLocalityList = this.loadSelectedLocality(defaultSelectedLocalities, property.localityList);
        property.localitiesSelected = propertyModel.multipleSelection
          ? selectedLocalityList as TreeNode[]
          : selectedLocalityList[0] as TreeNode;
      }
      if (defaultSelectedLocalities && defaultSelectedLocalities.length === 1) {
        const resultLocality = await this.localitySrv.GetById(defaultSelectedLocalities[0]);
        if (resultLocality.success) {
          property.labelButtonLocalitySelected = [resultLocality.data.name];
          property.showIconButton = false;
        }
      }
      if (defaultSelectedLocalities && defaultSelectedLocalities.length > 1) {
        property.labelButtonLocalitySelected = await Promise.all(defaultSelectedLocalities.map(async(loc) => {
          const result = await this.localitySrv.GetById(loc);
          if (result.success) {
            return result.data.name;
          }
        }));
        property.showIconButton = false;
      }
      if (!defaultSelectedLocalities || (defaultSelectedLocalities && defaultSelectedLocalities.length === 0)) {
        property.labelButtonLocalitySelected = [];
        property.showIconButton = true;
      }
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.OrganizationSelectionModel) {
      property.possibleValuesIds = this.organizationsOffice
        .filter(org => propertyModel.sectors && propertyModel.sectors.includes(org.sector.toLowerCase()))
        .map(d => ({ label: d.name, value: d.id }));
      if (propertyModel.multipleSelection) {
        property.selectedValues = propertyModel.defaults as number[];
      }
      if (!propertyModel.multipleSelection) {
        const defaults = propertyModel.defaults && propertyModel.defaults as number[];
        const defaultsValue = defaults && defaults[0];
        property.selectedValues = defaultsValue && defaultsValue;
      }
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.UnitSelectionModel) {
      property.possibleValuesIds = await this.loadUnitMeasuresOffice(this.propertiesOffice.id);
      property.selectedValue = propertyModel.defaults as number;
      property.defaults = propertyModel.defaults as number;
    }
    return property;
  }

  loadSelectedLocality(seletectedIds: number[], list: TreeNode[]) {
    let result = [];
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

  loadLocality(localityList: ILocalityList[], multipleSelection: boolean) {
    const list: TreeNode[] = localityList?.map(locality => {
      if (locality.children) {
        return {
          label: locality.name,
          data: locality.id,
          children: this.loadLocality(locality.children, multipleSelection),
        };
      }
      return { label: locality.name, data: locality.id };
    });
    list.sort((a, b) => a.label.localeCompare(b.label));
    if (multipleSelection) {
      this.addSelectAllNode(list, localityList, true);
    }
    return list;
  }

  addSelectAllNode(list: TreeNode[], localityList: ILocalityList[], selectable: boolean) {
    list?.unshift({
      label: this.translateSrv.instant('selectAll'),
      key: 'SELECTALL' + localityList[0]?.id,
      selectable,
      styleClass: 'green-node',
      data: 'SELECTALL' + localityList[0]?.id
    });
  }

  async loadDomainLocalities(idDomain: number) {
    const result = await this.localitySrv.getLocalitiesTreeFromDomain({ 'id-domain': idDomain });
    if (result) {
      return result as ILocalityList[];
    }
  }

  async loadOrganizationsOffice() {
    const result = await this.organizationSrv.GetAll({ 'id-office': this.propertiesOffice.id });
    if (result.success) {
      this.organizationsOffice = result.data;
      this.organizationsOffice = this.organizationsOffice.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  async loadUnitMeasuresOffice(idOffice) {
    if (!idOffice) {
      return [];
    }
    const result = await this.unitMeasureSrv.GetAll({ idOffice });
    if (result.success) {
      const units = result.data;
      return units.map(org => ({
        label: org.name,
        value: org.id
      })).sort((a, b) => a.label.localeCompare(b.label));
    }
  }

  setBreadcrumb() {
    const storedOffice = localStorage.getItem('@pmo/propertiesCurrentOffice');
    const propertiesOffice = storedOffice ? JSON.parse(storedOffice) : undefined;
    const storedPlan = localStorage.getItem('@pmo/propertiesCurrentPlan');
    const propertiesPlan = storedPlan ? JSON.parse(storedPlan) : undefined;
    if (propertiesOffice && propertiesPlan) {
      this.breadcrumbSrv.setMenu([
        {
          key: 'office',
          routerLink: ['/offices', 'office'],
          queryParams: { id: propertiesOffice.id },
          info: propertiesOffice?.name,
          tooltip: propertiesOffice?.fullName
        },
        {
          key: 'plan',
          routerLink: ['/plan'],
          queryParams: { id: propertiesPlan.id },
          info: propertiesPlan.name,
          tooltip: propertiesPlan.fullName
        },
        {
          key: 'action',
          routerLink: ['/reports'],
          queryParams: { idPlan: propertiesPlan.id },
          info: 'reports',
          tooltip: this.translateSrv.instant('reports')
        },
        {
          key: 'generateReport',
          routerLink: ['/reports', 'report-view'],
          queryParams: { id: this.idReportModel },
          info: this.reportModel.name,
          tooltip: this.reportModel.fullName,
        },
      ]);
    }
  }

  loadCardProperties() {
    this.reportViewProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: this.reportModel.fullName,
      collapseble: false,
      isLoading: true,
      initialStateCollapse: false,
    };
  }

  async handleGenerateReport() {
    if (!this.generateReportEnabled) {
      this.messageSrv.add({
        detail: this.translateSrv.instant('messages.validateGenerateReport'),
        severity: 'warn',
        summary: this.translateSrv.instant('atention')
      });
      return;
    }
    this.prepareScope();
    this.isGenerating = true;
    const reportParams = this.reportProperties.map(p => p.getValues());
    const sender: IReportGenerate = {
      idReportModel: this.idReportModel,
      idPlan: this.idPlan,
      params: reportParams,
      scope: this.scope,
      format: this.reportFormat
    };
    const result = await this.reportSrv.generateReport(sender);
    if (result.body) {
      const contentDispositionTotal = result.headers.get('Content-Disposition');
      const contentDisposition = contentDispositionTotal && contentDispositionTotal.split('=');
      const filename = contentDisposition && contentDisposition.length ? contentDisposition[1] : this.reportModel.name;
      const blob = result.body.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      this.isGenerating = false;
    }
  }

  prepareScope() {
    this.scope = [...this.selectedWorkpacks];
    const scopeSelected = [...this.scope];
    scopeSelected.forEach(item => {
      if (item.children) {
        const children = item.children.map(child => child.data);
        this.scope = this.scope.filter(itemScope => !children.includes(itemScope.data));
      }
    });
    this.scope = this.scope.map(item => item.data);
  }

  checkProperties(property?: PropertyTemplateModel) {
    if (!this.reportProperties || this.reportProperties.length === 0) {
      this.generateReportEnabled = this.selectedWorkpacks && this.selectedWorkpacks.length > 0;
      return;
    }
    const arePropertiesRequiredValid: boolean = this.checkPropertiesRequiredValid(property);
    const arePropertiesStringValid: boolean = this.checkPropertiesStringValid(property);
    const arePropertiesNumberValid: boolean = this.checkPropertiesNumberValid(property);
    this.generateReportEnabled = arePropertiesRequiredValid && arePropertiesStringValid && arePropertiesNumberValid
      && this.selectedWorkpacks && this.selectedWorkpacks.length > 0;
  }

  checkPropertiesRequiredValid(property?: PropertyTemplateModel) {
    const properties = this.reportProperties;
    const validated = properties
      .filter(propReq => !!propReq.required)
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
        if (property && property.idPropertyModel === prop.idPropertyModel) {
          prop.invalid = !valid;
          prop.message = valid ? '' : this.translateSrv.instant('required');
        }
        return valid;
      })
      .reduce((a, b) => a ? b : a, true);
    return validated;
  }

  checkPropertiesStringValid(property?: PropertyTemplateModel) {
    const properties = this.reportProperties;
    return properties
      .filter(p => ((p.min || p.max) && (typeof p.value == 'string' && p.type !== 'Num')))
      .map((prop) => {
        let valid = true;
        valid = prop.min ? String(prop.value).length >= Number(prop.min) : true;
        if (property && property.idPropertyModel === prop.idPropertyModel) {
          prop.invalid = !valid;
          prop.message = !valid ? prop.message = this.translateSrv.instant('minLenght') : '';
        }
        if (valid) {
          valid = prop.max ? (!prop.required ? String(prop.value).length <= Number(prop.max)
            : String(prop.value).length <= Number(prop.max) && String(prop.value).length > 0) : true;
          if (property && property.idPropertyModel === prop.idPropertyModel) {
            prop.invalid = !valid;
            prop.message = !valid ? (String(prop.value).length > 0 ? prop.message = this.translateSrv.instant('maxLenght')
              : prop.message = this.translateSrv.instant('required')) : '';
          }
        }
        return valid;
      })
      .reduce((a, b) => a ? b : a, true);
  }

  checkPropertiesNumberValid(property?: PropertyTemplateModel) {
    const properties = this.reportProperties;
    return properties
      .filter(p => ((p.min || p.max) && (p.type === 'Num')))
      .map((prop) => {
        let valid = true;
        valid = prop.min ? Number(prop.value) >= Number(prop.min) : true;
        if (property && property.idPropertyModel === prop.idPropertyModel) {
          prop.invalid = !valid;
          prop.message = !valid ? prop.message = this.translateSrv.instant('minValue') : '';
        }
        if (valid) {
          valid = prop.max ? (!prop.required ? Number(prop.value) <= Number(prop.max)
            : Number(prop.value) <= Number(prop.max) && Number(prop.value) > 0) : true;
          if (property && property.idPropertyModel === prop.idPropertyModel) {
            prop.invalid = !valid;
            prop.message = !valid ? (Number(prop.value) > 0 ? prop.message = this.translateSrv.instant('maxValue')
              : prop.message = this.translateSrv.instant('required')) : '';
          }
        }
        return valid;
      })
      .reduce((a, b) => a ? b : a, true);
  }

}
