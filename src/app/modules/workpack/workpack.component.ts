import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, MessageService, TreeNode } from 'primeng/api';

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
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
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

interface ISection {
  idWorkpackModel?: number;
  cardSection: ICard;
  cardItemsSection?: ICardItem[];
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
  navigationSubscription;
  responsive: boolean;
  idPlan: number;
  propertiesPlan: IPlan;
  idOffice: number;
  propertiesOffice: IOffice;
  idWorkpackModel: number;
  idWorkpack: number;
  idWorkpackParent: number;
  workpackModel: IWorkpackModel;
  cardWorkpackProperties: ICard;
  workpack: IWorkpack;
  workpackName: string;
  workpackFullName: string;
  sectionPropertiesProperties: PropertyTemplateModel[];
  workpackProperties: IWorkpackProperty[];
  sectionStakeholder: ISection;
  stakeholders: IStakeholder[];
  sectionCostAccount: ISection;
  sectionSchedule: IScheduleSection;
  sectionWorkpackModelChildren: boolean;
  stakeholderSectionShowInactives = false;
  organizationsOffice: IOrganization[];
  unitMeasuresOffice: IMeasureUnit[];
  cardsWorkPackModelChildren: ISection[];
  typePropertyModel = TypePropertyModelEnum;
  costAccounts: ICostAccount[];
  schedule: IScheduleDetail;
  showDetails: boolean;
  isUserAdmin: boolean;
  editPermission = false;
  editPermissionOffice = false;

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
    private menuSrv: MenuService
  ) {
    this.actRouter.queryParams.subscribe(async({ id, idPlan, idWorkpackModel, idWorkpackParent }) => {
      this.idWorkpack = id;
      this.idPlan = idPlan;
      this.idWorkpackModel = idWorkpackModel;
      this.idWorkpackParent = idWorkpackParent;
      this.planSrv.nextIDPlan(this.idPlan);
      await this.resetWorkpack();
    });
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  checkProperties(property: PropertyTemplateModel) {
    const arePropertiesRequiredValid: boolean = this.sectionPropertiesProperties
      .filter(({ required }) => required)
      .map(( prop ) => {
        let valid = (prop.value instanceof Array
          ? (prop.value.length > 0 )
          : typeof prop.value == 'boolean' || typeof prop.value == 'number'
            || !!prop.value || (prop.value !== null && prop.value !== undefined && prop.value !== ''));
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

    const arePropertiesStringValid: boolean = this.sectionPropertiesProperties
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

  async resetWorkpack() {
    this.workpackModel = undefined;
    this.cardWorkpackProperties = undefined;
    this.workpack = undefined;
    this.workpackName = undefined;
    this.workpackFullName = undefined;
    this.sectionPropertiesProperties = [];
    this.workpackProperties = [];
    this.sectionStakeholder = undefined;
    this.stakeholders = undefined;
    this.sectionCostAccount = undefined;
    this.costAccounts = undefined;
    this.sectionSchedule = undefined;
    this.schedule = undefined;
    this.sectionWorkpackModelChildren = undefined;
    this.cardsWorkPackModelChildren = [];
    this.editPermission = false;
    await this.loadProperties();
    await this.setBreadcrumb();
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
          routerLink: [ '/workpack' ],
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
      return [];
    }
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(id);
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

  async loadProperties() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    if (this.isUserAdmin || !this.idWorkpack) {
      this.editPermission = true;
    }
    this.loadCardWorkpackProperties();
    if (this.idWorkpack) {
      await this.loadWorkpack();
    } else {
      await this.loadWorkpackModel(this.idWorkpackModel);
    }
    const workpackModelActivesProperties = this.workpackModel.properties.filter(w => w.active && w.session === 'PROPERTIES');
    this.sectionPropertiesProperties = await Promise.all(workpackModelActivesProperties.map(p => this.instanceProperty(p)));
    if (this.idWorkpack) { await this.loadSectionsWorkpackModel(); }
  }

  loadCardWorkpackProperties() {
    this.cardWorkpackProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false
    };
  }

  async loadWorkpack() {
    const result = await this.workpackSrv.GetById(this.idWorkpack);
    if (result.success) {
      this.workpack = result.data;
      const propertyNameWorkpackModel = this.workpack.model.properties.find(p => p.name === 'name' && p.session === 'PROPERTIES');
      const propertyNameWorkpack = this.workpack.properties.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
      this.workpackName = propertyNameWorkpack.value as string;
      const propertyFullNameWorkpackModel = this.workpack.model.properties.find(p => p.name === 'fullName' && p.session === 'PROPERTIES');
      const propertyFullNameWorkpack = this.workpack.properties.find(p => p.idPropertyModel === propertyFullNameWorkpackModel.id);
      this.workpackFullName = propertyFullNameWorkpack.value as string;
      this.idPlan = this.workpack.plan.id;
      this.planSrv.nextIDPlan(this.idPlan);
      if (!this.isUserAdmin && this.workpack) {
        await this.loadUserPermission();
      }
      await this.loadWorkpackModel(this.workpack.model.id);
    }
  }

  async loadUserPermission() {
    const editPermission = !!this.workpack.permissions?.find( p => p.level === 'EDIT');
    if (!editPermission) {
      this.editPermission = await this.planPermissionSrv.getPermissions(this.idPlan);
    } else {
      this.editPermission = editPermission;
    }
  }

  async loadWorkpackModel(idWorkpackModel) {
    const result = await this.workpackModelSrv.GetById(idWorkpackModel);
    if (result.success) {
      this.workpackModel = result.data;
    }
    const plan = await this.planSrv.GetById(this.idPlan);
    if (plan.success) {
      this.propertiesPlan = plan.data;
      this.idOffice = plan.data.idOffice;
      this.officeSrv.nextIDOffice(this.idOffice);
      await this.loadPermissionsOffice();
    }
  }

  async loadPermissionsOffice() {
    const payload = this.authSrv.getTokenPayload();
    const result = await this.officePermissionSrv.GetAll({'id-office': this.idOffice, email: payload.email});
    if (result.success) {
      const permissions = result.data.filter( office => office.permissions.find( p => p.level === 'EDIT'));
      if (permissions && permissions.length > 0) {
        this.editPermissionOffice = true;
      }
    }
  }

 async instanceProperty(propertyModel: IWorkpackModelProperty): Promise<PropertyTemplateModel> {
    const property = new PropertyTemplateModel();
    const propertyWorkpack = this.workpack && this.workpack.properties.find( wp => wp.idPropertyModel === propertyModel.id);

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
      const listValues = propertyWorkpack?.value ?  propertyWorkpack?.value as string : propertyModel.defaultValue as string;
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
        label: domain.name,
        data: domain.id,
        children: undefined,
        parent: undefined,
        selectable: (this.editPermission && property.multipleSelection)
      };
      rootNode.children = this.loadLocality(localityList, rootNode);
      property.idDomain = propertyModel.idDomain;
      property.localityList = [ rootNode ];
      const defaultSelectedLocalities = propertyWorkpack?.selectedValues  ?
        propertyWorkpack?.selectedValues as number[] : (propertyModel.defaults ? propertyModel.defaults as number[] : undefined);
      if (defaultSelectedLocalities?.length > 0) {
        const totalLocalities = this.countLocalities(localityList);
        if (defaultSelectedLocalities.length === totalLocalities) {
          defaultSelectedLocalities.unshift(propertyModel.idDomain);
        }
        const selectedLocalityList = this.loadSelectedLocality(defaultSelectedLocalities, property.localityList);
        selectedLocalityList.forEach(l => this.expandTreeToTreeNode(l));
        property.localitiesSelected = propertyModel.multipleSelection
          ? selectedLocalityList as TreeNode[]
          : selectedLocalityList[0] as TreeNode;
      }
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.OrganizationSelectionModel) {
      property.possibleValuesIds = await this.loadOrganizationsOffice();
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
      property.possibleValuesIds = await this.loadUnitMeasuresOffice();
      property.selectedValue = propertyWorkpack?.selectedValue ? propertyWorkpack?.selectedValue : propertyModel.defaults as number;
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

  loadLocality(localityList: ILocalityList[], parent: TreeNode) {
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
    return list.reduce( (total, item) => {
      if (item.children) {
        return total + 1 + this.countLocalities(item.children);
      }
      return total + 1;
    },0);
  }

  async loadDomainLocalities(idDomain: number) {
    const result = await this.localitySrv.getLocalitiesTreeFromDomain({'id-domain': idDomain});
    if (result) {
      return result as ILocalityList[];
    }
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

  async loadSectionsWorkpackModel() {
    if (this.workpackModel.stakeholderSessionActive && (this.isUserAdmin || this.editPermissionOffice)) {
      await this.loadStakeholders();
      this.sectionStakeholder = {
        cardSection: {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: 'stakeholders',
          collapseble: true,
          initialStateCollapse: false
        },
        cardItemsSection: await this.loadSectionStakeholderCards(this.stakeholderSectionShowInactives)
      };
    }
    if (this.workpackModel.costSessionActive) {
      this.sectionCostAccount = {
        cardSection: {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: 'costAccounts',
          collapseble: true,
          initialStateCollapse: false
        },
        cardItemsSection: await this.loadCardItemsCostSession()
      };
    }
    if (this.workpackModel.scheduleSessionActive && this.costAccounts) {
      await this.loadScheduleSession();
    }
    if (this.workpackModel.childWorkpackModelSessionActive && this.workpackModel.children) {
      this.sectionWorkpackModelChildren = true;
      this.loadSectionsWorkpackChildren();
    }
  }

  async loadSectionsWorkpackChildren() {
    this.cardsWorkPackModelChildren = await Promise.all(this.workpackModel.children.map(async(workpackModel) => {
      const propertiesCard = {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: workpackModel.modelNameInPlural,
        collapseble: true,
        initialStateCollapse: false
      };
      const workPackItemCardList = await this.loadWorkpacksFromWorkpackModel(this.workpack.plan.id, workpackModel);
      return {
        idWorkpackModel: workpackModel.id,
        cardSection: propertiesCard,
        cardItemsSection: workPackItemCardList
      };
    }));
  }

  async loadWorkpacksFromWorkpackModel(idPlan: number, workpackModel: IWorkpackModel) {
    const result = await this.workpackSrv.GetWorkpacksByParent({
      'id-plan': idPlan,
      'id-workpack-model': workpackModel.id,
      'id-workpack-parent': this.idWorkpack
    });
    const workpacks = result.success && result.data;
    if (workpacks && workpacks.length > 0) {
      const workpackItemCardList: ICardItem[] = workpacks.map(workpack => {
        const propertyNameWorkpackModel = workpack.model?.properties?.find(p => p.name === 'name' && p.session === 'PROPERTIES');
        const propertyNameWorkpack = workpack.properties?.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
        const propertyFullnameWorkpackModel = workpack.model?.properties?.find(p => p.name === 'fullName' && p.session === 'PROPERTIES');
        const propertyFullnameWorkpack = workpack.properties?.find(p => p.idPropertyModel === propertyFullnameWorkpackModel.id);

        return {
          typeCardItem: 'listItem',
          icon: workpack.model.fontIcon,
          iconSvg: false,
          nameCardItem: propertyNameWorkpack?.value as string,
          fullNameCardItem: propertyFullnameWorkpack?.value as string,
          itemId: workpack.id,
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteWorkpackChildren(workpack),
            disabled: !this.editPermission
          }] as MenuItem[],
          urlCard: '/workpack',
        };
      });
      if (this.editPermission) {
        workpackItemCardList.push(
          {
            typeCardItem: 'newCardItem',
            icon: IconsEnum.Plus,
            iconSvg: true,
            urlCard: '/workpack',
            paramsUrlCard: [
              { name: 'idPlan', value: idPlan },
              { name: 'idWorkpackModel', value: workpackModel.id },
              { name: 'idWorkpackParent', value: this.idWorkpack}
            ]
          }
        );
      }
      return workpackItemCardList;
    }
    if ((!workpacks || workpacks.length === 0) && this.editPermission) {
      const workpackItemCardList = [
        {
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconSvg: true,
          urlCard: '/workpack',
          paramsUrlCard: [
            { name: 'idPlan', value: idPlan },
            { name: 'idWorkpackModel', value: workpackModel.id },
            { name: 'idWorkpackParent', value: this.idWorkpack}
          ]
        }
      ];
      return workpackItemCardList;
    }
  }

  async deleteWorkpackChildren(workpack: IWorkpack) {
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
        }
      }
    }
  }

  async loadStakeholders() {
    const result = await this.stakeholderSrv.GetAll({ 'id-workpack': this.idWorkpack });
    if (result.success) {
      this.stakeholders = result.data;
    }
  }

  async loadSectionStakeholderCards(showInactives: boolean) {
    if (this.stakeholders) {
      const cardItems = !showInactives ? this.stakeholders.filter(stake => stake.roles.find(r => r.active)).map(stakeholder => ({
        typeCardItem: 'listItemStakeholder',
        icon: stakeholder.person ? IconsEnum.UserCircle : IconsEnum.Building,
        iconSvg: true,
        nameCardItem: stakeholder.person ? stakeholder.person.name : stakeholder.organization.name,
        itemId: stakeholder.person ? stakeholder.person.id : stakeholder.organization.id,
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteStakeholder(stakeholder)
        }],
        urlCard: stakeholder.person ? '/stakeholder/person' : '/stakeholder/organization',
        paramsUrlCard:  [
          { name: 'idWorkpack', value: stakeholder.idWorkpack },
          { name: stakeholder.person ? 'emailPerson' : 'idOrganization',
          value: stakeholder.person ? stakeholder.person.email : stakeholder.organization.id}
        ],
        iconMenuItems: null
      })) :
        this.stakeholders.map(stakeholder => ({
          typeCardItem: 'listItemStakeholder',
          icon: stakeholder.person ? IconsEnum.UserCircle : IconsEnum.Building,
          iconSvg: true,
          nameCardItem: stakeholder.person ? stakeholder.person.name : stakeholder.organization.name,
          itemId: stakeholder.person ? stakeholder.person.id : stakeholder.organization.id,
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteStakeholder(stakeholder)
          }],
          urlCard: stakeholder.person ? '/stakeholder/person' : '/stakeholder/organization',
          paramsUrlCard:  [
          { name: 'idWorkpack', value: stakeholder.idWorkpack },
          { name: stakeholder.person ? 'emailPerson' : 'idOrganization',
          value: stakeholder.person ? stakeholder.person.email : stakeholder.organization.id}
        ],
          iconMenuItems: null
        }));
      cardItems.push({
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        iconSvg: true,
        nameCardItem: null,
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
        'id-person': stakeholder.person.id
      }, { useConfirm: true });
      if (result.success) {
        const stakeholderIndex = this.sectionStakeholder.cardItemsSection.findIndex( stake => stake.itemId === stakeholder.person.id);
        if (stakeholderIndex > -1) {
          this.sectionStakeholder.cardItemsSection.splice(stakeholderIndex,1);
          this.sectionStakeholder.cardItemsSection = Array.from(this.sectionStakeholder.cardItemsSection);
        }
      }
    } else {
      const result = await this.stakeholderSrv.deleteStakeholderOrganization({
        'id-workpack': stakeholder.idWorkpack,
        'id-organization': stakeholder.organization.id
      }, { useConfirm: true });
      if (result.success) {
        const stakeholderIndex = this.sectionStakeholder.cardItemsSection.findIndex( stake => stake.itemId === stakeholder.organization.id);
        if (stakeholderIndex > -1) {
          this.sectionStakeholder.cardItemsSection.splice(stakeholderIndex,1);
          this.sectionStakeholder.cardItemsSection = Array.from(this.sectionStakeholder.cardItemsSection);
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
        }
      }
    );
  }

  async loadCardItemsCostSession() {
    const result = await this.costAccountSrv.GetAll({'id-workpack': this.idWorkpack});

    if (result.success && result.data.length > 0) {
      this.costAccounts = result.data;
      const funders = this.idOffice && await this.loadOrganizationsOffice();
      const cardItems = this.costAccounts.map( cost => {
        const propertyName =  cost.models.find( p => p.name === 'name');
        const propertyNameValue = propertyName && cost.properties.find( p => p.idPropertyModel === propertyName.id);
        const propertyfullName =  cost.models.find( p => p.name === 'fullName');
        const propertyFullnameValue = propertyfullName && cost.properties.find( p => p.idPropertyModel === propertyfullName.id);
        const propertyLimit =  cost.models.find( p => p.name === 'limit');
        const propertyLimitValue = propertyLimit && cost.properties.find( p => p.idPropertyModel === propertyLimit.id);
        const propertyFunder =  cost.models.find( p => p.name === 'funder');
        const propertyFunderValue = propertyFunder && cost.properties.find( p => p.idPropertyModel === propertyFunder.id);
        const selectedFunder = propertyFunderValue && (funders
          && funders.filter( org => org.value === propertyFunderValue.selectedValues[0]));
        return {
          typeCardItem: 'listItemCostAccount',
          icon: 'fas fa-dollar-sign',
          iconSvg: false,
          nameCardItem: propertyNameValue && propertyNameValue.value as string,
          fullNameCardItem: propertyFullnameValue && propertyFullnameValue.value as string,
          subtitleCardItem: selectedFunder && selectedFunder[0].label,
          costAccountsValue: propertyLimitValue?.value as number,
          itemId: cost.id,
          idWorkpack: cost.idWorkpack.toString(),
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteCostAccount(cost),
            disabled: !this.editPermission
          }] as MenuItem[],
          urlCard: '/workpack/cost-account',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.idWorkpack },
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
          ],
          iconMenuItems: null
        });
      }
      return cardItems;
    }
    const cardItemsNew =  this.editPermission ? [{
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
      ],
      iconMenuItems: null
    }] : [];
    return cardItemsNew;
  }

  async deleteCostAccount(cost: ICostAccount) {
    const result = await this.costAccountSrv.delete(cost);
    if (result.success) {
      this.sectionCostAccount.cardItemsSection =
        Array.from(this.sectionCostAccount.cardItemsSection.filter( item => item.itemId !== cost.id));
      return;
    }
  }

  async loadScheduleSession() {
    const result = await this.scheduleSrv.GetSchedule({'id-workpack': this.idWorkpack});
    if (result.success && result.data && result.data.length > 0) {
      this.schedule = result.data[0];
      const unitMeasureWorkpack = this.sectionPropertiesProperties.find( prop => prop.type === this.typePropertyModel.UnitSelectionModel);
      const unitMeasure = await this.unitMeasureSrv.GetById(unitMeasureWorkpack?.selectedValue as number);
      const unit = unitMeasure.success && unitMeasure.data;

      const groupStep = this.schedule.groupStep.map( (group, groupIndex, groupArray) => {
        const cardItemSection = group.steps.map( (step, stepIndex, stepArray) => ({
          type: 'listStep',
          stepName: new Date(step.periodFromStart + 'T00:00:00'),
          menuItems: (groupIndex === 0 && stepIndex === 0) ? [{
            label: this.translateSrv.instant('properties'),
            icon: 'fas fa-edit',
            command: () => this.editScheduleStep(step.id, unit.name, 'start')
          }] : (( groupIndex === groupArray.length - 1 && stepIndex === stepArray.length - 1) ?
            [{
              label: this.translateSrv.instant('properties'),
              icon: 'fas fa-edit',
              command: () => this.editScheduleStep(step.id, unit.name, 'end')
            }] : [{
              label: this.translateSrv.instant('properties'),
              icon: 'fas fa-edit',
              command: () => this.editScheduleStep(step.id, unit.name, 'step')
            }]),
          unitPlanned: step.plannedWork ? step.plannedWork : 0,
          unitActual: step.actualWork ? step.actualWork : 0,
          unitProgressBar: {
            total: step.plannedWork,
            progress: step.actualWork,
            color: '#FF8C00',
          },
          costPlanned: step.consumes?.reduce( (total, v) => ( total + (v.plannedCost ? v.plannedCost : 0)), 0),
          costActual: step.consumes?.reduce( (total, v) => ( total + (v.actualCost ? v.actualCost : 0)), 0),
          costProgressBar: {
            total: step.consumes?.reduce( (total, v) => ( total +  (v.plannedCost ? v.plannedCost : 0)), 0),
            progress: step.consumes?.reduce( (total, v) => ( total + (v.actualCost ? v.actualCost : 0)), 0),
            color: '#44B39B'
          },
          unitName: unit && unit.name,
          idStep: step.id
        }));
        return {
          year: group.year,
          cardItemSection
        };
      });
      const startDate = this.schedule && new Date(this.schedule.start + 'T00:00:00');
      const endDate = this.schedule && new Date(this.schedule.end + 'T00:00:00');
      const startScheduleStep = {
        type: 'newStart',
        urlCard: 'workpack/schedule/step',
        urlParams: {
          idSchedule: this.schedule.id,
          stepType: 'start',
          unitName: unit.name
        }
      };
      const endScheduleStep = {
        type: 'newEnd',
        urlCard: 'workpack/schedule/step',
        urlParams: {
          idSchedule: this.schedule.id,
          stepType: 'end',
          unitName: unit.name
        }
      };

      this.sectionSchedule = {
        cardSection: {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: 'schedule',
          collapseble: true,
          initialStateCollapse: false,
          headerDates: this.schedule && {
            startDate,
            endDate
          },
          progressBarValues: [
            {
              total: this.schedule.planed,
              progress: this.schedule.actual,
              labelTotal: 'planned',
              labelProgress: 'actual',
              valueUnit: unit && unit.name,
              color: '#FF8C00'
            },
            {
              total: this.schedule.planedCost,
              progress: this.schedule.actualCost,
              labelTotal: 'planned',
              labelProgress: 'actual',
              valueUnit: 'currency',
              color: '#44B39B'
            }
          ]
        },
        startScheduleStep,
        endScheduleStep,
        groupStep
      };
      if (this.sectionSchedule.groupStep && this.sectionSchedule.groupStep[0].cardItemSection) {
        this.sectionSchedule.groupStep[0].start = true;
        const idStartStep = this.sectionSchedule.groupStep[0].cardItemSection[0].idStep;
        this.sectionSchedule.groupStep[0].cardItemSection[0].menuItems.push({
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteScheduleStep(idStartStep)
        });
        this.sectionSchedule.groupStep[0].cardItemSection[0].stepDay = startDate;
        const groupStepItems: IScheduleStepCardItem[] = [startScheduleStep];
        this.sectionSchedule.groupStep[0].cardItemSection.forEach( card => {
          groupStepItems.push(card);
        });
        this.sectionSchedule.groupStep[0].cardItemSection = Array.from(groupStepItems);
      }
      const groupLenght = this.sectionSchedule.groupStep && this.sectionSchedule.groupStep.length;
      if (this.sectionSchedule.groupStep && this.sectionSchedule.groupStep[groupLenght-1].cardItemSection) {
        this.sectionSchedule.groupStep[groupLenght-1].end = true;
        const cardItemSectionLenght = this.sectionSchedule.groupStep[groupLenght-1].cardItemSection.length;
        const idEndStep = this.sectionSchedule.groupStep[groupLenght-1].cardItemSection[cardItemSectionLenght-1].idStep;
        this.sectionSchedule.groupStep[groupLenght-1].cardItemSection[cardItemSectionLenght-1].menuItems.push({
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) =>
            this.deleteScheduleStep(idEndStep)
        });
        this.sectionSchedule.groupStep[groupLenght-1].cardItemSection[cardItemSectionLenght-1].stepDay = endDate;
        this.sectionSchedule.groupStep[groupLenght-1].cardItemSection.push(endScheduleStep);
      }
      return;
    }
    this.sectionSchedule = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: 'schedule',
        collapseble: true,
        initialStateCollapse: false,
      }
    };
  }

  handleNewSchedule() {
    this.router.navigate(
      ['workpack/schedule'],
      {
        queryParams: {
          idWorkpack: this.idWorkpack,
        }
      }
    );
  }

  handleShowDetails() {
    this.showDetails = !this.showDetails;
  }

  async handleDeleteSchedule() {
    const result = await this.scheduleSrv.DeleteSchedule(this.schedule.id, {useConfirm: true});
    if (result.success) {
      this.schedule = null;
      this.sectionSchedule.groupStep = null;
      await this.loadScheduleSession();
    }
  }

  editScheduleStep(idStep: number, unitName: string, stepType: string) {
    this.router.navigate(
      ['workpack/schedule/step'],
      {
        queryParams: {
          id: idStep,
          stepType,
          unitName
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
    const stepGroup = this.schedule.groupStep.find( group => group.year === groupYear);
    const step = stepGroup.steps.find( s => s.id === idStep);
    const stepChanged = this.sectionSchedule.groupStep.find( group => group.year === groupYear)
      .cardItemSection.find( s => s.idStep === idStep);
    const result = await this.scheduleSrv.putScheduleStep({
      id: step.id,
      plannedWork: stepChanged.unitPlanned,
      actualWork: stepChanged.unitActual,
      consumes: step.consumes?.map( consume => ({
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
    this.workpackProperties = this.sectionPropertiesProperties.map(p => p.getValues());
    if (this.sectionPropertiesProperties.filter( p => p.invalid).length > 0) {
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
        routerLink: [ '/workpack' ],
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
}
