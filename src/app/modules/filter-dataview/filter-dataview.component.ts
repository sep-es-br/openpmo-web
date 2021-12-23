import { MeasureUnitService } from './../../shared/services/measure-unit.service';
import { OrganizationService } from './../../shared/services/organization.service';
import { LocalityService } from './../../shared/services/locality.service';
import { DomainService } from './../../shared/services/domain.service';
import { ILocalityList } from './../../shared/interfaces/ILocality';
import { IDomain } from './../../shared/interfaces/IDomain';
import { TypePropertyModelEnum } from './../../shared/enums/TypePropertyModelEnum';
import { IWorkpackModelProperty } from './../../shared/interfaces/IWorkpackModelProperty';
import { WorkpackModelService } from './../../shared/services/workpack-model.service';
import { IBreadcrumb } from './../../shared/interfaces/IBreadcrumb';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SelectItem, TreeNode } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { ICardItemFilterRules } from './../../shared/interfaces/ICardItemFilterRules';
import { FilterDataviewService } from './../../shared/services/filter-dataview.service';
import { PropertyTemplateModel } from './../../shared/models/PropertyTemplateModel';
import { IFilterDataview } from './../../shared/interfaces/IFilterDataview';
import { ActivatedRoute } from '@angular/router';
import { SaveButtonComponent } from './../../shared/components/save-button/save-button.component';
import { takeUntil, filter } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ICard } from './../../shared/interfaces/ICard';
import { Subject, Subscription } from 'rxjs';
import { ResponsiveService } from './../../shared/services/responsive.service';
import { Component, OnInit, OnDestroy, ViewChild, Pipe } from '@angular/core';
import { FilterLogicalOperatorsEnum } from 'src/app/shared/enums/FilterLogicalOperatorsEnum';
import { Location } from '@angular/common';

