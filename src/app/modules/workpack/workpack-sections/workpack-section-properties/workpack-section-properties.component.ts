import { SaveButtonService } from '../../../../shared/services/save-button.service';
import { IWorkpackData, IWorkpackParams } from '../../../../shared/interfaces/IWorkpackDataParams';
import { takeUntil } from 'rxjs/operators';
import { ResponsiveService } from '../../../../shared/services/responsive.service';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { MeasureUnitService } from '../../../../shared/services/measure-unit.service';
import { ILocalityList } from '../../../../shared/interfaces/ILocality';
import { IDomain } from '../../../../shared/interfaces/IDomain';
import { OrganizationService } from '../../../../shared/services/organization.service';
import { LocalityService } from '../../../../shared/services/locality.service';
import { DomainService } from '../../../../shared/services/domain.service';
import { TranslateService } from '@ngx-translate/core';
import { TypePropertyModelEnum } from '../../../../shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from '../../../../shared/models/PropertyTemplateModel';
import { IWorkpackProperty } from '../../../../shared/interfaces/IWorkpackProperty';
import { IWorkpackModelProperty } from '../../../../shared/interfaces/IWorkpackModelProperty';
import { Subject } from 'rxjs';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MessageService, SelectItem, TreeNode } from 'primeng/api';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';
import { TypeWorkpackEnum } from 'src/app/shared/enums/TypeWorkpackEnum';
import * as moment from 'moment';

@Component({
  selector: 'app-workpack-section-properties',
  templateUrl: './workpack-section-properties.component.html',
  styleUrls: ['./workpack-section-properties.component.scss']
})
export class WorkpackSectionPropertiesComponent implements OnInit {

  @Output() onGetProperties = new EventEmitter();
  sectionPropertiesProperties: PropertyTemplateModel[];
  typePropertyModel = TypePropertyModelEnum;
  cardWorkpackProperties: ICard;
  responsive: boolean;
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  $destroy = new Subject();
  showTabview = false;
  isLoading = false;
  organizationsOffice;

