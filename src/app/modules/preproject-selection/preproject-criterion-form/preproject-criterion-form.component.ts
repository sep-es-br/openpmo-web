import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, SelectItem } from 'primeng/api';
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
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import {
  PreprojectCriteriaConfigService,
  PreprojectCriterion,
  PreprojectCriterionOperation
} from 'src/app/shared/services/preproject-criteria-config.service';
import { OfficeService } from 'src/app/shared/services/office.service';

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

  cardProperties: ICard = {
    cardTitle: 'properties',
    collapseble: true,
    toggleable: false,
    initialStateCollapse: false,
    initialStateToggle: false
  };

  readonly operationOptions: SelectItem[] = [];

  groupCardProperties: ICard = {
    cardTitle: '',
    notShowCardTitle: true,
    collapseble: false,
    toggleable: false,
    initialStateCollapse: false,
    initialStateToggle: false
  };

  form: FormGroup;

  icons: CriterionIcon[] = [];

  propertyMenuItems: MenuItem[] = [];

  groupPropertyMenuItems: MenuItem[][] = [];

  idOffice: number;

  criterionId: number | null = null;

  office: IOffice;

  isLoading: boolean = false;

  /** Propriedades do nível raiz do critério */
  rootProperties: IWorkpackModelProperty[] = [];

  /** Propriedades por grupo, indexadas por posição do grupo */
  groupProperties: IWorkpackModelProperty[][] = [];

  private readonly destroy$: Subject<void> = new Subject<void>();

  constructor(
    private readonly activeRoute: ActivatedRoute,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly configDataViewService: ConfigDataViewService,
    private readonly criteriaConfigService: PreprojectCriteriaConfigService,
    private readonly formBuilder: FormBuilder,
    private readonly officeService: OfficeService,
    private readonly router: Router,
    private readonly translateService: TranslateService
  ) {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      position: [2, [Validators.required, Validators.min(2)]],
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
    this.office = await this.officeService.getCurrentOffice(this.idOffice);
    this.loadTranslatedOptions();
    this.loadCriterionForEditing();
    this.setBreadcrumb();

    this.translateService.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadTranslatedOptions());

    this.configDataViewService.observableCollapsePanelsStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe((status: string) => this.updateCardsCollapseStatus(status === 'collapse'));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.criterionId) {
      this.criteriaConfigService.updateCriterion(this.idOffice, this.criterionId, this.form.value);
    } else {
      this.criteriaConfigService.addCriterion(this.idOffice, this.form.value);
    }
    this.back();
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
  }

  trackByProperty(index: number): number {
    return index;
  }

  /**
   * Callback emitido pelo app-property-model quando o usuário altera um campo.
   * Força detecção de mudança nas listas para refletir a atualização na view.
   */
  propertyChanged(event: { property: IWorkpackModelProperty }): void {
    if (event?.property) {
      this.rootProperties = [...this.rootProperties];
      this.groupProperties = this.groupProperties.map((group: IWorkpackModelProperty[]) => [...group]);
      this.form.markAsDirty();
      this.form.updateValueAndValidity();
    }
  }

  /**
   * Remove uma propriedade da lista raiz.
   */
  deleteRootProperty(property: IWorkpackModelProperty): void {
    const index: number = this.rootProperties.indexOf(property);
    if (index >= 0) {
      this.rootProperties = this.rootProperties.filter((p: IWorkpackModelProperty) => p !== property);
      (this.form.get('properties') as FormArray).removeAt(index);
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
    }
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

  private loadCriterionForEditing(): void {
    if (!this.criterionId) {
      return;
    }

    const criterion: PreprojectCriterion | undefined =
      this.criteriaConfigService.getCriterion(this.idOffice, this.criterionId);
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
    this.rootProperties = (criterion.properties || []).map(property => ({ ...property }));
    this.rootProperties.forEach(property => rootPropertiesForm.push(this.formBuilder.control(property)));

    this.groups.clear();
    this.groupProperties = [];
    this.groupPropertyMenuItems = [];
    (criterion.groups || []).forEach(group => {
      const properties = (group.properties || []).map(property => ({ ...property }));
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
    });
  }

  private updateCardsCollapseStatus(collapsed: boolean): void {
    this.cardProperties = {
      ...this.cardProperties,
      initialStateCollapse: collapsed
    };
    this.groupCardProperties = {
      ...this.groupCardProperties,
      initialStateCollapse: collapsed
    };
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
  private addProperty(type: string, groupIndex?: number): void {
    const newProperty: IWorkpackModelProperty = this.buildNewProperty(type, groupIndex);
    this.checkProperty(newProperty);

    if (groupIndex === undefined) {
      this.rootProperties = [...this.rootProperties, newProperty];
      (this.form.get('properties') as FormArray).push(this.formBuilder.control(newProperty));
    } else {
      this.groupProperties[groupIndex] = [...this.groupProperties[groupIndex], newProperty];
      const group: FormGroup = this.groups.at(groupIndex) as FormGroup;
      (group.get('properties') as FormArray).push(this.formBuilder.control(newProperty));
    }
  }

  /**
   * Instancia um IWorkpackModelProperty com os campos base e configurações
   * específicas por tipo (setores para Organization, localidade para Locality).
   */
  private buildNewProperty(type: string, groupIndex?: number): IWorkpackModelProperty {
    const list: IWorkpackModelProperty[] = groupIndex === undefined
      ? this.rootProperties
      : (this.groupProperties[groupIndex] || []);

    return {
      type,
      active: true,
      label: '',
      name: '',
      sortIndex: list.length + 1,
      fullLine: true,
      required: false,
      multipleSelection: false,
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
  private checkProperty(property: IWorkpackModelProperty): void {
    let requiredFields: string[] = ['name', 'label', 'sortIndex'];

    switch (property.type) {
      case TypePropertModelEnum.LocalitySelectionModel:
        requiredFields = [...requiredFields, 'idDomain', 'multipleSelection'];
        break;

      case TypePropertModelEnum.OrganizationSelectionModel:
        requiredFields = [...requiredFields, 'multipleSelection', 'sectors'];
        property.sectors = (property.sectorsList || [])
          .map((sec: string) => sec.toLowerCase())
          .join(',');
        break;

      case TypePropertModelEnum.SelectionModel:
        requiredFields = [...requiredFields, 'possibleValuesOptions', 'multipleSelection'];
        break;

      case TypePropertModelEnum.NumberModel:
        requiredFields = [...requiredFields, 'precision'];
        property.precision = 3;
        break;

      default:
        break;
    }

    property.requiredFields = requiredFields;
    property.viewOnly = false;
    property.obligatory = false;
  }

  private getPropertyTypeLabel(type: string): string {
    if (type === TypePropertModelEnum.LocalitySelectionModel) {
      return this.translateService.instant('locality');
    }
    if (type === TypePropertModelEnum.UnitSelectionModel) {
      return this.translateService.instant('unit');
    }
    if (type === TypePropertModelEnum.SelectionModel) {
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

