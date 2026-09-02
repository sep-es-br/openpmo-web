import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, SelectItem, TreeNode } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  IconsRegularEng,
  IconsRegularPt,
  IconsSolidEng,
  IconsSolidPt
} from 'src/app/shared/font-awesome-icons-constants';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { IconPropertyWorkpackModelEnum } from 'src/app/shared/enums/IconPropertyWorkpackModelEnum';
import { TypePropertModelEnum } from 'src/app/shared/enums/TypePropertModelEnum';
import { TypeOrganization } from 'src/app/shared/enums/TypeOrganization';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import {
  PreprojectCriteriaConfigService,
  PreprojectCriterion,
  PreprojectCriterionOperation
} from 'src/app/shared/services/preproject-criteria-config.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { DomainService } from 'src/app/shared/services/domain.service';
import { LocalityService } from 'src/app/shared/services/locality.service';
import { MeasureUnitService } from 'src/app/shared/services/measure-unit.service';
import { OrganizationService } from 'src/app/shared/services/organization.service';
import { ILocalityList } from 'src/app/shared/interfaces/ILocality';
import { IOrganization } from 'src/app/shared/interfaces/IOrganization';

interface CriterionIcon {
  name: string;
  label: string;
}

@Component({
  selector: 'app-preproject-criterion-form',
  templateUrl: './preproject-criterion-form.component.html',
  styleUrls: ['./preproject-criterion-form.component.scss']
})
export class PreprojectCriterionFormComponent implements OnInit, OnDestroy {

  @ViewChild('saveButton') saveButton: SaveButtonComponent;

  @ViewChild('cancelButton') cancelButton: CancelButtonComponent;

  cardProperties: ICard = {
    cardTitle: 'properties',
    collapseble: true,
    toggleable: false,
    initialStateCollapse: false,
    initialStateToggle: false
  };

  readonly operationOptions: SelectItem[] = [];

  form: FormGroup;

  icons: CriterionIcon[] = [];

  propertyMenuItems: MenuItem[] = [];

  groupPropertyMenuItems: MenuItem[][] = [];

  idOffice: number;

  criterionId: number | null = null;

  office: IOffice;

  isLoading: boolean = false;

  listDomains: SelectItem[] = [];

  listOrganizations: IOrganization[] = [];

  listMeasureUnits: SelectItem[] = [];

  /** Propriedades do nível raiz do critério */
  rootProperties: IWorkpackModelProperty[] = [];

  /** Propriedades por grupo, indexadas por posição do grupo */
  groupProperties: IWorkpackModelProperty[][] = [];

  private readonly destroy$: Subject<void> = new Subject<void>();