  constructor(
    private workpackSrv: WorkpackService,
    private domainSrv: DomainService,
    private localitySrv: LocalityService,
    private translateSrv: TranslateService,
    private organizationSrv: OrganizationService,
    private unitMeasureSrv: MeasureUnitService,
    private saveButtonSrv: SaveButtonService,
    private responsiveSrv: ResponsiveService,
    private configDataViewSrv: ConfigDataViewService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService,
    private messageSrv: MessageService
  ) {
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
    });
    this.workpackSrv.observableResetWorkpack.pipe(takeUntil(this.$destroy)).subscribe(reset => {
      if (reset) {
        this.workpackData = this.workpackSrv.getWorkpackData();
        this.loadProperties();
      }
    });
    this.workpackSrv.observableReloadProperties.pipe(takeUntil(this.$destroy)).subscribe(reload => {
      if (reload) {
        this.workpackData = this.workpackSrv.getWorkpackData();
        this.reloadProperties();
      }
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(responsive => this.responsive = responsive);
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.cardWorkpackProperties = Object.assign({}, {
        ...this.cardWorkpackProperties,
        initialStateCollapse: this.showTabview ? false : collapsePanelStatus === 'collapse' ? true : false
      });
    });
    this.saveButtonSrv.observableSaveButtonClicked.pipe(takeUntil(this.$destroy)).subscribe(clicked => {
      if (clicked) {
        this.onGetProperties.next({ properties: this.sectionPropertiesProperties });
      }
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

  public getSectionPropertiesData() {
    return this.sectionPropertiesProperties;
  }

  async loadProperties() {
    this.isLoading = true;
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    await this.loadOrganizationsOffice(this.workpackParams.idOfficeOwnerWorkpackLinked ? this.workpackParams.idOfficeOwnerWorkpackLinked : this.workpackParams.idOffice);
    this.loadCardWorkpackProperties();
    const workpackModelActivesProperties = (!!this.workpackParams.idWorkpackModelLinked && !!this.workpackParams.idWorkpack) ?
      this.workpackData.workpack.model?.properties?.filter(w => w.active && w.session === 'PROPERTIES') :
      this.workpackData.workpackModel?.properties?.filter(w => w.active && w.session === 'PROPERTIES');
    this.sectionPropertiesProperties = await Promise.all(workpackModelActivesProperties.map(p => this.instanceProperty(p)));
    this.showCheckCompleted();
  }

  async reloadProperties() {
    const workpackModelActivesProperties = (!!this.workpackParams.idWorkpackModelLinked && !!this.workpackParams.idWorkpack) ?
      this.workpackData.workpack.model?.properties?.filter(w => w.active && w.session === 'PROPERTIES') :
      this.workpackData.workpackModel?.properties?.filter(w => w.active && w.session === 'PROPERTIES');
    this.sectionPropertiesProperties = await Promise.all(workpackModelActivesProperties.map(p => this.instanceProperty(p)));
  }

  loadCardWorkpackProperties() {
    this.cardWorkpackProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: this.showTabview ? '' : 'properties',
      collapseble: this.showTabview ? false : true,
      initialStateCollapse: this.workpackParams.idWorkpack && !this.showTabview ? true : false
    };
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
    property.session = propertyModel.session;
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
    property.min = Number(propertyModel.min);
    property.max = Number(propertyModel.max);
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
      const listOptions = propertyModel.possibleValues ? (propertyModel.possibleValues as string).split(',') : [];
      property.possibleValues = listOptions.map(op => ({ label: op, value: op }));
    }

    if ((this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.DateModel ||
      propertyModel.name === 'name') && this.workpackData.workpack && this.workpackData.workpack.type === TypeWorkpackEnum.MilestoneModel) {
      const milestoneData = {
        baselineDate: this.workpackData.workpack.baselineDate,
        milestoneStatus: this.workpackData.workpack.milestoneStatus,
        delayInDays: this.workpackData.workpack.delayInDays,
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
        property.labelButtonLocalitySelected = await Promise.all(defaultSelectedLocalities.map( async ( loc ) => {
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
      property.groupedProperties = await Promise.all(propertyModel.groupedProperties.map
        (prop => this.instanceProperty(prop, propertyWorkpack)));
    }
    return property;
  }

  mirrorToFullName(nameProperty: PropertyTemplateModel, fullNameProperty: PropertyTemplateModel) {
    const fullNameIndex = this.sectionPropertiesProperties.findIndex((p) => (p.name === 'fullName'));
    if (isNaN(this.workpackParams.idWorkpack) && fullNameProperty && fullNameIndex >= 0 && !fullNameProperty.dirty) {
      this.sectionPropertiesProperties[fullNameIndex].value = nameProperty.value;
    }
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
        this.organizationsOffice = result.data.map(org => ({
          label: org.name,
          value: org.id
        }));
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
      }));
    }
  }

  showCheckCompleted() {
    this.cardWorkpackProperties = {
      ...this.cardWorkpackProperties,
      workpackCompleted: this.workpackData.workpack && this.workpackData.workpack.completed,
      workpackType: this.workpackData.workpack && this.workpackData.workpack.type,
      workpackCanceled: this.workpackData.workpack && this.workpackData.workpack.canceled,
      showCheckCompleted: !!this.workpackData.workpack,
      canEditCheckCompleted: (this.workpackSrv.getEditPermission() && this.workpackData.workpack && this.workpackData.workpack.id
        && !this.workpackData.workpack.hasScheduleSectionActive
        && !this.workpackData.workpack.canceled
        && (!this.workpackData.workpack.endManagementDate)) ? true : false,
    }
    this.isLoading = false;
  }

  async handleChangeCheckCompleted(event) {
    if (this.workpackData.workpack.type === TypeWorkpackEnum.MilestoneModel) {
      const dateProperty = this.sectionPropertiesProperties.find( p => p.type === TypePropertyModelEnum.DateModel);
      if (dateProperty) {
        const today = moment();
        const date = dateProperty.value ? dateProperty.value as Date : undefined;
        if (date && moment(date).isAfter(today)) {
          this.messageSrv.add({
            detail: this.translateSrv.instant('messages.error.date.is.in.future'),
            severity: 'warn',
            life: 10000
          });
          this.cardWorkpackProperties.workpackCompleted = false;
          return;
        }
      }
    }
    this.workpackSrv.nextCheckCompletedChanged(event);
    this.saveButtonSrv.nextShowSaveButton(true);
  }

  checkProperties(property: PropertyTemplateModel) {
    let arePropertiesRequiredValid: boolean = this.checkPropertiesRequiredValid(property);
    let arePropertiesStringValid: boolean = this.checkPropertiesStringValid(property);
    const arePropertiesReasonValid: boolean = !property?.needReason || (property?.needReason && !!property?.reason?.trim());
    const arePropertiesNumberValid: boolean = this.checkPropertiesNumberValid(property);
    if (property.name == 'name') {
      const fullName = this.sectionPropertiesProperties.find((p) => (p.name === 'fullName'));
      if (fullName) {
        this.mirrorToFullName(property, fullName);
        arePropertiesRequiredValid = this.checkPropertiesRequiredValid(fullName);
        arePropertiesStringValid = this.checkPropertiesStringValid(fullName);
      }
    }
    if (property.name == 'fullName') {
      property.dirty = true;
    }

    return (arePropertiesRequiredValid && arePropertiesStringValid && arePropertiesNumberValid && arePropertiesReasonValid) ?
      this.saveButtonSrv.nextShowSaveButton(true) : this.saveButtonSrv.nextShowSaveButton(false);
  }

  checkPropertiesRequiredValid(property: PropertyTemplateModel, groupedProperties?: PropertyTemplateModel[]) {
    const properties = !groupedProperties ? this.sectionPropertiesProperties : groupedProperties;
    const validated = properties
      .filter(propReq => !!propReq.required || (propReq.type === 'Group' && propReq.groupedProperties
        .filter(gp => !!gp.required).length > 0))
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
        valid = prop.min ? String(prop.value).length >= Number(prop.min) : true;
        if (property.idPropertyModel === prop.idPropertyModel) {
          prop.invalid = !valid;
          prop.message = !valid ? prop.message = this.translateSrv.instant('minLenght') : '';
        }
        if (valid) {
          valid = prop.max ? (!prop.required ? String(prop.value).length <= Number(prop.max)
            : String(prop.value).length <= Number(prop.max) && String(prop.value).length > 0) : true;
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
        valid = prop.min ? Number(prop.value) >= Number(prop.min) : true;
        if (property.idPropertyModel === prop.idPropertyModel) {
          prop.invalid = !valid;
          prop.message = !valid ? prop.message = this.translateSrv.instant('minValue') : '';
        }
        if (valid) {
          valid = prop.max ? (!prop.required ? Number(prop.value) <= Number(prop.max)
            : Number(prop.value) <= Number(prop.max) && Number(prop.value) > 0) : true;
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

}
