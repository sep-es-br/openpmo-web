import { WorkpackPropertyService } from './../../../../shared/services/workpack-property.service';
import { SaveButtonService } from '../../../../shared/services/save-button.service';
import { IWorkpackData, IWorkpackParams } from '../../../../shared/interfaces/IWorkpackDataParams';
import { takeUntil } from 'rxjs/operators';
import { ResponsiveService } from '../../../../shared/services/responsive.service';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { TranslateService } from '@ngx-translate/core';
import { TypePropertyModelEnum } from '../../../../shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from '../../../../shared/models/PropertyTemplateModel';
import { Subject } from 'rxjs';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
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
  showExpandedCollapseButtons = false;

  constructor(
    private workpackSrv: WorkpackService,
    private translateSrv: TranslateService,
    private saveButtonSrv: SaveButtonService,
    private responsiveSrv: ResponsiveService,
    private configDataViewSrv: ConfigDataViewService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService,
    private messageSrv: MessageService,
    private propertySrv: WorkpackPropertyService
  ) {

    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(responsive => this.responsive = responsive);
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.cardWorkpackProperties = Object.assign({}, {
        ...this.cardWorkpackProperties,
        initialStateCollapse: this.showTabview ? false : collapsePanelStatus === 'collapse'
      });
    });
    this.cardWorkpackProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: this.showTabview ? '' : 'properties',
      collapseble: this.showTabview ? false : true,
      initialStateCollapse: this.workpackParams?.idWorkpack && !this.showTabview ? true : false
    };
    this.saveButtonSrv.observableSaveButtonClicked.pipe(takeUntil(this.$destroy)).subscribe(clicked => {
      if (clicked) {
        this.onGetProperties.next({ properties: this.sectionPropertiesProperties });
      }
    });
    this.propertySrv.observableResetWorkpackProperties.pipe(takeUntil(this.$destroy)).subscribe(reset => {
      if (reset) {
        this.loadProperties();
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
    const {
      properties,
      workpackParams,
      workpackData,
      loading
    } = this.propertySrv.getPropertiesData();
    this.workpackParams = workpackParams;
    this.workpackData = workpackData;
    this.sectionPropertiesProperties = properties;
    if (this.cardWorkpackProperties) {
      this.cardWorkpackProperties.initialStateCollapse = this.workpackParams?.idWorkpack && !this.showTabview;
      this.showExpandedCollapseButtons = this.sectionPropertiesProperties.filter( prop => prop.type === TypePropertyModelEnum.GroupModel).length > 0;
    }
    if (!loading) this.showCheckCompleted();
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
    if (!event && this.workpackData.workpack.type === TypeWorkpackEnum.MilestoneModel) {
      const propertyDateIndex = this.sectionPropertiesProperties.findIndex( prop => prop.type === 'Date');
      if (propertyDateIndex > -1) {
        this.sectionPropertiesProperties[propertyDateIndex].milestoneData.completed = false;
      }
    }
    if (!!event && this.workpackData.workpack.type === TypeWorkpackEnum.MilestoneModel) {
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
              prop.selectedValues = selectedLocality ? [selectedLocality.data] : [];
            }
            if (prop.multipleSelection) {
              const selectedLocality = prop.localitiesSelected && prop.localitiesSelected !== null ? prop.localitiesSelected as TreeNode[] : [];
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

  mirrorToFullName(nameProperty: PropertyTemplateModel, fullNameProperty: PropertyTemplateModel) {
    const fullNameIndex = this.sectionPropertiesProperties.findIndex((p) => (p.name === 'fullName'));
    if (isNaN(this.workpackParams.idWorkpack) && fullNameProperty && fullNameIndex >= 0 && !fullNameProperty.dirty) {
      this.sectionPropertiesProperties[fullNameIndex].value = nameProperty.value;
    }
  }

  handleCollapseAllProperties(event) {
    this.sectionPropertiesProperties.filter( prop => prop.type === TypePropertyModelEnum.GroupModel).forEach( gp => gp.collapsed = event);
  }

}
