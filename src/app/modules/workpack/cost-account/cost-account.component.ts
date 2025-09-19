import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TreeNode } from 'primeng/api';

import { ICard } from 'src/app/shared/interfaces/ICard';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IWorkpack } from 'src/app/shared/interfaces/IWorkpack';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
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
import { CostAccountModelService } from 'src/app/shared/services/cost-account-model.service';
import { ICostAccountModel } from 'src/app/shared/interfaces/ICostAccountModel';
import { IOrganization } from 'src/app/shared/interfaces/IOrganization';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';
import { IBudgetPlan } from 'src/app/shared/interfaces/IBudgetPlan';
import { IBudgetUnit } from 'src/app/shared/interfaces/IBudgetUnit';
import { IInstrument, PentahoService } from 'src/app/shared/services/pentaho.service';
import { resolve } from 'dns';
import { delay, switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { Dropdown } from 'primeng/dropdown';
import { InputNumber } from 'primeng/inputnumber';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'app-cost-account',
  templateUrl: './cost-account.component.html',
  styleUrls: ['./cost-account.component.scss']
})
export class CostAccountComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;
  @ViewChild('uoSelect', {static: true}) uoSelect : Dropdown;
  @ViewChild('startYearField', {static: true}) startYearField : InputNumber;
  @ViewChild('endYearField', {static: true}) endYearField : InputNumber;

  responsive: boolean;
  idWorkpack: number;
  idWorkpackModelLinked: number;
  idPlan: number;
  costAccountModel: ICostAccountModel;
  workpack: IWorkpack;
  idCostAccount: number;
  costAccount: ICostAccount;
  costAccountName: string;
  cardCostAccountProperties: ICard;
  instrumentProperty: ICard;
  sectionCostAccountProperties: PropertyTemplateModel[];
  costAccountProperties: IWorkpackProperty[];
  typePropertyModel = TypePropertyModelEnum;
  idOffice: number;
  editPermission = false;
  oldName: string = null;
  costAccountLimit: number;
  idPlanModel: number;
  organizations: IOrganization[] = [];
  formIsSaving = false;
  backupProperties;
  today = new Date();
  language : string;

  uoOptions: IBudgetUnit[] = [];
  planoOrcamentarioOptions: IBudgetPlan[] = [
    {
      code: null,
      name: null,
      fullName: null,
      displayText: '- Nenhum -'
    }
  ];

  selectedUo: IBudgetUnit;
  selectedPlano: IBudgetPlan; 

  selectedStartYear: number = this.today.getFullYear();
  selectedEndYear: number = this.today.getFullYear();

  selectedInstruments : IInstrument[] = [];

  instrumentsList : IInstrument[];


  newInstrumentFunc = () => {
    this.selectedInstruments.push({} as IInstrument);
    
    if(this.instrumentsChanged()) {
      this.saveButton.showButton();
      this.cancelButton.showButton();
    } else {
      this.saveButton.hideButton();
      this.cancelButton.hideButton();
    }
  };

  removerInstrumentFunc = (item: IInstrument) => {
    
    if(this.selectedInstruments) {
      const index = this.selectedInstruments.indexOf(item);
      if (index !== -1) {
        this.selectedInstruments.splice(index, 1); // remove o item na posição `index`
      }
    }
    
    if(this.instrumentsChanged()) {
      this.saveButton.showButton();
      this.cancelButton.showButton();
    } else {
      this.saveButton.hideButton();
      this.cancelButton.hideButton();
    }

  };

  poDisabled = true;

  backupSelectedUo: any;
  backupSelectedPlano: any;

  constructor(
    private actRouter: ActivatedRoute,
    private authSrv: AuthService,
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
    private router: Router,
    private costAccountModelSrv: CostAccountModelService,
    private pentahoSrv: PentahoService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idCostAccount = queryParams.idCostAccount;
      this.idWorkpack = queryParams.idWorkpack;
      this.idPlan = queryParams.idPlan;
      this.idWorkpackModelLinked = queryParams.idWorkpackModelLinked;
    });
    this.responsiveSrv.observable.subscribe(value => this.responsive = value);
    this.language = this.translateSrv.currentLang;
    
  }

  trackByInstrument = (i: number, item: IInstrument) => {
    return item.sigefesCode;
  }

  get instrumentsOptions() {
    return this.instrumentsList.map(v => v.sigefesCode)
  }

  instrumentWithCodigo(codigo: string | null) {
    return this.instrumentsList.find(i => i.sigefesCode === codigo);
  }

  setInstrumentItem(instrument : IInstrument, index: number) {
    
    if(index >= this.costAccount.instruments.length || instrument.sigefesCode !== this.costAccount.instruments[index].sigefesCode) {
      this.saveButton.showButton(); 
      this.cancelButton.showButton()
    } else {
      this.saveButton.hideButton();
      this.cancelButton.hideButton();
    }
    
    
    Object.assign(this.selectedInstruments[index], instrument); 

  }
  
  instrumentsChanged() {
    // verifica se mudou tamanho
    if (this.selectedInstruments?.length !== this.costAccount.instruments?.length) return true;

    // verifica se algum sigefesCode mudou na mesma posição
    return this.selectedInstruments?.some((selected, i) =>
      selected.sigefesCode !== this.costAccount.instruments[i]?.sigefesCode
    );
  }


  async ngOnInit() {
    this.cardCostAccountProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false,
      isLoading: true
    };

    this.instrumentProperty = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'instruments',
      collapseble: true,
      initialStateCollapse: false,
      isLoading: true
    } as ICard;

    await this.loadProperties();

  }

  async updateInstruments(){
    if(!this.selectedUo?.code || !this.selectedStartYear || !this.selectedEndYear) return;

      this.instrumentsList = await this.pentahoSrv.getInstrumentsOptions(this.idWorkpack, this.selectedUo.code, this.selectedStartYear, this.selectedEndYear, this.selectedPlano?.code).toPromise();

  }


  initializeBackups() {
    this.backupSelectedUo = this.selectedUo;
    this.backupSelectedPlano = this.selectedPlano
  }

  formatSelectedInstrument(instruments : IInstrument[]){
    return instruments?.map(item => `${item?.originalNum}`).join(', ') ;
  }

  loadUoOptions(idWorkpack: number, onFinish?: () => void, codPo? : string): void {
    this.uoOptions = [
      {
        code: null,
        name: null,
        fullName: null,
        displayText: 'Carregando...'
      }]

    this.pentahoSrv.getUoOptions(idWorkpack, codPo).subscribe({
      next: data => {
        this.uoOptions = [
          {
            code: null,
            name: null,
            fullName: null,
            displayText: '- Nenhum -'
          }
        ];

        if(this.selectedUo?.code && !data.some(uo => uo.code === this.selectedUo.code)){
          this.uoOptions.push(this.selectedUo)
        }

        this.uoOptions.push(
          ...data.map(uo => ({
            code: uo.code,
            name: uo.name,
            fullName: uo.fullName,
            displayText: `${uo.code} - ${uo.name} - ${uo.fullName}`
          }))
        );

        if (onFinish) onFinish();
      },
      error: err => {
        console.error('Erro ao obter UO options do Pentaho:', err);
        if (onFinish) onFinish();
      }
    });
  }
  

  onUoChange(event: any) {
    this.cancelButton.showButton();
    this.selectedUo = event.value;

    const uoValue = event.value.code;

    this.pentahoSrv.getPlanoOrcamentarioOptions(uoValue, this.idWorkpack).subscribe(data => {
      this.planoOrcamentarioOptions = [
        {
          code: null,
          name: null,
          fullName: null,
          displayText: '- Nenhum -'
        }
      ];

      if(this.selectedPlano?.code && !data.some(plan => plan.code === this.selectedPlano.code)){
        this.planoOrcamentarioOptions.push(this.selectedPlano)
      }

      this.planoOrcamentarioOptions.push(
        ...data.map(plan => ({
          code: plan.code,
          name: plan.name,
          fullName: plan.fullName,
          displayText: plan.fullName
        }))
      );

      this.poDisabled = data.length === 0;
    });

    this.saveButton.showButton();
    this.updateInstruments();
  }
  

  onPlanoChange(event: any) {
    this.cancelButton.showButton();
    this.selectedPlano = event.value;
    this.saveButton.showButton();
    this.loadUoOptions(this.idWorkpack, undefined, this.selectedPlano.code);
    this.updateInstruments();
  }
  

  async loadProperties() {
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    if (this.idWorkpack) {
      this.loadUoOptions(this.idWorkpack);
      await this.loadWorkpack();
    }
    if (this.idCostAccount) {
      await this.loadCostAccount();
      this.loadUoOptions(this.idCostAccount, () => {
        this.setupUoAndPlano()
      });
    } else {
      this.setBreadcrumb();
      this.cardCostAccountProperties.isLoading = false;
      this.instrumentProperty.isLoading = false;
    }
    const costAccountModelActiveProperties = this.costAccountModel.properties.filter(w => w.active);
    if (costAccountModelActiveProperties && costAccountModelActiveProperties
      .filter(prop => this.typePropertyModel[prop.type] === TypePropertyModelEnum.OrganizationSelectionModel).length > 0) {
      await this.loadOrganizationsOffice();
    }
    this.sectionCostAccountProperties = await Promise.all(costAccountModelActiveProperties.map(p => this.instanceProperty(p)));
    this.backupProperties = this.sectionCostAccountProperties.map( prop => this.instanceBackupProperty(prop));
  }

  setupUoAndPlano() {
    if (!this.costAccount) return;
  
    this.selectedUo = this.uoOptions.find(uo => uo?.code == this.costAccount.unidadeOrcamentaria?.code);
  
    if (this.selectedUo) {
      this.pentahoSrv.getPlanoOrcamentarioOptions(this.selectedUo?.code, this.costAccount.id).subscribe(poData => {
        this.planoOrcamentarioOptions = [
          { 
            code: null, 
            name: null, 
            fullName: null, 
            displayText: '- Nenhum -' 
          }
        ];

        if(this.costAccount.planoOrcamentario?.code && !poData.some(po => po.code === this.costAccount.planoOrcamentario.code)) {
          this.planoOrcamentarioOptions.push({
            ...this.costAccount.planoOrcamentario,
            displayText: this.costAccount.planoOrcamentario.fullName
          })
        }

        this.planoOrcamentarioOptions.push(
          ...poData.map(plan => ({ 
            code: plan.code, 
            name: plan.name, 
            fullName: plan.fullName, 
            displayText: plan.fullName 
          }))
        );
        this.poDisabled = poData.length === 0;
  
        this.selectedPlano = this.planoOrcamentarioOptions.find(plan => plan.code == this.costAccount.planoOrcamentario?.code);
        this.backupSelectedUo = this.selectedUo;
        this.backupSelectedPlano = this.selectedPlano;

      });
      this.updateInstruments()
    }
  }
  

  async loadCardCostAccountProperties() {
    if (this.costAccount) {
      const costAccountTotalValues =
        await this.costAccountSrv.GetCostsByWorkpack({ id: this.costAccount.id, 'id-workpack': this.costAccount.idWorkpack });
      if (costAccountTotalValues.success) {
        this.cardCostAccountProperties = {
          ...this.cardCostAccountProperties,
          progressBarValues: [{
            total: costAccountTotalValues.data.planed,
            progress: costAccountTotalValues.data.actual,
            limit: this.costAccountLimit,
            labelProgress: this.translateSrv.instant('actual'),
            labelTotal: this.translateSrv.instant('planned'),
            color: '#44B39B',
            valueUnit: 'currency',
            barHeight: 17
          }]
        };
        this.cardCostAccountProperties = {
          ...this.cardCostAccountProperties,
          isLoading: false
        };
        return;
      }
    }
    this.cardCostAccountProperties = {
      ...this.cardCostAccountProperties,
      isLoading: false
    };
  }

  async loadWorkpack(onlyBreadcrumb: boolean = false) {
    const workpackData = this.workpackSrv.getWorkpackData();
    if (workpackData && workpackData.workpack && workpackData.workpack.id === this.idWorkpack) {
      this.workpack = workpackData.workpack;
    } else {
      const result = await this.workpackSrv.GetWorkpackById(this.idWorkpack, { 'id-plan': this.idPlan });
      if (result.success) {
        this.workpack = result.data;
      }
    }
    
    this.editPermission = (!!this.workpack.permissions?.find(p => p.level === 'EDIT')
      || await this.authSrv.isUserAdmin()) && !this.workpack.canceled && !this.workpack.endManagementDate;
    const plan = await this.planSrv.getCurrentPlan(this.workpack.plan.id);
    if (plan) {
      this.idOffice = plan.idOffice;
      this.idPlanModel = plan.planModel.id;
    }

    await this.loadCostAccountModel();
  }

  async loadCostAccountModel() {
    const result = await this.costAccountModelSrv.GetCostAccountModelByPlanModel({ 'id-plan-model': this.idPlanModel });
    if (result.success && result.data) {
      this.costAccountModel = result.data;
    }
  }

  async loadCostAccount() {
    const result = await this.costAccountSrv.GetById(this.idCostAccount);
    if (result.success) {
      this.costAccount = result.data;
      this.idWorkpack = this.costAccount.idWorkpack;

      const propertyNameModel = this.costAccount.models.find(p => p.name === 'name');
      const propertyNameCostAccount = this.costAccount.properties.find(p => p.idPropertyModel === propertyNameModel.id);
      this.costAccountName = propertyNameCostAccount.value as string;

      
      await this.loadCardCostAccountProperties();
      this.selectedInstruments = this.costAccount.instruments?.map(item => ({...item})) ?? [];
      this.setBreadcrumb();
    }
  }

  async setBreadcrumb() {
    const breadcrumbItems = await this.getBreadcrumbs();
    this.breadcrumbSrv.setMenu([
      ...breadcrumbItems,
      {
        key: 'account',
        info: this.costAccountName,
      }
    ]);
  }

  async getBreadcrumbs() {
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack
      (this.idWorkpack, { 'id-plan': this.idPlan });
    return success
      ? data.map(p => ({
        key: !p.modelName ? p.type.toLowerCase() : p.modelName,
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: { id: p.id, idWorkpackModelLinked: p.idWorkpackModelLinked, idPlan: this.idPlan },
        modelName: p.modelName
      }))
      : [];
  }

  getRouterLinkFromType(type: string): string[] {
    switch (type) {
      case 'office':
        return ['/offices', 'office'];
      case 'plan':
        return ['plan'];
      default:
        return ['/workpack'];
    }
  }

  async instanceProperty(propertyModel: IWorkpackModelProperty): Promise<PropertyTemplateModel> {
    const property = new PropertyTemplateModel();
    const propertyCostAccount = this.costAccount && this.costAccount.properties.find(cost => cost.idPropertyModel === propertyModel.id);

    property.id = propertyCostAccount && propertyCostAccount.id;
    property.idPropertyModel = propertyModel.id;
    property.type = TypePropertyModelEnum[propertyModel.type];
    property.active = propertyModel.active;
    property.fullLine = propertyModel.fullLine;
    property.label = propertyModel.label;
    property.name = propertyModel.name;
    property.required = propertyModel.required;
    property.disabled = !this.editPermission;
    property.sortIndex = propertyModel.sortIndex;
    property.multipleSelection = propertyModel.multipleSelection;
    property.rows = propertyModel.rows;
    property.decimals = propertyModel.decimals;
    property.helpText = propertyModel.helpText;
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.ToggleModel) {
      property.value = propertyCostAccount && (propertyCostAccount?.value !== null && propertyCostAccount?.value !== undefined) ?
        propertyCostAccount?.value : propertyModel.defaultValue;
    } else {
      property.value = propertyCostAccount?.value ? propertyCostAccount?.value : propertyModel.defaultValue;
    }
    property.value = propertyCostAccount?.value ? propertyCostAccount?.value : propertyModel.defaultValue;
    property.defaultValue = propertyCostAccount?.value ? propertyCostAccount?.value : propertyModel.defaultValue;
    property.min = propertyModel.min;
    property.max = propertyModel.max;
    property.precision = propertyModel.precision;
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.DateModel) {
      const dateValue = propertyCostAccount?.value ?
        propertyCostAccount?.value.toLocaleString() : propertyModel.defaultValue.toLocaleString();
      property.value = new Date(dateValue);
    }
    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.SelectionModel && propertyModel.multipleSelection) {
      const listValues = propertyCostAccount?.value ? propertyCostAccount?.value as string : propertyModel.defaultValue as string;
      property.defaultValue = listValues.length > 0 ? listValues.split(',') : null;
      property.value = listValues.length > 0 ? listValues.split(',') : null;
    }

    if (this.typePropertyModel[propertyModel.type] === TypePropertyModelEnum.SelectionModel) {
      const listOptions = propertyModel.possibleValues ? (propertyModel.possibleValues as string).split(',').sort((a, b) => a.localeCompare(b)) : [];
      property.possibleValues = listOptions.map(op => ({ label: op, value: op }));
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
      const defaultSelectedLocalities = propertyCostAccount?.selectedValues ?
        propertyCostAccount?.selectedValues as number[] : (propertyModel.defaults ? propertyModel.defaults as number[] : undefined);
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
      property.possibleValuesIds = this.organizations.filter(org => propertyModel.sectors && propertyModel.sectors.includes(org.sector.toLowerCase()))
        .map(d => ({ label: d.name, value: d.id }));
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
      this.loadUnitMeasuresOffice().then(unitMeasures => {
        property.possibleValuesIds = unitMeasures;
      });
      property.selectedValue = propertyCostAccount?.selectedValue ? propertyCostAccount?.selectedValue : propertyModel.defaults as number;
      property.defaults = propertyModel.defaults as number;
    }
    if (property.name.toLowerCase() === 'limit') {
      this.costAccountLimit = property.value && Number(property.value) ? Number(property.value) : 0;
    }
    return property;
  }

  instanceBackupProperty(pro: PropertyTemplateModel) {
    const property = new PropertyTemplateModel();
    property.active = pro.active;
    property.id = pro.id;
    property.type = pro.type;
    property.idPropertyModel = pro.idPropertyModel;
    property.fullLine = pro.fullLine;
    property.label = pro.label;
    property.name = pro.name;
    property.required = pro.required;
    property.disabled = pro.disabled;
    property.sortIndex = pro.sortIndex;
    property.defaultValue = pro.defaultValue;
    property.defaults = pro.defaults;
    property.min = pro.min;
    property.max = pro.max;
    property.precision = pro.precision;
    property.possibleValues = pro.possibleValues;
    property.possibleValuesIds = pro.possibleValuesIds;
    property.multipleSelection = pro.multipleSelection;
    property.rows = pro.rows;
    property.decimals = pro.decimals;
    property.localityList = pro.localityList;
    property.idDomain = pro.idDomain;
    property.localitiesSelected = pro.localitiesSelected;
    property.labelButtonLocalitySelected = pro.labelButtonLocalitySelected;
    property.showIconButton = pro.showIconButton;
    property.value = pro.value;
    property.selectedValues = pro.selectedValues;
    property.selectedValue = pro.selectedValue;
    property.invalid = pro.invalid;
    property.message = pro.message;
    property.groupedProperties = pro.groupedProperties;
    property.milestoneData = pro.milestoneData;
    property.reason = pro.reason;
    property.needReason = pro.needReason;
    property.collapsed = pro.collapsed;
    property.dirty = pro.dirty;
    property.helpText = pro.helpText;
    return property;
  }

  async loadDomain(idDomain: number) {
    const result = await this.domainSrv.GetById(idDomain);
    if (result.success) {
      return result.data;
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

  loadSelectedTreeNode(locality: ILocalityList) {
    if (locality.children) {
      return {
        label: locality.name,
        data: locality.id,
        children: locality.children.map(c => this.loadSelectedTreeNode(c))
      };
    }
    return {
      label: locality.name,
      data: locality.id
    };
  }

  async loadOrganizationsOffice() {
    if (this.idOffice) {
      const result = await this.organizationSrv.GetAll({ 'id-office': this.idOffice });
      if (result.success) {
        this.organizations = result.data;
        this.organizations = this.organizations.sort((a, b) => a.name.localeCompare(b.name))
      }
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

  mirrorToFullName(nameProperty) {
    const fullName = this.sectionCostAccountProperties.find((p) => (p.name === 'fullName'));
    if (isNaN(this.idCostAccount) && (nameProperty?.value !== null) && (this.oldName === fullName?.value)) {
      this.sectionCostAccountProperties.forEach((prop) => {
        if (prop.name === 'fullName') {
          prop.value = nameProperty.value;
        }
      });
    }
    this.oldName = nameProperty.value;
  }


  checkProperties(property: PropertyTemplateModel) {
    this.cancelButton.showButton();
    if (property.name === 'name') {
      this.mirrorToFullName(property);
    }
    if (property.name === 'limit') {
      this.cardCostAccountProperties = this.cardCostAccountProperties.progressBarValues ? {
        ...this.cardCostAccountProperties,
        progressBarValues: [{
          ...this.cardCostAccountProperties.progressBarValues[0],
          limit: property.value && Number(property.value) ? Number(property.value) : 0
        }]
      } : {
        ...this.cardCostAccountProperties
      };
    }
    const arePropertiesRequiredValid: boolean = this.sectionCostAccountProperties
      .filter(({ required }) => required)
      .map((prop) => {
        let valid = (prop.value instanceof Array
          ? (prop.value.length > 0)
          : typeof prop.value == 'boolean' || typeof prop.value == 'number'
          || !!prop.value || (prop.value !== null && prop.value !== undefined));
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
        if (property.idPropertyModel === prop.idPropertyModel) {
          prop.invalid = !valid;
          prop.message = valid ? '' : this.translateSrv.instant('required');
        }
        return valid;
      })
      .reduce((a, b) => a ? b : a, true);

    const arePropertiesStringValid: boolean = this.sectionCostAccountProperties
      .filter(({ min, max, value }) => ((min || max) && typeof value == 'string'))
      .map((prop) => {
        let valid = true;
        valid = (prop.min && prop.required) || (prop.min && prop.value && String(prop.value).length > 0)  ? String(prop.value).length >= prop.min : true;
        if (property.idPropertyModel === prop.idPropertyModel) {
          prop.invalid = !valid;
          prop.message = !valid ? prop.message = this.translateSrv.instant('minLenght') : '';
        }
        if (valid) {
          valid = prop.max ? (!prop.required ? String(prop.value).length <= prop.max
            : String(prop.value).length <= prop.max && String(prop.value).length > 0) : true;
          if (property.idPropertyModel === prop.idPropertyModel) {
            prop.invalid = !valid;
            prop.message = !valid ? (String(prop.value).length > 0 ? prop.message = this.translateSrv.instant('maxLength', { max: prop.max })
              : prop.message = this.translateSrv.instant('required')) : '';
          }
        }
        return valid;
      })
      .reduce((a, b) => a ? b : a, true);
    return (arePropertiesRequiredValid && arePropertiesStringValid) ? this.saveButton?.showButton() : this.saveButton?.hideButton();
  }

  async saveCostAccount() {

    this.cancelButton.hideButton();
    this.costAccountProperties = this.sectionCostAccountProperties.map(p => p.getValues());
    if (this.sectionCostAccountProperties.filter(p => p.invalid).length > 0) {
      return;
    }

    this.formIsSaving = true;
    if (this.idCostAccount) {
      const costAccount = {
        id: this.idCostAccount,
        idWorkpack: this.costAccount.idWorkpack,
        idCostAccountModel: this.costAccount.idCostAccountModel,
        properties: this.costAccountProperties,
        unidadeOrcamentaria: this.selectedUo ? this.selectedUo : null,
        planoOrcamentario: this.selectedPlano ? this.selectedPlano : null,
        instruments: this.selectedInstruments.map(si => this.instrumentsList.find(fi => fi.sigefesCode === si.sigefesCode)) ?? []
      };
      const result = await this.costAccountSrv.put(costAccount);
      this.formIsSaving = false;
      if (result.success) {
        this.router.navigate(['/workpack'],
          {
            queryParams: {
              id: this.idWorkpack,
              idWorkpackModelLinked: this.idWorkpackModelLinked,
              idPlan: this.idPlan
            }
          }
        );
      }
    }
    if (!this.idCostAccount) {
      const costAccount = {
        idWorkpack: this.idWorkpack,
        idCostAccountModel: this.costAccountModel.id,
        properties: this.costAccountProperties,
        unidadeOrcamentaria: this.selectedUo ? this.selectedUo : null,
        planoOrcamentario: this.selectedPlano ? this.selectedPlano : null,
        instruments: this.selectedInstruments ?? []
      };
      const result = await this.costAccountSrv.post(costAccount);
      this.formIsSaving = false;
      if (result.success) {
        this.router.navigate(['/workpack'],
          {
            queryParams: {
              id: this.idWorkpack,
              idWorkpackModelLinked: this.idWorkpackModelLinked,
              idPlan: this.idPlan
            }
          }
        );
      }
    }
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    this.sectionCostAccountProperties = this.backupProperties.map( prop => this.instanceBackupProperty(prop));
    this.selectedPlano = this.backupSelectedPlano;
    this.selectedUo = this.backupSelectedUo;
  }

}
