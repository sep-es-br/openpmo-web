import { MeasureUnitService } from './../../shared/services/measure-unit.service';
import { OrganizationService } from './../../shared/services/organization.service';
import { LocalityService } from './../../shared/services/locality.service';
import { DomainService } from './../../shared/services/domain.service';
import { ILocalityList } from './../../shared/interfaces/ILocality';
import { IDomain } from './../../shared/interfaces/IDomain';
import { IWorkpackModelProperty } from './../../shared/interfaces/IWorkpackModelProperty';
import { WorkpackModelService } from './../../shared/services/workpack-model.service';
import { IBreadcrumb } from './../../shared/interfaces/IBreadcrumb';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SelectItem, TreeNode } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { ICardItemFilterRules } from './../../shared/interfaces/ICardItemFilterRules';
import { FilterDataviewService } from './../../shared/services/filter-dataview.service';
import { IFilterDataview } from './../../shared/interfaces/IFilterDataview';
import { ActivatedRoute, Router } from '@angular/router';
import { SaveButtonComponent } from './../../shared/components/save-button/save-button.component';
import { takeUntil, filter } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ICard } from './../../shared/interfaces/ICard';
import { Subject, Subscription } from 'rxjs';
import { ResponsiveService } from './../../shared/services/responsive.service';
import { Component, OnInit, OnDestroy, ViewChild, Pipe } from '@angular/core';
import { FilterLogicalOperatorsEnum } from 'src/app/shared/enums/FilterLogicalOperatorsEnum';
import { Location } from '@angular/common';
import * as moment from 'moment';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { AuthService } from 'src/app/shared/services/auth.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { IOrganization } from 'src/app/shared/interfaces/IOrganization';
import { CostAccountModelService } from 'src/app/shared/services/cost-account-model.service';
import { TypeWorkpackModelEnum } from 'src/app/shared/enums/TypeWorkpackModelEnum';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { CostAccountService } from 'src/app/shared/services/cost-account.service';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

