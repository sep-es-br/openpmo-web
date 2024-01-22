import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { Inject, Injectable, Injector } from '@angular/core';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { BehaviorSubject } from 'rxjs';
import { TypePropertyModelEnum } from '../enums/TypePropertyModelEnum';
import { DomainService } from './domain.service';
import { LocalityService } from './locality.service';
import { OrganizationService } from './organization.service';
import { MeasureUnitService } from './measure-unit.service';
import { IWorkpackModelProperty } from '../interfaces/IWorkpackModelProperty';
import { IWorkpackProperty } from '../interfaces/IWorkpackProperty';
import { PropertyTemplateModel } from '../models/PropertyTemplateModel';
import { TypeWorkpackEnum } from '../enums/TypeWorkpackEnum';
import { TreeNode } from 'primeng/api';
import { IDomain } from '../interfaces/IDomain';
import { ILocalityList } from '../interfaces/ILocality';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class WorkpackPropertyService {

  private resetWorkpackProperties = new BehaviorSubject<boolean>(false);
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  typePropertyModel = TypePropertyModelEnum;
  properties;
  organizations;
  domain;
  loading;

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService,
    private domainSrv: DomainService,
    private localitySrv: LocalityService,
    private organizationSrv: OrganizationService,
    private unitMeasureSrv: MeasureUnitService,
    private translateSrv: TranslateService
  ) {
  }

  resetPropertiesData() {
    this.properties = [];
    this.loading = true;
    this.nextResetWorkpackProperties(true);
  }

  async loadProperties() {
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    const workpackModelActivesProperties = (!!this.workpackParams.idWorkpackModelLinked && !!this.workpackParams.idWorkpack) ?
      this.workpackData.workpack.model?.properties?.filter(w => w.active) :
      this.workpackData.workpackModel?.properties?.filter(w => w.active);
    if (workpackModelActivesProperties && workpackModelActivesProperties
      .filter(prop => this.typePropertyModel[prop.type] === TypePropertyModelEnum.OrganizationSelectionModel).length > 0) {
      await this.loadOrganizationsOffice(this.workpackParams.idOfficeOwnerWorkpackLinked ? this.workpackParams.idOfficeOwnerWorkpackLinked : this.workpackParams.idOffice);
    }
    this.properties = workpackModelActivesProperties ? await Promise.all(workpackModelActivesProperties.filter(prop => prop.session !== 'COST').map(p => this.instanceProperty(p))) : undefined;
    this.loading = false;
    this.nextResetWorkpackProperties(true);
  }

  getPropertiesData() {
    return {
      workpackData: this.workpackData,
      workpackParams: this.workpackParams,
      properties: this.properties,
      loading: this.loading
    }
  }

  nextResetWorkpackProperties(nextValue: boolean) {
    this.resetWorkpackProperties.next(nextValue);
  }

  get observableResetWorkpackProperties() {
    return this.resetWorkpackProperties.asObservable();
  }

  async instanceProperty(propertyModel: IWorkpackModelProperty, group?: IWorkpackProperty): Promise<PropertyTemplateModel> {
    const property = new PropertyTemplateModel();
    const propertyWorkpack = !group ? this.workpackData.workpack && this.workpackData.workpack.properties.find(wp => wp.idPropertyModel === propertyModel.id) :
      group.groupedProperties.find(gp => gp.idPropertyModel === propertyModel.id);

    property.id = propertyWorkpack && propertyWorkpack.id;
    property.idPropertyModel = propertyModel.id;
    property.type = TypePropertyModelEnum[propertyModel.type];
    property.active = propertyModel.active;
    property.fullLine = propertyModel.fullLine;
    property.label = propertyModel.label;
    property.name = propertyModel.name;
    property.required = propertyModel.required;
    property.disabled = !this.workpackSrv.getEditPermission();
    property.sortIndex = propertyModel.sortIndex;
    property.multipleSelection = propertyModel.multipleSelection;
    property.rows = propertyModel.rows ? propertyModel.rows : 1;
    property.decimals = propertyModel.decimals;
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.ToggleModel) {
      property.value = propertyWorkpack && (propertyWorkpack?.value !== null && propertyWorkpack?.value !== undefined) ?
        propertyWorkpack?.value : propertyModel.defaultValue;
    } else {
      property.value = propertyWorkpack?.value ? propertyWorkpack?.value : propertyModel.defaultValue;
    }
    property.defaultValue = propertyWorkpack?.value ? propertyWorkpack?.value : propertyModel.defaultValue;
    property.min = propertyModel.min && propertyModel.min !== null ? Number(propertyModel.min) : propertyModel.min;
    property.max = propertyModel.max && propertyModel.max !== null ? Number(propertyModel.max) : propertyModel.max;
    property.precision = propertyModel.precision;
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.DateModel) {
      const dateValue = propertyWorkpack?.value ? propertyWorkpack?.value.toLocaleString()
        : (propertyModel.defaultValue && propertyModel.defaultValue.toLocaleString());
      property.value = dateValue ? new Date(dateValue) : null;
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.SelectionModel && propertyModel.multipleSelection) {
      const listValues = propertyWorkpack?.value ? propertyWorkpack?.value as string : propertyModel.defaultValue as string;
      property.defaultValue = listValues.length > 0 ? listValues.split(',') : null;
      property.value = listValues.length > 0 ? listValues.split(',') : null;
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.SelectionModel) {
      const listOptions = propertyModel.possibleValues ? (propertyModel.possibleValues as string).split(',').sort((a, b) => a.localeCompare(b)) : [];
      property.possibleValues = listOptions.map(op => ({ label: op, value: op }));
    }

    if ((this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.DateModel ||
      propertyModel.name === 'name') && this.workpackData.workpack && this.workpackData.workpack.type === TypeWorkpackEnum.MilestoneModel) {
      const milestoneData = {
        baselineDate: this.workpackData.workpack.baselineDate,
        milestoneStatus: this.workpackData.workpack.milestoneStatus,
        delayInDays: this.workpackData.workpack.delayInDays,
        completed: this.workpackData.workpack.completed
      };
      property.milestoneData = milestoneData;
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.LocalitySelectionModel) {
      const domain = await this.loadDomain(propertyModel.idDomain);
      const localityList = await this.loadDomainLocalities(domain.id);
      const selectable = (this.workpackSrv.getEditPermission());
      const rootNode: TreeNode = {
        label: domain.localityRoot.name,
        data: domain.localityRoot.id,
        children: this.loadLocality(localityList[0].children, selectable, property.multipleSelection),
        selectable
      };
      property.idDomain = propertyModel.idDomain;
      property.localityList = [rootNode];
      const defaultSelectedLocalities = propertyWorkpack?.selectedValues ?
        propertyWorkpack?.selectedValues as number[] : (propertyModel.defaults ? propertyModel.defaults as number[] : undefined);
      const defaultDetailSelectedLocalities = propertyWorkpack?.selectedValuesDetails ?
        propertyWorkpack?.selectedValuesDetails : (propertyModel.defaultsDetails ? propertyModel.defaultsDetails : undefined);
      if (defaultSelectedLocalities?.length > 0) {
        const selectedLocalityList = this.loadSelectedLocality(defaultSelectedLocalities, property.localityList);
        property.localitiesSelected = propertyModel.multipleSelection
          ? selectedLocalityList as TreeNode[]
          : selectedLocalityList[0] as TreeNode;
      }
      if (defaultSelectedLocalities && defaultSelectedLocalities.length === 1) {
        const resultLocality = defaultDetailSelectedLocalities && defaultDetailSelectedLocalities[0];
        property.labelButtonLocalitySelected = [resultLocality.name];
          property.showIconButton = false;
      }
      if (defaultSelectedLocalities && defaultSelectedLocalities.length > 1) {
        property.labelButtonLocalitySelected = defaultDetailSelectedLocalities && defaultDetailSelectedLocalities.map( det => det.name);
        property.showIconButton = false;
      }
      if (!defaultSelectedLocalities || (defaultSelectedLocalities && defaultSelectedLocalities.length === 0)) {
        property.labelButtonLocalitySelected = [];
        property.showIconButton = true;
      }
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.OrganizationSelectionModel) {
      property.possibleValuesIds = this.organizations
        .filter(org => !propertyModel.sectors || (propertyModel.sectors && propertyModel.sectors.includes(org.sector.toLowerCase())))
        .map(d => ({ label: d.name, value: d.id }));
      (this.workpackParams.idOfficeOwnerWorkpackLinked ? this.workpackParams.idOfficeOwnerWorkpackLinked : this.workpackParams.idOffice);
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
      property.possibleValuesIds = await this.loadUnitMeasuresOffice
        (!!this.workpackParams.idOfficeOwnerWorkpackLinked ? this.workpackParams.idOfficeOwnerWorkpackLinked : this.workpackParams.idOffice);
      property.selectedValue = propertyWorkpack?.selectedValue ? propertyWorkpack?.selectedValue : propertyModel.defaults as number;
      property.defaults = propertyModel.defaults as number;
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.GroupModel && propertyModel.groupedProperties) {
      property.collapsed = true;
      property.groupedProperties = await Promise.all(propertyModel.groupedProperties.map
        (prop => this.instanceProperty(prop, propertyWorkpack)));
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
    list.sort((a, b) => a.label.localeCompare(b.label))
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
      data: 'SELECTALL' + localityList[0]?.id
    });
  }

  async loadDomainLocalities(idDomain: number) {
    const result = await this.localitySrv.getLocalitiesTreeFromDomain({ 'id-domain': idDomain });
    if (result) {
      return result as ILocalityList[];
    }
  }

  async loadOrganizationsOffice(idOffice) {
    if (idOffice) {
      const result = await this.organizationSrv.GetAll({ 'id-office': idOffice });
      if (result.success) {
        this.organizations = result.data;
        this.organizations = this.organizations.sort((a, b) => a.name.localeCompare(b.name))
      }
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

}