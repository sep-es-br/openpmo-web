import { takeUntil } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
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
import { SelectItem, TreeNode } from 'primeng/api';
import { ILocalityList } from 'src/app/shared/interfaces/ILocality';
import { OrganizationService } from 'src/app/shared/services/organization.service';
import { DomainService } from 'src/app/shared/services/domain.service';
import { LocalityService } from 'src/app/shared/services/locality.service';
import { TranslateService } from '@ngx-translate/core';
import { MeasureUnitService } from 'src/app/shared/services/measure-unit.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IDomain } from 'src/app/shared/interfaces/IDomain';
import { ReportService } from 'src/app/shared/services/report.service';
import { IReportScope, ITreeViewScope } from 'src/app/shared/interfaces/IReportScope';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ReportPreferredFormatEnum } from 'src/app/shared/enums/ReportPreferredFormatEnum';
import { IReportGenerate } from 'src/app/shared/interfaces/IReportGenerate';

@Component({
  selector: 'app-report-view',
  templateUrl: './report-view.component.html',
  styleUrls: ['./report-view.component.scss']
})
export class ReportViewComponent implements OnInit {

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
  formatOptions: SelectItem[];
  isGenerating = false;

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
    private reportSrv: ReportService
  ) {
    this.setPreferredFormatOptions();
    const plan = localStorage.getItem('@currentPlan');
    this.idPlan = plan ? Number(plan) : undefined;
    this.loadPropertiesOffice();
    this.activeRoute.queryParams.subscribe(async ({ idStrategy, id, idOffice }) => {
      this.idReportModel = +id;
      if (this.idReportModel) {
        this.loadReportModel();
        this.loadScope();
      }
    });
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  ngOnInit(): void {
    this.setBreadcrumb();

  }
  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setPreferredFormatOptions() {
    this.formatOptions = Object.keys(ReportPreferredFormatEnum).map(key => {
      return {
        label: key,
        value: key
      };
    });
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
    if (result.success) {
      this.isLoading = false;
      this.reportModel = result.data;
      this.reportFormat = this.reportModel.preferredOutputFormat;
      this.loadCardProperties();
      this.instancePropertiesModel();
      this.loadScope();
    }
  }

  async loadScope() {
    const result = await this.reportSrv.getScopeReport({'id-plan': this.idPlan});
    if (result.success) {
      const scopeData = result.data;
      this.reportScope = [
        {
          label: scopeData.name,
          icon: IconsEnum.Plan,
          data: scopeData.idPlan,
          children: this.loadTreeNodeScope(scopeData.children),
          parent: undefined,
          selectable: true,
          type: 'plan',
          expanded: true
        }
      ];
      this.reportViewProperties.isLoading = false;
    }
  }

  loadTreeNodeScope(children: ITreeViewScope[], parent?: TreeNode): TreeNode[] {
    if (!children) {
      return [];
    }
    return children.map(workpack => {
      if (workpack.children) {
        const node = {
          label: workpack.name,
          icon: workpack.icon,
          data: workpack.id,
          children: undefined,
          parent,
          selectable: workpack.hasPermission,
          type: 'workpack',
          expanded: true
        };
        node.children = this.loadTreeNodeScope(workpack.children, node);
        return node;
      }
      return {
        label: workpack.name,
        data: workpack.id,
        children: undefined,
        parent,
        icon: workpack.icon,
        selectable: workpack.hasPermission
      };
    });
  }

  async instancePropertiesModel() {
    await this.loadOrganizationsOffice();
    this.reportProperties = await Promise.all(this.reportModel.paramModels.map(p => this.instanceProperty(p)));
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
    property.session = propertyModel.session;
    property.sortIndex = propertyModel.sortIndex;
    property.multipleSelection = propertyModel.multipleSelection;
    property.rows = propertyModel.rows ? propertyModel.rows : 1;
    property.decimals = propertyModel.decimals;
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
      const listOptions = propertyModel.possibleValues ? (propertyModel.possibleValues as string).split(',') : [];
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
        property.labelButtonLocalitySelected = await Promise.all(defaultSelectedLocalities.map(async (loc) => {
          const result = await this.localitySrv.GetById(loc);
          if (result.success) {
            return result.data.name
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
      property.possibleValuesIds = this.organizationsOffice;
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
    list.sort((a, b) => a.label < b.label ? -1 : 0)
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
      this.organizationsOffice = result.data.map(org => ({
        label: org.name,
        value: org.id
      }));
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
      }));
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
          info: 'reporting',
          tooltip: 'reporting'
        },
        {
          key: 'generateReport',
          routerLink: ['/reports', 'report-view'],
          queryParams: { id: this.idReportModel },
          info: 'generateReport',
          tooltip: 'generateReport'
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
    this.isGenerating = true;
    const reportParams = this.reportProperties.map(p => p.getValues());
    const sender: IReportGenerate = {
      idReportModel: this.idReportModel,
      params: reportParams,
      scope: this.selectedWorkpacks.map(node => node.data),
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

}