@Component({
  selector: 'app-filter-dataview',
  templateUrl: './filter-dataview.component.html',
  styleUrls: ['./filter-dataview.component.scss']
})
export class FilterDataviewComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

  $destroy = new Subject();
  formFilter: FormGroup;
  idFilter: number;
  entityName: string;
  filterUrl: string;
  idWorkpackModel: number;
  cardPropertiesFilter: ICard;
  responsive: boolean;
  filterData: IFilterDataview;
  propertiesListOptions: SelectItem[];
  ruleCards: ICardItemFilterRules[];
  backupRoleCards: ICardItemFilterRules[];
  filterPropertiesList: IFilterProperty[] = this.filterSrv.get;
  filterPropertiesSub: Subscription;
  currentBreadcrumbItems: IBreadcrumb[] = this.breadcrumbSrv.get;
  currentBreadcrumbSub: Subscription;
  typePropertyModel = TypePropertyModelEnum;
  idOffice: number;
  workpackModelEntitiesOptions = ['stakeholders', 'risks', 'issues', 'processes'];
  localityList;
  organizations: IOrganization[] = [];
  idCostAccountModel: number;
  isLoading = false;
  formIsSaving = false;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private filterSrv: FilterDataviewService,
    private breadcrumbSrv: BreadcrumbService,
    private workpackModelSrv: WorkpackModelService,
    private domainSrv: DomainService,
    private localitySrv: LocalityService,
    private organizationSrv: OrganizationService,
    private unitMeasureSrv: MeasureUnitService,
    private locationSrv: Location,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private router: Router,
    private costAccountModelSrv: CostAccountModelService,
    private costAccountSrv: CostAccountService
  
  ) {
    this.loadFormFilter();
    this.formFilter.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formFilter.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formFilter.dirty && this.formFilter.valid))
      .subscribe(() => {
        if (this.validadeRulesCards()) {
          this.saveButton.showButton();
        }

      });
    this.formFilter.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formFilter.dirty))
      .subscribe(() => {
        this.cancelButton.showButton();
      });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.activeRoute.queryParams.subscribe(({ idFilter, entityName, idWorkpackModel, idOffice }) => {
      this.idFilter = idFilter ? +idFilter : undefined;
      this.entityName = entityName;
      this.idWorkpackModel = idWorkpackModel ? +idWorkpackModel : undefined;
      this.idOffice = +idOffice;
      this.checkURL(`#${this.locationSrv.path()}`);
    });
    if (!!this.idWorkpackModel) {
      switch (this.entityName) {
        case 'workpacks':
          this.filterUrl = `workpackModels/${this.idWorkpackModel}/workpacks`;
          break;
        case 'costAccounts':
          this.filterUrl = `workpackModels/${this.idWorkpackModel}/costAccounts`;
          break;
        case 'stakeholders':
          this.filterUrl = `workpackModels/${this.idWorkpackModel}/stakeholders`;
          break;
        case 'risks':
          this.filterUrl = `workpackModels/${this.idWorkpackModel}/risks`;
          break;
        case 'issues':
          this.filterUrl = `workpackModels/${this.idWorkpackModel}/issues`;
          break;
        case 'processes':
          this.filterUrl = `workpackModels/${this.idWorkpackModel}/processes`;
          break;
        default:
          break;
      }
    } else {
      this.filterUrl = this.entityName;
    }
  }

  async checkURL(url: string) {
    const [path] = url.slice(2).split('?');
    if (path.startsWith('config/filter-dataview')) {
      const isAdmin = await this.authSrv.isUserAdmin();
      if (!isAdmin) {
        const editPermission = this.idOffice ? await this.officePermissionSrv.getPermissions(this.idOffice) : false;
        if (!editPermission) {
          this.router.navigate(['/offices']);
        }
      }
    }
  }

  async ngOnInit() {
    this.isLoading = true;
    this.loadPropertiesCardFilter();
    this.filterPropertiesSub = this.filterSrv.ready.subscribe(data => {
      if (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName))) {
        this.filterPropertiesList = data;
        this.loadPropertiesListOptions();
      }
    });
    this.currentBreadcrumbSub = this.breadcrumbSrv.ready.subscribe(data => {
      this.currentBreadcrumbItems = data;
    });
    if (!!this.idWorkpackModel && this.entityName === 'workpacks') {
      await this.loadWorkpackFilterPropertiesList();
    }
    if (!!this.idWorkpackModel && this.entityName === 'costAccounts') {
      await this.loadCostAccountFilterPropertiesList();
    }
    this.loadPropertiesListOptions();
    this.setCurrentBreadcrumb();
    if (this.idFilter) {
      await this.loadFilterData();
    }
    await this.loadRuleCards();
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
    if (!!this.filterPropertiesSub) { this.filterPropertiesSub.unsubscribe(); }
  }

  loadFormFilter() {
    this.formFilter = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      favorite: false,
      sortBy: ['', Validators.required],
      sortByDirection: ['', Validators.required]
    });
  }

  setCurrentBreadcrumb() {
    if (this.currentBreadcrumbItems && this.currentBreadcrumbItems.length > 0) {
      this.breadcrumbSrv.setMenu([...this.currentBreadcrumbItems,
      ...[{
        key: 'filter',
      }]
      ]);
    }
  }

  loadPropertiesListOptions() {
    this.propertiesListOptions = this.filterPropertiesList && this.filterPropertiesList.filter(p => !['level', 'role'].includes(p.name)).map(prop => ({
      label: (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName)))
        ? this.translateSrv.instant(prop.name) : prop.label,
      value: (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName)))
        ? prop.name : (prop.idPropertyModel ? prop.idPropertyModel.toString() : prop.name)
    }));
  }

  async loadFilterData() {
    const result = await this.filterSrv.getFilterById(this.filterUrl, this.idFilter);
    if (result.success) {
      this.filterData = result.data;
      this.setFormFilter();
    }
  }

  setFormFilter() {
    this.formFilter.reset({
      name: this.filterData.name,
      favorite: this.filterData.favorite,
      sortBy: this.filterData.sortBy,
      sortByDirection: this.filterData.sortByDirection
    });
  }

  loadPropertiesCardFilter() {
    this.cardPropertiesFilter = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false
    };
  }

  async loadRuleCards() {
    if (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName))) {
      await this.instanceFilterPropertiesList();
    }
    if (this.filterData && this.filterData.rules && this.filterData.rules.length > 0) {
      this.ruleCards = this.filterData.rules.map(rule => {
        const propertySelected = (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName)))
          ? { ...this.filterPropertiesList.find(property => property.name === rule.propertyName) } :
          { ...this.filterPropertiesList.find(property => (property.idPropertyModel && property.idPropertyModel.toString() === rule.propertyName.toString()) ||
            (property.name === rule.propertyName.toString())) };
        return {
          id: rule.id,
          typeCard: 'rule-card',
          propertySelected,
          propertiesList: this.filterPropertiesList,
          operator: rule.operator,
          value: this.setValueProperty(propertySelected, rule.value),
          logicalOperator: rule.logicOperator,
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.handleDeleteCardItem(this.ruleCards.length)
          }]
        };
      });

      this.ruleCards.push({
        typeCard: 'new-card'
      });
    } else {
      this.ruleCards = [{
        typeCard: 'new-card'
      }];
    }
    this.backupRoleCards = this.ruleCards.map( card => ({...card}));
  }

  async handleCreateNewRuleCard(event?) {
    this.cancelButton.showButton();
    if (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName))) {
      await this.instanceFilterPropertiesList();
    }
    this.ruleCards = Array.from(this.ruleCards.filter(card => card.typeCard !== 'new-card'));
    if (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName))) {
      await this.reloadTranslateFilterPropertiesList();
    }
    this.ruleCards.push({
      typeCard: 'rule-card',
      propertiesList: this.filterPropertiesList,
      value: null,
      logicalOperator: FilterLogicalOperatorsEnum.AND,
      menuItems: [{
        label: this.translateSrv.instant('delete'),
        icon: 'fas fa-trash-alt',
        command: (event) => this.handleDeleteCardItem(this.ruleCards.length)
      }]
    });
    this.ruleCards.push({
      typeCard: 'new-card'
    });
    if (this.formFilter.valid && this.validadeRulesCards()) {
      this.saveButton.showButton();
    } else {
      this.saveButton?.hideButton();
    }
  }

  handleDeleteCardItem(index) {
    this.ruleCards.splice(index, 1);
    this.cancelButton.showButton();
    if (this.formFilter.valid && this.validadeRulesCards()) {
      this.saveButton.showButton();
    } else {
      this.saveButton?.hideButton();
    }
  }

  handlePropertyValueChanged(event) {
    this.cancelButton.showButton();
    if (this.formFilter.valid && this.validadeRulesCards()) {
      this.saveButton.showButton();
    } else {
      this.saveButton?.hideButton();
    }
  }

  validadeRulesCards() {
    const invalidCard = this.ruleCards.filter(card => card.typeCard !== 'new-card' &&
      (!card.propertySelected || !card.propertySelected.name || !card.operator || (card.propertySelected.type !== 'Toggle' && !card.value)));
    if (invalidCard && invalidCard.length > 0) {
      return false;
    }
    return true;
  }

  async handleOnSubmit() {
    this.cancelButton.hideButton();
    const sender: IFilterDataview = {
      id: this.idFilter,
      name: this.formFilter.controls.name.value,
      sortBy: this.formFilter.controls.sortBy.value,
      favorite: this.formFilter.controls.favorite.value,
      sortByDirection: this.formFilter.controls.sortByDirection.value,
      rules: this.ruleCards.filter(ruleCard => ruleCard.typeCard !== 'new-card').map(card => ({
        id: card.id,
        propertyName: (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName))) ?
          card.propertySelected.name : (card.propertySelected.idPropertyModel ? card.propertySelected.idPropertyModel.toString() : card.propertySelected.name),
        operator: card.operator,
        value: (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions
          .includes(this.entityName))) ? card.value :
          this.getValueProperty(card.propertySelected, card.value),
        logicOperator: card.logicalOperator
      }))
    };
    this.formIsSaving = true;
    const result = this.idFilter ? await this.filterSrv.putFilter(this.filterUrl, sender) :
      await this.filterSrv.postFilter(this.filterUrl, sender);
    this.formIsSaving = false;
    if (result.success) {
      this.navigateToBack();
    }
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    if (this.idFilter) {
      this.setFormFilter();
      this.ruleCards = this.backupRoleCards.map( card => ({...card}));
    } else {
      this.formFilter.reset({
        name: '',
        favorite: false,
        sortBy: '',
        sortByDirection: ''
      });
      this.ruleCards = [{
        typeCard: 'new-card'
      }];
    }
  }

  navigateToBack() {
    this.currentBreadcrumbItems = this.breadcrumbSrv.get;
    if (this.currentBreadcrumbItems && this.currentBreadcrumbItems.length > 0) {
      const lastItem = this.currentBreadcrumbItems[this.currentBreadcrumbItems.length - 1];
      this.router.navigate([...lastItem.routerLink], {
        queryParams: {
          ...lastItem.queryParams
        }
      });
    } else {
      this.router.navigate(['/offices']);
    }
  }

  getValueProperty(property: IFilterProperty, propValue) {
    let value;
    switch (property.type) {
      case TypePropertyModelEnum.DateModel:
        value = moment(propValue).format('yyyy-MM-DD');
        break;
      case TypePropertyModelEnum.SelectionModel:
        const selectedOptions = property.multipleSelection && propValue as string[];
        const stringValue = selectedOptions ? selectedOptions.join(',') : propValue as string;
        value = stringValue;
        break;
      case TypePropertyModelEnum.UnitSelectionModel:
        value = propValue.toString();
        break;
      case TypePropertyModelEnum.OrganizationSelectionModel:
        const selectedOrganization = !property.multipleSelection && propValue as number;
        value = selectedOrganization ? selectedOrganization.toString() : (propValue as number[]).join(',');
        break;
      case TypePropertyModelEnum.LocalitySelectionModel:
        if (!property.multipleSelection) {
          const selectedLocality = propValue as TreeNode;
          value = selectedLocality.data.toString();
        }
        if (property.multipleSelection) {
          const selectedLocality = propValue as TreeNode[];
          value = selectedLocality.filter(l => l.data && !l.data.toString().includes('SELECTALL')).map(l => l.data).join(',');
        }
        break;
      case TypePropertyModelEnum.CurrencyModel:
        value = propValue as number;
        break;
      case TypePropertyModelEnum.NumberModel:
        value = propValue as number;
        break;
      case TypePropertyModelEnum.IntegerModel:
        value = propValue as number;
        break;
      case TypePropertyModelEnum.ToggleModel:
        value = propValue ? propValue : false;
        break;
      default:
        value = propValue as string;
        break;
    }
    return value.toString();
  }

  setValueProperty(property: IFilterProperty, propertyValue) {
    let value;
    switch (property.type) {
      case TypePropertyModelEnum.DateModel:
        value = moment(propertyValue.toString().split('T')[0], 'yyyy-MM-DD').toDate() as Date;
        break;
      case TypePropertyModelEnum.SelectionModel:
        const selectedOptions = property.multipleSelection && propertyValue as string;
        const stringValue = selectedOptions ? selectedOptions.split(',') : propertyValue as string;
        value = stringValue;
        break;
      case TypePropertyModelEnum.UnitSelectionModel:
        value = Number(propertyValue);
        break;
      case TypePropertyModelEnum.OrganizationSelectionModel:
        const selectedOrganization = !property.multipleSelection && propertyValue as string;
        value = selectedOrganization ? Number(selectedOrganization) : propertyValue.split(',').map(v => Number(v));
        break;
      case TypePropertyModelEnum.LocalitySelectionModel:
        const selectedLocalities = propertyValue.split(',').map(p => Number(p));
        const selectedLocalityList = this.loadSelectedLocality(selectedLocalities, property.localityList);
        selectedLocalityList.forEach(l => this.expandTreeToTreeNode(l));
        value = property.multipleSelection
          ? selectedLocalityList as TreeNode[]
          : selectedLocalityList[0] as TreeNode;
        break;
      case TypePropertyModelEnum.CurrencyModel:
        value = propertyValue as number;
        break;
      case TypePropertyModelEnum.NumberModel:
        value = propertyValue as number;
        break;
      case TypePropertyModelEnum.IntegerModel:
        value = propertyValue as number;
        break;
      case TypePropertyModelEnum.ToggleModel:
        value = propertyValue ? (propertyValue === 'true' ? true : false) : false;
        break;
      default:
        value = propertyValue as string;
        break;
    }
    return value;
  }



  async handleDeleteFilter() {
    const result = await this.filterSrv.deleteFilter(this.filterUrl, this.idFilter);
    if (result.success) {
      this.navigateToBack();
    }
  }

  async reloadTranslateFilterPropertiesList() {
    this.filterPropertiesList.forEach(prop => {
      prop.label = this.translateSrv.instant(prop.name);
    });
  }

  async instanceFilterPropertiesList() {
    const dataProperties = Array.from(this.filterPropertiesList);
    this.filterPropertiesList = [];
    dataProperties.forEach(prop => {
      const property: IFilterProperty = {
        type: prop.type,
        label: this.translateSrv.instant(prop.label),
        name: prop.name,
        possibleValues: prop.possibleValues,
        helpText: prop.helpText
      };
      this.filterPropertiesList.push(property);
    });
  }

  async loadWorkpackFilterPropertiesList() {
    const resultWorkpackModel = await this.workpackModelSrv.GetById(this.idWorkpackModel);
    const workpackModel = resultWorkpackModel.success && resultWorkpackModel.data;
    this.filterPropertiesList = [this.instancePropertyStaticWorkpack('name', TypePropertyModelEnum.TextModel)];
    this.filterPropertiesList.push(this.instancePropertyStaticWorkpack('fullName', TypePropertyModelEnum.TextAreaModel));
    if( workpackModel.type === TypeWorkpackModelEnum.MilestoneModel) {
      this.filterPropertiesList.push(this.instancePropertyStaticWorkpack('date', TypePropertyModelEnum.DateModel))
    }
    const workpackModelActivesProperties = workpackModel.properties && workpackModel.properties.filter(w => w.active);
    const workpackModelPropertiesList = workpackModelActivesProperties && await Promise.all(workpackModelActivesProperties.map(p => this.instanceProperty(p)));
    this.filterPropertiesList = workpackModelPropertiesList ? [...this.filterPropertiesList, ...workpackModelPropertiesList] : this.filterPropertiesList;
  }

  async loadCostAccountFilterPropertiesList() {
    this.idCostAccountModel = await this.costAccountSrv.loadIdCostAccountModel();
    const resultCostAccountModel = await this.costAccountModelSrv.GetById(this.idCostAccountModel);
    const costAccountModel = resultCostAccountModel.success && resultCostAccountModel.data;
    const costAccountModelActivesProperties = costAccountModel.properties.filter(w => w.active);
    if (costAccountModelActivesProperties && costAccountModelActivesProperties
      .filter(prop => this.typePropertyModel[prop.type] === TypePropertyModelEnum.OrganizationSelectionModel).length > 0) {
      await this.loadOrganizationsOffice();
    }
    const costAccountPropertiesList = await Promise.all(costAccountModelActivesProperties.map(p => this.instanceProperty(p)));
    this.filterPropertiesList = costAccountPropertiesList;
  }

  instancePropertyStaticWorkpack(name: string, type: string) {
    const property: IFilterProperty = {
      type: type,
      label: this.translateSrv.instant(name),
      name: name,
      multipleSelection: false,
    };
    return property;
  }

  async instanceProperty(propertyModel: IWorkpackModelProperty): Promise<IFilterProperty> {
    const property: IFilterProperty = {
      idPropertyModel: propertyModel.id,
      type: TypePropertyModelEnum[propertyModel.type],
      label: propertyModel.label,
      name: propertyModel.name,
      multipleSelection: propertyModel.multipleSelection,
      defaultValue: propertyModel.defaultValue,
      min: propertyModel.min,
      max: propertyModel.max,
      active: propertyModel.active,
      helpText: propertyModel.helpText
    };

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.SelectionModel && propertyModel.multipleSelection) {
      const listValues = propertyModel.defaultValue as string;
      property.defaultValue = listValues.split(',');
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.SelectionModel) {
      const listOptions = (propertyModel.possibleValues as string).split(',').sort((a, b) => a.localeCompare(b));
      property.possibleValues = listOptions.map(op => ({ label: op, value: op }));
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.LocalitySelectionModel) {
      const domain = await this.loadDomain(propertyModel.idDomain);
      const localityList = await this.loadDomainLocalities(domain.id);
      const selectable = true;
      const rootNode: TreeNode = {
        label: domain.localityRoot.name,
        data: domain.localityRoot.id,
        children: this.loadLocality(localityList[0].children, selectable, property.multipleSelection),
        selectable
      };
      property.idDomain = propertyModel.idDomain;
      property.localityList = [rootNode];
      this.localityList = [rootNode];
      const defaultSelectedLocalities = (propertyModel.defaults ? propertyModel.defaults as number[] : undefined);
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
      property.possibleValuesIds = this.organizations.filter(org => propertyModel.sectors.includes(org.sector.toLowerCase()))
        .map(d => ({ label: d.name, value: d.id }));
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.UnitSelectionModel) {
      property.possibleValuesIds = await this.loadUnitMeasuresOffice();
      property.defaults = propertyModel.defaults as number;
    }
    return property;
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
    list.sort((a, b) => a.label.localeCompare(b.label));
    if (multipleSelection) {
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

  countLocalities(list: ILocalityList[]) {
    return list.reduce((total, item) => {
      if (item.children) {
        return total + 1 + this.countLocalities(item.children);
      }
      return total + 1;
    }, 0);
  }

  async loadDomainLocalities(idDomain: number) {
    const result = await this.localitySrv.getLocalitiesTreeFromDomain({ 'id-domain': idDomain });
    if (result) {
      return result as ILocalityList[];
    }
  }

  async loadOrganizationsOffice() {
    const result = await this.organizationSrv.GetAll({ 'id-office': this.idOffice });
    if (result.success) {
      this.organizations = result.data && result.data.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  async loadUnitMeasuresOffice() {
    const result = await this.unitMeasureSrv.GetAll({ idOffice: this.idOffice });
    if (result.success) {
      const units = result.data;
      return units.map(org => ({
        label: org.name,
        value: org.id
      })).sort((a, b) => a.label.localeCompare(b.label));
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

}