  constructor(
    private readonly activeRoute: ActivatedRoute,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly criteriaConfigService: PreprojectCriteriaConfigService,
    private readonly formBuilder: FormBuilder,
    private readonly domainService: DomainService,
    private readonly localityService: LocalityService,
    private readonly measureUnitService: MeasureUnitService,
    private readonly officeService: OfficeService,
    private readonly organizationService: OrganizationService,
    private readonly router: Router,
    private readonly translateService: TranslateService
  ) {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      position: [1, [Validators.required, Validators.min(1)]],
      icon: ['fas fa-cog', Validators.required],
      weight: [1, [Validators.required, Validators.min(1)]],
      operation: ['SUM' as PreprojectCriterionOperation, Validators.required],
      properties: this.formBuilder.array([]),
      groups: this.formBuilder.array([])
    });
  }

  async ngOnInit(): Promise<void> {
    this.idOffice = Number(this.activeRoute.snapshot.queryParamMap.get('idOffice'));
    const criterionId: number = Number(this.activeRoute.snapshot.queryParamMap.get('criterionId'));
    this.criterionId = Number.isFinite(criterionId) && criterionId > 0 ? criterionId : null;
    this.cardProperties.initialStateCollapse = false;
    this.office = await this.officeService.getCurrentOffice(this.idOffice);
    this.loadTranslatedOptions();
    await this.loadCriterionForEditing();
    this.setBreadcrumb();

    this.translateService.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadTranslatedOptions());

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      if (this.criterionId) {
        await this.criteriaConfigService.updateCriterion(this.idOffice, this.criterionId, this.form.value);
      } else {
        await this.criteriaConfigService.addCriterion(this.idOffice, this.form.value);
      }
      this.form.markAsPristine();
      this.back();
    } catch {
      this.saveButton?.showButton();
      this.cancelButton?.showButton();
    }
  }

  back(): void {
    void this.router.navigate(['/preproject-selection'], {
      queryParams: { idOffice: this.idOffice }
    });
  }

  get groups(): FormArray {
    return this.form.get('groups') as FormArray;
  }

  addGroup(): void {
    const groupIndex: number = this.groups.length;

    this.groups.push(this.formBuilder.group({
      title: [`${this.translateService.instant('group')} ${groupIndex + 1}`, Validators.required],
      sortIndex: [groupIndex + 1, [Validators.required, Validators.min(1)]],
      weight: [1, [Validators.required, Validators.min(1)]],
      operation: ['SUM' as PreprojectCriterionOperation, Validators.required],
      enablementKey: [false],
      disabledValue: [''],
      legend: [''],
      properties: this.formBuilder.array([])
    }));

    this.groupPropertyMenuItems.push(this.createPropertyMenuItems(groupIndex));
    this.groupProperties.push([]);
    this.markFormChanged();
  }

  trackByProperty(index: number): number {
    return index;
  }

  /**
   * Callback emitido pelo app-property-model quando o usuário altera um campo.
   * Força detecção de mudança nas listas para refletir a atualização na view.
   */
  async propertyChanged(event: { property: IWorkpackModelProperty; domainChanged?: boolean; multipleSelectedChanged?: boolean; sectorChanged?: boolean }): Promise<void> {
    if (event?.property) {
      if (event.property.type === TypePropertModelEnum.LocalitySelectionModel && event.property.idDomain) {
        if (event.domainChanged || event.multipleSelectedChanged) {
          event.property.extraList = await this.getListLocalities(
            event.property.idDomain,
            !!event.property.multipleSelection
          );
          event.property.extraListDefaults = undefined;
          event.property.defaults = [];
          event.property.selectedLocalities = this.translateService.instant('selectDefaultValue');
          event.property.showIconButtonSelectLocality = true;
        } else {
          const selectedNodes: TreeNode[] = Array.isArray(event.property.extraListDefaults)
            ? event.property.extraListDefaults
            : event.property.extraListDefaults ? [event.property.extraListDefaults] : [];
          const validNodes: TreeNode[] = selectedNodes
            .filter((node: TreeNode) => node.data && !String(node.data).includes('SELECTALL'));
          event.property.defaults = validNodes.map((node: TreeNode) => node.data);
          event.property.selectedLocalities = validNodes.length > 1
            ? `${validNodes.length} ${this.translateService.instant('selectedsLocalities')}`
            : validNodes[0]?.label || this.translateService.instant('selectDefaultValue');
          event.property.showIconButtonSelectLocality = validNodes.length === 0;
        }
      }

      if (event.property.type === TypePropertModelEnum.OrganizationSelectionModel && event.sectorChanged) {
        event.property.sectors = (event.property.sectorsList || [])
          .map((sector: string) => sector.toLowerCase())
          .join(',');
        event.property.list = await this.getListOrganizations(event.property.sectorsList || []);
        event.property.defaults = [];
      }

      this.rootProperties = [...this.rootProperties];
      this.groupProperties = this.groupProperties.map((group: IWorkpackModelProperty[]) => [...group]);
    }
    this.markFormChanged();
  }

  /**
   * Remove uma propriedade da lista raiz.
   */
  deleteRootProperty(property: IWorkpackModelProperty): void {
    const index: number = this.rootProperties.indexOf(property);
    if (index >= 0) {
      this.rootProperties = this.rootProperties.filter((p: IWorkpackModelProperty) => p !== property);
      (this.form.get('properties') as FormArray).removeAt(index);
      this.markFormChanged();
    }
  }

  /**
   * Remove uma propriedade da lista de um grupo específico.
   */
  deleteGroupProperty(property: IWorkpackModelProperty, groupIndex: number): void {
    const index: number = this.groupProperties[groupIndex].indexOf(property);
    if (index >= 0) {
      this.groupProperties[groupIndex] = this.groupProperties[groupIndex]
        .filter((p: IWorkpackModelProperty) => p !== property);
      const group: FormGroup = this.groups.at(groupIndex) as FormGroup;
      (group.get('properties') as FormArray).removeAt(index);
      this.markFormChanged();
    }
  }

  deleteGroup(groupIndex: number): void {
    if (groupIndex < 0 || groupIndex >= this.groups.length) {
      return;
    }

    this.groups.removeAt(groupIndex);
    this.groupProperties.splice(groupIndex, 1);
    this.groupPropertyMenuItems.splice(groupIndex, 1);
    this.markFormChanged();
  }

  private loadTranslatedOptions(): void {
    const currentLanguage: string = this.translateService.currentLang || 'pt-BR';
    const regularLabels: string[] = currentLanguage === 'pt-BR' ? IconsRegularPt : IconsRegularEng;
    const solidLabels: string[] = currentLanguage === 'pt-BR' ? IconsSolidPt : IconsSolidEng;

    this.icons = [
      ...regularLabels.map((label: string, index: number) => ({
        name: `far fa-${IconsRegularEng[index]}`,
        label: label.replace(/-/g, ' ')
      })),
      ...solidLabels.map((label: string, index: number) => ({
        name: `fas fa-${IconsSolidEng[index]}`,
        label: label.replace(/-/g, ' ')
      }))
    ];

    this.operationOptions.splice(0, this.operationOptions.length,
      { label: this.translateService.instant('average'), value: 'AVERAGE' },
      { label: this.translateService.instant('sum'), value: 'SUM' }
    );

    this.propertyMenuItems = this.createPropertyMenuItems();
    this.groupPropertyMenuItems = this.groupPropertyMenuItems
      .map((_: MenuItem[], groupIndex: number) => this.createPropertyMenuItems(groupIndex));
  }

  private async loadCriterionForEditing(): Promise<void> {
    if (!this.criterionId) {
      return;
    }

    const criterion: PreprojectCriterion | undefined =
      await this.criteriaConfigService.getCriterion(this.idOffice, this.criterionId);
    console.log('CRITERION LOADED FROM API:', criterion);
    if (!criterion) {
      return;
    }

    this.form.patchValue({
      name: criterion.name,
      position: criterion.position,
      icon: criterion.icon,
      weight: criterion.weight,
      operation: criterion.operation
    });

    const rootPropertiesForm: FormArray = this.form.get('properties') as FormArray;
    rootPropertiesForm.clear();
    this.rootProperties = await Promise.all((criterion.properties || [])
      .map(property => this.prepareProperty({ ...property, isCollapsed: true })));
    this.rootProperties.forEach(property => rootPropertiesForm.push(this.formBuilder.control(property)));

    this.groups.clear();
    this.groupProperties = [];
    this.groupPropertyMenuItems = [];
    for (const group of (criterion.groups || [])) {
      const properties = await Promise.all((group.properties || [])
        .map(property => this.prepareProperty({ ...property, isCollapsed: true })));
      this.groups.push(this.formBuilder.group({
        title: [group.title, Validators.required],
        sortIndex: [group.sortIndex, [Validators.required, Validators.min(1)]],
        weight: [group.weight, [Validators.required, Validators.min(1)]],
        operation: [group.operation, Validators.required],
        enablementKey: [group.enablementKey],
        disabledValue: [group.disabledValue],
        legend: [group.legend],
        properties: this.formBuilder.array(properties.map(property => this.formBuilder.control(property)))
      }));
      this.groupProperties.push(properties);
      this.groupPropertyMenuItems.push(this.createPropertyMenuItems(this.groups.length - 1));
    }
  }

  private createPropertyMenuItems(groupIndex?: number): MenuItem[] {
    const propertyTypes: string[] = [
      TypePropertModelEnum.CurrencyModel,
      TypePropertModelEnum.DateModel,
      TypePropertModelEnum.IntegerModel,
      TypePropertModelEnum.LocalitySelectionModel,
      TypePropertModelEnum.NumberModel,
      TypePropertModelEnum.OrganizationSelectionModel,
      TypePropertModelEnum.SelectionModel,
      TypePropertModelEnum.CriteriaSelectionModel,
      TypePropertModelEnum.TextModel,
      TypePropertModelEnum.TextAreaModel,
      TypePropertModelEnum.UnitSelectionModel,
      TypePropertModelEnum.ChallengeListModel,
      TypePropertModelEnum.SdgListModel,
      TypePropertModelEnum.ToggleModel
    ];

    return propertyTypes.map((type: string) => ({
      label: this.getPropertyTypeLabel(type),
      icon: this.getPropertyTypeIcon(type),
      command: () => this.addProperty(type, groupIndex)
    }));
  }

  /**
   * Cria e adiciona um IWorkpackModelProperty completo ao nível raiz ou a um grupo,
   * seguindo o mesmo fluxo do workpack-model: instancia, prepara com checkProperty()
   * e empurra tanto na lista de renderização quanto no FormArray de persistência.
   */
  private async addProperty(type: string, groupIndex?: number): Promise<void> {
    const newProperty: IWorkpackModelProperty = this.buildNewProperty(type, groupIndex);
    await this.checkProperty(newProperty);

    if (groupIndex === undefined) {
      this.rootProperties = [...this.rootProperties, newProperty];
      (this.form.get('properties') as FormArray).push(this.formBuilder.control(newProperty));
    } else {
      this.groupProperties[groupIndex] = [...this.groupProperties[groupIndex], newProperty];
      const group: FormGroup = this.groups.at(groupIndex) as FormGroup;
      (group.get('properties') as FormArray).push(this.formBuilder.control(newProperty));
    }
    this.markFormChanged();
  }

  private markFormChanged(): void {
    this.form.markAsDirty();
    this.form.updateValueAndValidity();
    this.saveButton?.showButton();
    this.cancelButton?.showButton();
  }

  /**
   * Instancia um IWorkpackModelProperty com os campos base e configurações
   * específicas por tipo (setores para Organization, localidade para Locality).
   */
  private buildNewProperty(
    type: string,
    groupIndex?: number
  ): IWorkpackModelProperty {
    const list: IWorkpackModelProperty[] = groupIndex === undefined
      ? this.rootProperties
      : (this.groupProperties[groupIndex] || []);

    return {
      type,
      active: true,
      label: '',
      name: this.getFixedPropertyName(type),
      sortIndex: list.length + 1,
      fullLine: true,
      required: false,
      multipleSelection: type === TypePropertModelEnum.CriteriaSelectionModel,
      disableMultipleSelection: false,
      possibleValuesOptions: type === TypePropertModelEnum.SelectionModel ? [] : undefined,
      possibleValuesDetails: type === TypePropertModelEnum.CriteriaSelectionModel ? [] : undefined,
      weight: ([
        TypePropertModelEnum.CriteriaSelectionModel,
        TypePropertModelEnum.ChallengeListModel,
        TypePropertModelEnum.SdgListModel
      ] as string[]).includes(type) ? 1 : undefined,
      itemValue: ([TypePropertModelEnum.ChallengeListModel, TypePropertModelEnum.SdgListModel] as string[])
        .includes(type) ? 1 : undefined,
      defaultValue: type === TypePropertModelEnum.SelectionModel
        ? ''
        : type === TypePropertModelEnum.CriteriaSelectionModel
          ? []
          : undefined,
      isCollapsed: false,
      sectorsList: type === TypePropertModelEnum.OrganizationSelectionModel
        ? [
          TypeOrganization.Private.toUpperCase(),
          TypeOrganization.Public.toUpperCase(),
          TypeOrganization.Third.toUpperCase()
        ]
        : [],
      selectedLocalities: type === TypePropertModelEnum.LocalitySelectionModel
        ? this.translateService.instant('selectDefaultValue')
        : undefined,
      showIconButtonSelectLocality: type === TypePropertModelEnum.LocalitySelectionModel
    };
  }

  /**
   * Prepara campos obrigatórios e valores iniciais específicos por tipo,
   * replicando a lógica do checkProperty() do workpack-model.
   */
  private async checkProperty(property: IWorkpackModelProperty): Promise<void> {
    let requiredFields: string[] = ['name', 'label', 'sortIndex'];
    let list: SelectItem[] = [];

    switch (property.type) {
      case TypePropertModelEnum.LocalitySelectionModel:
        requiredFields = [...requiredFields, 'idDomain', 'multipleSelection'];
        list = await this.getListDomains();
        break;

      case TypePropertModelEnum.OrganizationSelectionModel:
        requiredFields = [...requiredFields, 'multipleSelection', 'sectors'];
        property.sectors = (property.sectorsList || [])
          .map((sec: string) => sec.toLowerCase())
          .join(',');
        list = await this.getListOrganizations(property.sectorsList || []);
        break;

      case TypePropertModelEnum.UnitSelectionModel:
        list = await this.getListMeasureUnits();
        break;

      case TypePropertModelEnum.SelectionModel:
        requiredFields = [...requiredFields, 'possibleValuesOptions', 'multipleSelection'];
        break;

      case TypePropertModelEnum.CriteriaSelectionModel:
        requiredFields = [...requiredFields, 'possibleValuesDetails', 'weight'];
        break;

      case TypePropertModelEnum.ChallengeListModel:
      case TypePropertModelEnum.SdgListModel:
        requiredFields = [...requiredFields, 'weight', 'itemValue'];
        break;

      case TypePropertModelEnum.NumberModel:
        requiredFields = [...requiredFields, 'precision'];
        property.precision = 3;
        break;

      default:
        break;
    }

    property.requiredFields = requiredFields;
    property.list = list;
    property.viewOnly = false;
    property.obligatory = false;
  }

  get integrationSectorOptions(): SelectItem[] {
    const integrations: string[] = Array.from(new Set(
      this.listOrganizations
        .map((organization: IOrganization) => organization.integration)
        .filter((integration: string | undefined): integration is string => !!integration)
        .map((integration: string) => integration.toUpperCase())
    ));
    return integrations.map((integration: string) => ({ label: integration, value: integration }));
  }

  private async prepareProperty(property: IWorkpackModelProperty): Promise<IWorkpackModelProperty> {
    if (property.sectors) {
      property.sectorsList = property.sectors
        .split(',')
        .filter((sector: string) => !!sector)
        .map((sector: string) => sector.toUpperCase());
    }
    if (property.type === TypePropertModelEnum.DateModel && property.defaultValue) {
      property.defaultValue = new Date(property.defaultValue as any);
    }

    await this.checkProperty(property);

    if (property.type === TypePropertModelEnum.LocalitySelectionModel && property.idDomain) {
      const defaultLocalityIds: number[] = Array.isArray(property.defaults)
        ? property.defaults
        : property.defaults ? [property.defaults] : [];
      property.extraList = await this.getListLocalities(property.idDomain, !!property.multipleSelection);
      property.extraListDefaults = this.getSelectedLocalities(defaultLocalityIds, property.extraList);
      const selectedLocalityNodes: TreeNode[] = property.extraListDefaults as TreeNode[];
      if (!property.multipleSelection) {
        property.extraListDefaults = selectedLocalityNodes[0];
      }
      const selectedCount: number = defaultLocalityIds.length;
      property.selectedLocalities = selectedCount > 1
        ? `${selectedCount} ${this.translateService.instant('selectedsLocalities')}`
        : selectedLocalityNodes[0]?.label || this.translateService.instant('selectDefaultValue');
      property.showIconButtonSelectLocality = selectedCount === 0;
    }
    return property;
  }

  private async getListDomains(): Promise<SelectItem[]> {
    if (!this.listDomains.length) {
      const response = await this.domainService.GetAll();
      if (response.success) {
        this.listDomains = response.data.map(domain => ({ label: domain.name, value: domain.id }));
      }
    }
    return this.listDomains;
  }

  private async getListOrganizations(sectors: string[]): Promise<SelectItem[]> {
    if (!this.listOrganizations.length) {
      const response = await this.organizationService.GetAll({ 'id-office': this.idOffice });
      if (response.success) {
        this.listOrganizations = [...response.data]
          .sort((first: IOrganization, second: IOrganization) => first.name.localeCompare(second.name));
      }
    }
    const normalizedSectors: string[] = (sectors || []).map((sector: string) => sector.toUpperCase());
    return this.listOrganizations
      .filter((organization: IOrganization) =>
        normalizedSectors.includes((organization.sector || '').toUpperCase())
        || normalizedSectors.includes((organization.integration || '').toUpperCase()))
      .map((organization: IOrganization) => ({
        label: organization.suffix ? `${organization.name} - ${organization.suffix}` : organization.name,
        value: organization.id
      }));
  }

  private async getListMeasureUnits(): Promise<SelectItem[]> {
    if (!this.listMeasureUnits.length) {
      const response = await this.measureUnitService.GetAll({ idOffice: this.idOffice });
      if (response.success) {
        this.listMeasureUnits = response.data
          .map(unit => ({ label: unit.name, value: unit.id }))
          .sort((first, second) => first.label.localeCompare(second.label));
      }
    }
    return this.listMeasureUnits;
  }

  private async getListLocalities(idDomain: number, multipleSelection: boolean): Promise<TreeNode[]> {
    const localities: ILocalityList[] = await this.localityService
      .getLocalitiesTreeFromDomain({ 'id-domain': idDomain });
    if (!localities?.length) {
      return [];
    }
    const root: ILocalityList = localities[0];
    return [{
      label: root.name,
      data: root.id,
      selectable: true,
      children: this.toLocalityTree(root.children || [], multipleSelection)
    }];
  }

  private toLocalityTree(localities: ILocalityList[], multipleSelection: boolean): TreeNode[] {
    const nodes: TreeNode[] = (localities || [])
      .map((locality: ILocalityList) => ({
        label: locality.name,
        data: locality.id,
        selectable: true,
        children: locality.children?.length
          ? this.toLocalityTree(locality.children, multipleSelection)
          : undefined
      }))
      .sort((first: TreeNode, second: TreeNode) => (first.label || '').localeCompare(second.label || ''));
    if (multipleSelection && nodes.length) {
      nodes.unshift({
        label: this.translateService.instant('selectAll'),
        key: `SELECTALL${nodes[0].data}`,
        data: `SELECTALL${nodes[0].data}`,
        selectable: true,
        styleClass: 'green-node'
      });
    }
    return nodes;
  }

  private getSelectedLocalities(ids: number[] = [], nodes: TreeNode[] = []): TreeNode[] {
    return nodes.reduce((selected: TreeNode[], node: TreeNode) => [
      ...selected,
      ...(ids.includes(node.data) ? [node] : []),
      ...this.getSelectedLocalities(ids, node.children || [])
    ], []);
  }

  private getPropertyTypeLabel(type: string): string {
    if (type === TypePropertModelEnum.LocalitySelectionModel) {
      return this.translateService.instant('locality');
    }
    if (type === TypePropertModelEnum.UnitSelectionModel) {
      return this.translateService.instant('unit');
    }
    if (type === TypePropertModelEnum.SelectionModel) {
      return this.translateService.instant('labels.SelectionModel');
    }
    if (type === TypePropertModelEnum.CriteriaSelectionModel) {
      return this.translateService.instant('multipleValueSelection');
    }
    if (type === TypePropertModelEnum.ChallengeListModel) {
      return this.translateService.instant('challengeList');
    }
    if (type === TypePropertModelEnum.SdgListModel) {
      return this.translateService.instant('sdgList');
    }
    return this.translateService.instant(`labels.${type}`);
  }

  private getFixedPropertyName(type: string): string {
    if (type === TypePropertModelEnum.ChallengeListModel) {
      return this.translateService.instant('challengeList');
    }
    if (type === TypePropertModelEnum.SdgListModel) {
      return this.translateService.instant('sdgList');
    }
    return '';
  }

  private getPropertyTypeIcon(type: string): string {
    if (type === TypePropertModelEnum.ChallengeListModel) {
      return 'fas fa-bars';
    }
    if (type === TypePropertModelEnum.SdgListModel) {
      return 'fas fa-bullseye';
    }
    return IconPropertyWorkpackModelEnum[type] || 'fas fa-list';
  }

  private setBreadcrumb(): void {
    this.breadcrumbService.setMenu([
      {
        key: 'officeConfiguration',
        info: this.office?.name,
        tooltip: this.office?.fullName,
        routerLink: ['/configuration-office'],
        queryParams: { idOffice: this.idOffice },
        admin: true
      },
      {
        key: 'configuration',
        info: 'preprojectSelection',
        tooltip: 'preprojectSelection',
        routerLink: ['/preproject-selection'],
        queryParams: { idOffice: this.idOffice },
        admin: true,
        showInfo: true
      },
      {
        key: 'criteria',
        admin: true
      }
    ]);
  }

}