@Component({
  selector: 'app-filter-dataview',
  templateUrl: './filter-dataview.component.html',
  styleUrls: ['./filter-dataview.component.scss']
})
export class FilterDataviewComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

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
  filterPropertiesList: PropertyTemplateModel[] = this.filterSrv.get;
  filterPropertiesSub: Subscription;
  currentBreadcrumbItems: IBreadcrumb[] = this.breadcrumbSrv.get;
  currentBreadcrumbSub: Subscription;
  typePropertyModel = TypePropertyModelEnum;
  idOffice: number;
  workpackModelEntitiesOptions = ['stakeholders', 'risks', 'issues', 'processes'];

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private filterSrv: FilterDataviewService,
    private location: Location,
    private breadcrumbSrv: BreadcrumbService,
    private workpackModelSrv: WorkpackModelService,
    private domainSrv: DomainService,
    private localitySrv: LocalityService,
    private organizationSrv: OrganizationService,
    private unitMeasureSrv: MeasureUnitService,
  ) {
    this.loadFormFilter();
    this.formFilter.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton.hideButton());
    this.formFilter.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formFilter.dirty))
      .subscribe(() => {
        if (this.validadeRulesCards()) {
          this.saveButton.showButton()
        }
      });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.activeRoute.queryParams.subscribe(({ id, entityName, idWorkpackModel, idOffice }) => {
      this.idFilter = id ? +id : undefined;
      this.entityName = entityName;
      this.idWorkpackModel = idWorkpackModel ? +idWorkpackModel : undefined;
      this.idOffice = +idOffice;
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
    this.translateSrv.onDefaultLangChange.pipe(takeUntil(this.$destroy)).subscribe(({ lang }) => {
      setTimeout(() => {
        this.loadPropertiesListOptions();
      }, 250)

    });
  }

  async ngOnInit() {
    this.loadPropertiesCardFilter();
    this.filterPropertiesSub = this.filterSrv.ready.subscribe(data => {
      if (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName))) {
        this.filterPropertiesList = data;
        this.loadPropertiesListOptions();
      }
    });
    this.currentBreadcrumbSub = this.breadcrumbSrv.ready.subscribe(data => {
      this.currentBreadcrumbItems = data;
      this.setCurrentBreadcrumb();
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
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
    if (!!this.filterPropertiesSub)
      this.filterPropertiesSub.unsubscribe();
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
      this.breadcrumbSrv.setMenu([...this.currentBreadcrumbItems]);
    }
  }

  loadPropertiesListOptions() {
    this.propertiesListOptions = this.filterPropertiesList && this.filterPropertiesList.filter(p => !['level', 'role'].includes(p.name)).map(prop => ({
      label: (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName)))
        ? this.translateSrv.instant(prop.name) : prop.label,
      value: (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName)))
        ? prop.name : prop.idPropertyModel.toString()
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
    this.formFilter.controls.name.setValue(this.filterData.name);
    this.formFilter.controls.favorite.setValue(this.filterData.favorite);
    this.formFilter.controls.sortBy.setValue(this.filterData.sortBy);
    this.formFilter.controls.sortByDirection.setValue(this.filterData.sortByDirection);
  }

  loadPropertiesCardFilter() {
    this.cardPropertiesFilter = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false
    }
  }

  async loadRuleCards() {
    if (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName))) {
      await this.instanceFilterPropertiesList();
    }
    if (this.filterData && this.filterData.rules && this.filterData.rules.length > 0) {
      this.ruleCards = this.filterData.rules.map(rule => {
        let propertySelected = new PropertyTemplateModel();
        propertySelected = (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName)))
          ? this.filterPropertiesList.find(property => property.name === rule.propertyName) :
          this.filterPropertiesList.find(property => property.idPropertyModel.toString() === rule.propertyName.toString());
        propertySelected.value = rule.value;
        return {
          id: rule.id,
          typeCard: 'rule-card',
          propertySelected: propertySelected,
          propertiesList: this.filterPropertiesList,
          operator: rule.operator,
          value: rule.value,
          logicalOperator: rule.logicOperator,
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.handleDeleteCardItem(this.ruleCards.length)
          }]
        }
      });
      this.ruleCards.push({
        typeCard: 'new-card'
      });
    } else {
      this.ruleCards = [{
        typeCard: 'new-card'
      }];
    }

  }

  async handleCreateNewRuleCard(event?) {
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
      this.saveButton.hideButton();
    }
  }

  handleDeleteCardItem(index) {
    this.ruleCards.splice(index, 1);
    if (this.formFilter.valid && this.validadeRulesCards()) {
      this.saveButton.showButton();
    } else {
      this.saveButton.hideButton();
    }
  }

  handlePropertyValueChanged() {
    if (this.formFilter.valid && this.validadeRulesCards()) {
      this.saveButton.showButton();
    } else {
      this.saveButton.hideButton();
    }
  }

  validadeRulesCards() {
    const invalidCard = this.ruleCards.filter(card => card.typeCard !== 'new-card' &&
      (!card.propertySelected || !card.propertySelected.name || !card.operator || !card.propertySelected.value));
    if (invalidCard && invalidCard.length > 0) {
      return false;
    }
    return true;
  }

  async handleOnSubmit() {
    const sender: IFilterDataview = {
      id: this.idFilter,
      name: this.formFilter.controls.name.value,
      sortBy: this.formFilter.controls.sortBy.value,
      favorite: this.formFilter.controls.favorite.value,
      sortByDirection: this.formFilter.controls.sortByDirection.value,
      rules: this.ruleCards.filter(ruleCard => ruleCard.typeCard !== 'new-card').map(card => ({
        id: card.id,
        propertyName: (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName))) ?
          card.propertySelected.name : card.propertySelected.idPropertyModel.toString(),
        operator: card.operator,
        value: card.propertySelected.value,
        logicOperator: card.logicalOperator
      }))
    };
    const result = this.idFilter ? await this.filterSrv.putFilter(this.filterUrl, sender) :
      await this.filterSrv.postFilter(this.filterUrl, sender);
    if (result.success) {
      this.location.back();
    }
  }

  async handleDeleteFilter() {
    const result = await this.filterSrv.deleteFilter(this.filterUrl, this.idFilter);
    if (result.success) {
      this.location.back();
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
      let property = new PropertyTemplateModel();
      property.type = prop.type;
      property.label = prop.label;
      property.name = prop.name;
      property.type = prop.type;
      property.active = prop.active;
      property.possibleValues = prop.possibleValues
      this.filterPropertiesList.push(property);
    })
  }

  async loadWorkpackFilterPropertiesList() {
    const resultWorkpackModel = await this.workpackModelSrv.GetById(this.idWorkpackModel);
    const workpackModel = resultWorkpackModel.success && resultWorkpackModel.data;
    const workpackModelActivesProperties = workpackModel.properties.filter(w => w.active && w.session === 'PROPERTIES');
    const workpackModelPropertiesList = await Promise.all(workpackModelActivesProperties.map(p => this.instanceProperty(p)));
    this.filterPropertiesList = workpackModelPropertiesList;
  }

  async loadCostAccountFilterPropertiesList() {
    const resultWorkpackModel = await this.workpackModelSrv.GetById(this.idWorkpackModel);
    const workpackModel = resultWorkpackModel.success && resultWorkpackModel.data;
    const workpackModelActivesProperties = workpackModel.properties.filter(w => w.active && w.session === 'COST');
    const costAccountPropertiesList = await Promise.all(workpackModelActivesProperties.map(p => this.instanceProperty(p)));
    this.filterPropertiesList = costAccountPropertiesList;
  }

  async instanceProperty(propertyModel: IWorkpackModelProperty): Promise<PropertyTemplateModel> {
    const property = new PropertyTemplateModel();
    property.idPropertyModel = propertyModel.id;
    property.type = TypePropertyModelEnum[propertyModel.type];
    property.active = propertyModel.active;
    property.fullLine = propertyModel.fullLine;
    property.label = propertyModel.label;
    property.name = propertyModel.name;
    property.required = propertyModel.required;
    property.disabled = false;
    property.session = propertyModel.session;
    property.sortIndex = propertyModel.sortIndex;
    property.multipleSelection = propertyModel.multipleSelection;
    property.rows = propertyModel.rows ? propertyModel.rows : 1;
    property.decimals = propertyModel.decimals;
    property.value = propertyModel.defaultValue;
    property.defaultValue = propertyModel.defaultValue;
    property.min = propertyModel.min;
    property.max = propertyModel.max;
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.DateModel) {
      const dateValue = (propertyModel.defaultValue && propertyModel.defaultValue.toLocaleString());
      property.value = dateValue ? new Date(dateValue) : null;
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.SelectionModel && propertyModel.multipleSelection) {
      const listValues = propertyModel.defaultValue as string;
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
        selectable: property.multipleSelection
      };
      rootNode.children = this.loadLocality(localityList, rootNode);
      property.idDomain = propertyModel.idDomain;
      property.localityList = [rootNode];
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
      property.possibleValuesIds = await this.loadOrganizationsOffice();
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
      property.possibleValuesIds = await this.loadUnitMeasuresOffice();
      property.selectedValue = propertyModel.defaults as number;
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

  loadLocality(localityList: ILocalityList[], parent: TreeNode) {
    const list = localityList.map(locality => {
      if (locality.children) {
        const node = {
          label: locality.name,
          data: locality.id,
          children: undefined,
          parent,
          selectable: true
        };
        node.children = this.loadLocality(locality.children, node);
        return node;
      }
      return { label: locality.name, data: locality.id, children: undefined, parent, selectable: true };
    });
    return list;
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
      const organizationsOffice = result.data;
      return organizationsOffice.map(org => ({
        label: org.name,
        value: org.id
      }));
    }
  }

  async loadUnitMeasuresOffice() {
    const result = await this.unitMeasureSrv.GetAll({ idOffice: this.idOffice });
    if (result.success) {
      const units = result.data;
      return units.map(org => ({
        label: org.name,
        value: org.id
      }));
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