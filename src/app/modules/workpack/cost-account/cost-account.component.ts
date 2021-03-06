import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TreeNode } from 'primeng/api';

import { ICard } from 'src/app/shared/interfaces/ICard';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackModelService } from 'src/app/shared/services/workpack-model.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IWorkpack } from 'src/app/shared/interfaces/IWorkpack';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { IWorkpackModel } from 'src/app/shared/interfaces/IWorkpackModel';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { IWorkpackProperty } from 'src/app/shared/interfaces/IWorkpackProperty';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { CostAccountService } from 'src/app/shared/services/cost-account.service';
import { ICostAccount } from 'src/app/shared/interfaces/ICostAccount';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { DomainService } from 'src/app/shared/services/domain.service';
import { OrganizationService } from 'src/app/shared/services/organization.service';
import { ILocalityList } from 'src/app/shared/interfaces/ILocality';
import { LocalityService } from 'src/app/shared/services/locality.service';
import { PlanService } from 'src/app/shared/services/plan.service';
import { MeasureUnitService } from 'src/app/shared/services/measure-unit.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-cost-account',
  templateUrl: './cost-account.component.html',
  styleUrls: ['./cost-account.component.scss']
})
export class CostAccountComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  responsive: boolean;
  idWorkpack: number;
  idCurrentWorkpack: number;
  workpackModel: IWorkpackModel;
  workpack: IWorkpack;
  idCostAccount: number;
  costAccount: ICostAccount;
  costAccountName: string;
  cardCostAccountProperties: ICard;
  sectionCostAccountProperties: PropertyTemplateModel[];
  costAccountProperties: IWorkpackProperty[];
  typePropertyModel = TypePropertyModelEnum;
  idOffice: number;
  editPermission = false;

  constructor(
    private actRouter: ActivatedRoute,
    private authSrv: AuthService,
    private workpackModelSrv: WorkpackModelService,
    private workpackSrv: WorkpackService,
    private responsiveSrv: ResponsiveService,
    private costAccountSrv: CostAccountService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private domainSrv: DomainService,
    private organizationSrv: OrganizationService,
    private localitySrv: LocalityService,
    private planSrv: PlanService,
    private unitMeasureSrv: MeasureUnitService,
    private router: Router
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idCostAccount = queryParams.id;
      this.idWorkpack = queryParams.idWorkpack;
    });
    this.responsiveSrv.observable.subscribe(value => this.responsive = value);
  }

  async ngOnInit() {
    await this.loadProperties();
  }

  async loadProperties() {
    if (this.idWorkpack && !this.idCostAccount) {
      await this.loadWorkpack();
      this.loadCardCostAccountProperties();
    }
    if (this.idCostAccount) {
      await this.loadWorkpack(true);
      await this.loadCostAccount();
    }
    const workpackModelActivesProperties = this.workpackModel.properties.filter(w => w.active && w.session === 'COST');
    this.sectionCostAccountProperties = await Promise.all(workpackModelActivesProperties.map(p => this.instanceProperty(p)));
  }

  async loadCardCostAccountProperties() {
    if( this.costAccount ){
      const costAccountTotalValues =
        await this.costAccountSrv.GetCostsByWorkpack({id: this.costAccount.id, 'id-workpack': this.costAccount.idWorkpack});
      if (costAccountTotalValues.success) {
        this.cardCostAccountProperties = {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: 'properties',
          collapseble: true,
          initialStateCollapse: false,
          progressBarValues: [{
            total: costAccountTotalValues.data.planed,
            progress: costAccountTotalValues.data.atual,
            labelProgress: this.translateSrv.instant('actual'),
            labelTotal: this.translateSrv.instant('planned'),
            color: '#44B39B',
            valueUnit: 'currency'
          }]
        };
        return;
      }
    }
    this.cardCostAccountProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false
    };
  }

  async loadWorkpack(onlyBreadcrumb: boolean = false) {
    const result = await this.workpackSrv.GetById(this.idWorkpack);
    if (result.success) {
      const isWorkpackLoaded = !!this.workpack;
      this.workpack = result.data;
      if (!isWorkpackLoaded) {
        this.setBreadcrumb();
        if (onlyBreadcrumb) {
          this.idCurrentWorkpack = this.workpack.id;
          return;
        }
      }
      this.editPermission = !!this.workpack.permissions?.find( p => p.level === 'EDIT')
        || await this.authSrv.isUserAdmin();
      const plan = await this.planSrv.GetById(this.workpack.plan.id);
      this.planSrv.nextIDPlan(plan.data.id);
      if (plan.success) {
        this.idOffice = plan.data.idOffice;
      }
    }
    await this.loadWorkpackModel(this.workpack.model.id);
  }

  async loadWorkpackModel(idWorkpackModel) {
    const result = await this.workpackModelSrv.GetById(idWorkpackModel);
    if (result.success) {
      this.workpackModel = result.data;
    }
  }

  async loadCostAccount() {
    const result = await this.costAccountSrv.GetById(this.idCostAccount);
    if (result.success) {
      this.costAccount = result.data;
      this.idWorkpack = this.costAccount.idWorkpack;
      await this.loadWorkpack();
      const propertyNameWorkpackModel = this.workpack.model.properties.find(p => p.name === 'name' && p.session === 'COST');
      const propertyNameCostAccount = this.costAccount.properties.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
      this.costAccountName = propertyNameCostAccount.value as string;
      await this.loadCardCostAccountProperties();
    }
  }

  async setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      ... await this.getBreadcrumbs(),
      {
        key: 'account',
        info: this.costAccountName,
        routerLink: [ '/cost-account' ],
        queryParams: {
          id: this.idCostAccount
        }
      }
    ]);
  }

  async getBreadcrumbs() {
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(this.idCurrentWorkpack || this.idWorkpack);
    return success
      ? data.map(p => ({
            key: !p.modelName ? p.type.toLowerCase() : p.modelName,
            info: p.name,
            tooltip: p.fullName,
            routerLink: this.getRouterLinkFromType(p.type),
            queryParams: { id: p.id },
            modelName: p.modelName
          }))
      : [];
  }

  getRouterLinkFromType(type: string): string[] {
    switch (type) {
      case 'office':
        return [ '/offices', 'office' ];
      case 'plan':
        return [ 'plan' ];
      default:
        return [ '/workpack' ];
    }
  }

  instanceProperty(propertyModel: IWorkpackModelProperty): PropertyTemplateModel {
    const property = new PropertyTemplateModel();
    const propertyCostAccount = this.costAccount && this.costAccount.properties.find( cost => cost.idPropertyModel === propertyModel.id);

    property.id = propertyCostAccount && propertyCostAccount.id;
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
    property.rows = propertyModel.rows;
    property.decimals = propertyModel.decimals;
    property.value = propertyCostAccount?.value ? propertyCostAccount?.value : propertyModel.defaultValue;
    property.defaultValue = propertyCostAccount?.value ? propertyCostAccount?.value : propertyModel.defaultValue;
    property.min = propertyModel.min;
    property.max = propertyModel.max;
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.DateModel) {
      const dateValue = propertyCostAccount?.value ?
        propertyCostAccount?.value.toLocaleString() : propertyModel.defaultValue.toLocaleString();
      property.value = new Date(dateValue);
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.SelectionModel && propertyModel.multipleSelection) {
      const listValues = propertyCostAccount?.value ?  propertyCostAccount?.value as string : propertyModel.defaultValue as string;
      property.defaultValue = listValues.split(',');
      property.value = listValues.split(',');
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.SelectionModel) {
      const listOptions = (propertyModel.possibleValues as string).split(',');
      property.possibleValues = listOptions.map(op => ({ label: op, value: op }));
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.LocalitySelectionModel) {
      this.loadDomain(propertyModel.idDomain).then((domain) => {
        this.loadDomainLocalities(domain.id).then((localityList) => {
          property.localityList = [{
            label: domain.name,
            data: domain.id,
            children: this.loadLocality(localityList)
          }];
          const defaultSelectedLocalities = propertyCostAccount?.selectedValues  ?
            propertyCostAccount?.selectedValues as number[] : propertyModel.defaults as number[];
          if (defaultSelectedLocalities?.length > 0) {
            const selectedLocalityList = defaultSelectedLocalities.map( selectedId => this.loadSelectedLocality( selectedId, localityList));
            const selectedTreeNodeList = selectedLocalityList.map( l => this.loadSelectedTreeNode(l));
            property.localitiesSelected = propertyModel.multipleSelection ? selectedTreeNodeList : selectedTreeNodeList[0];
          }
        });
      });
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.OrganizationSelectionModel) {
      this.loadOrganizationsOffice().then( organizationsOffice => {
        property.possibleValuesIds = organizationsOffice;
      });
      if (propertyModel.multipleSelection) {
        property.selectedValues = propertyCostAccount?.selectedValues ?
          propertyCostAccount?.selectedValues : propertyModel.defaults as number[];
      }
      if (!propertyModel.multipleSelection) {
        const defaults = propertyModel.defaults && propertyModel.defaults as number[];
        const defaultsValue = defaults && defaults[0];
        property.selectedValues = propertyCostAccount?.selectedValues ?
          propertyCostAccount?.selectedValues[0] : (defaultsValue && defaultsValue);
      }
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.UnitSelectionModel) {
      this.loadUnitMeasuresOffice().then( unitMeasures => {
        property.possibleValuesIds = unitMeasures;
      });
      property.selectedValue = propertyCostAccount?.selectedValue ? propertyCostAccount?.selectedValue : propertyModel.defaults as number;
      property.defaults = propertyModel.defaults as number;
    }
    return property;
  }

  async loadDomain(idDomain: number) {
    const result = await this.domainSrv.GetById(idDomain);
    if (result.success) {
      return result.data;
    }
    return null;
  }

  loadLocality(localityList: ILocalityList[]) {
    const list = localityList.map(locality => {
      if (locality.children) {
        return {
          label: locality.name,
          data: locality.id,
          children: this.loadLocality(locality.children)
        };
      }
      return { label: locality.name, data: locality.id };
    });
    return list;
  }

  async loadDomainLocalities(idDomain: number) {
    const result = await this.localitySrv.getLocalitiesTreeFromDomain({'id-domain': idDomain});
    if (result) {
      return result as ILocalityList[];
    }
  }

  loadSelectedLocality(selectedId: number, localityList: ILocalityList[]): ILocalityList {
    if (localityList) {
      const locality = localityList.find(l => l.id === selectedId);
      if (locality) {
        return locality;
      }
      let i = 0;
      while (!locality || i < localityList.length) {
        if (localityList[i].children) {
          return this.loadSelectedLocality(selectedId, localityList[i].children);
        }
        i++;
      }
    }
  }

  loadSelectedTreeNode(locality: ILocalityList) {
    if (locality.children) {
      return {
        label: locality.name,
        data: locality.id,
        children: locality.children.map( c => this.loadSelectedTreeNode(c))
      };
    }
    return {
      label: locality.name,
      data: locality.id
    };
  }

  async loadOrganizationsOffice() {
    const result = await this.organizationSrv.GetAll({ 'id-office': this.idOffice });
    if (result.success ) {
      const organizationsOffice = result.data;
      return organizationsOffice.map(org => ({
        label: org.name,
        value: org.id
      }));
    }
  }

  async loadUnitMeasuresOffice() {
    const result = await this.unitMeasureSrv.GetAll({idOffice: this.idOffice});
    if (result.success) {
      const units = result.data;
      return units.map(org => ({
        label: org.name,
        value: org.id
      }));
    }
  }

  checkProperties(property: PropertyTemplateModel) {
    const arePropertiesRequiredValid: boolean = this.sectionCostAccountProperties
      .filter(({ required }) => required)
      .map(( prop ) => {
        let valid = (prop.value instanceof Array
          ? (prop.value.length > 0 )
          : typeof prop.value == 'boolean' || typeof prop.value == 'number'
            || !!prop.value || (prop.value !== null && prop.value !== undefined));
        if (['OrganizationSelection','UnitSelection', 'LocalitySelection'].includes(prop.type)) {
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
          valid = ( typeof prop.selectedValue === 'number' || ( prop.selectedValues instanceof Array ?
            prop.selectedValues.length > 0 : typeof prop.selectedValues == 'number'));
        }
        if (property.idPropertyModel === prop.idPropertyModel) {
          prop.invalid = !valid;
          prop.message = valid ? '' : this.translateSrv.instant('required');
        }
        return valid;
      })
      .reduce((a, b) => a ? b : a, true);

    const arePropertiesStringValid: boolean = this.sectionCostAccountProperties
      .filter(({min, max, value}) => ( (min || max) && typeof value == 'string'))
      .map(( prop ) => {
        let valid = true;
        valid = prop.min ? String(prop.value).length >= prop.min : true;
        if (property.idPropertyModel === prop.idPropertyModel) {
          prop.invalid = !valid;
          prop.message = !valid ? prop.message = this.translateSrv.instant('minLenght') : '';
        }
        if (valid) {
          valid = prop.max ? ( !prop.required ? String(prop.value).length <= prop.max
          : String(prop.value).length <= prop.max && String(prop.value).length > 0) : true;
          if (property.idPropertyModel === prop.idPropertyModel) {
            prop.invalid = !valid;
            prop.message = !valid ? ( String(prop.value).length > 0 ? prop.message = this.translateSrv.instant('maxLenght')
              : prop.message = this.translateSrv.instant('required')) : '';
          }
        }
        return valid;
      })
      .reduce((a, b) => a ? b : a, true);
    return ( arePropertiesRequiredValid && arePropertiesStringValid ) ? this.saveButton?.showButton() : this.saveButton?.hideButton();
  }

  async saveCostAccount() {
    this.costAccountProperties = this.sectionCostAccountProperties.map(p => p.getValues());
    if (this.sectionCostAccountProperties.filter( p => p.invalid).length > 0) {
      return;
    }
    if (this.idCostAccount) {
      const costAccount = {
        id: this.idCostAccount,
        idWorkpack: this.costAccount.idWorkpack,
        properties: this.costAccountProperties,
      };
      const result = await this.costAccountSrv.put(costAccount);
      if (result.success) {
        this.router.navigate([ '/workpack' ],
          {
            queryParams: {
              id: this.idCurrentWorkpack || this.idWorkpack
            }
          }
        );
      }
    }
    if (!this.idCostAccount) {
      const costAccount = {
        idWorkpack: this.idWorkpack,
        properties: this.costAccountProperties,
      };
      const result = await this.costAccountSrv.post(costAccount);
      if (result.success) {
        this.router.navigate([ '/workpack' ],
          {
            queryParams: {
              id: this.idWorkpack
            }
          }
        );
      }
    }
  }
}
