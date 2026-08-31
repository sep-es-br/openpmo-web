import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import {
  PreprojectEvaluationOperation
} from 'src/app/shared/services/preproject-evaluation-config.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { PreprojectCriteriaConfigService } from 'src/app/shared/services/preproject-criteria-config.service';
import { IPreprojectModelConfiguration } from 'src/app/shared/interfaces/IPreprojectModelConfiguration';
import { PreprojectModelService } from 'src/app/shared/services/preproject-model.service';

@Component({
  selector: 'app-preproject-selection',
  templateUrl: './preproject-selection.component.html',
  styleUrls: ['./preproject-selection.component.scss']
})
export class PreprojectSelectionComponent implements OnInit, OnDestroy {

  readonly activationCardProperties: ICard = {
    cardTitle: 'configuration',
    collapseble: false,
    toggleable: true,
    toggleLabel: 'enablePreprojectSelection',
    initialStateCollapse: false,
    initialStateToggle: false,
    onToggle: new EventEmitter<boolean>()
  };

  readonly cardProperties: ICard = {
    cardTitle: 'criteria',
    collapseble: true,
    toggleable: false,
    initialStateCollapse: false,
    initialStateToggle: false
  };

  readonly evaluationCardProperties: ICard = {
    cardTitle: 'evaluation',
    collapseble: false,
    toggleable: false,
    initialStateCollapse: false,
    initialStateToggle: false
  };

  idOffice: number;

  office: IOffice;

  criteriaCardItems: ICardItem[] = [];

  displayModeAll: string = 'grid';

  pageSize: number = 5;

  totalRecords: number = 0;

  responsive: boolean = false;

  selectedEvaluationOperation: PreprojectEvaluationOperation = 'AVERAGE';

  evaluationOperations: SelectItem[] = [];

  preprojectSelectionEnabled: boolean = false;

  preprojectModelId: number;

  readonly configurationForm: FormGroup = new FormGroup({
    enabled: new FormControl(false),
    operation: new FormControl('AVERAGE')
  });

  private savedPreprojectSelectionEnabled: boolean = false;

  private savedEvaluationOperation: PreprojectEvaluationOperation = 'AVERAGE';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly activeRoute: ActivatedRoute,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly configDataViewService: ConfigDataViewService,
    private readonly criteriaConfigService: PreprojectCriteriaConfigService,
    private readonly officeService: OfficeService,
    private readonly preprojectModelService: PreprojectModelService,
    private readonly responsiveService: ResponsiveService,
    private readonly router: Router,
    private readonly translateService: TranslateService
  ) {
    this.configDataViewService.observableDisplayModeAll
      .pipe(takeUntil(this.destroy$))
      .subscribe(displayMode => this.displayModeAll = displayMode);

    this.configDataViewService.observablePageSize
      .pipe(takeUntil(this.destroy$))
      .subscribe(pageSize => this.pageSize = pageSize);

    this.responsiveService.observable
      .pipe(takeUntil(this.destroy$))
      .subscribe(responsive => this.responsive = responsive);

    this.activationCardProperties.onToggle
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => this.handleActivationChange(enabled));
  }

  async ngOnInit(): Promise<void> {
    this.idOffice = Number(this.activeRoute.snapshot.queryParamMap.get('idOffice'));
    this.office = await this.officeService.getCurrentOffice(this.idOffice);
    this.evaluationOperations = [
      { label: this.translateService.instant('average'), value: 'AVERAGE' },
      { label: this.translateService.instant('sum'), value: 'SUM' }
    ];
    await this.loadConfiguration();
    this.loadCriteria();
    this.setBreadcrumb();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleEvaluationOperationChange(operation: PreprojectEvaluationOperation): void {
    this.selectedEvaluationOperation = operation;
    this.markConfigurationAsDirty();
    this.configurationForm.get('operation').setValue(operation);
  }

  async saveConfiguration(): Promise<void> {
    if (!this.preprojectModelId || this.configurationForm.invalid) {
      this.configurationForm.markAllAsTouched();
      return;
    }

    const result = await this.preprojectModelService.updateConfiguration(
      this.preprojectModelId,
      {
        active: this.preprojectSelectionEnabled,
        operation: this.selectedEvaluationOperation
      }
    );
    if (result.success && result.data) {
      this.applyConfiguration(result.data);
      this.configurationForm.markAsPristine();
    }
  }

  undoConfiguration(): void {
    this.preprojectSelectionEnabled = this.savedPreprojectSelectionEnabled;
    this.selectedEvaluationOperation = this.savedEvaluationOperation;
    this.activationCardProperties.initialStateToggle = this.savedPreprojectSelectionEnabled;
    this.configurationForm.reset({
      enabled: this.savedPreprojectSelectionEnabled,
      operation: this.savedEvaluationOperation
    });
  }

  private handleActivationChange(enabled: boolean): void {
    this.preprojectSelectionEnabled = enabled;
    this.markConfigurationAsDirty();
    this.configurationForm.get('enabled').setValue(enabled);
  }

  private markConfigurationAsDirty(): void {
    this.configurationForm.markAsDirty();
  }

  private async loadConfiguration(): Promise<void> {
    const result = await this.preprojectModelService.findOrCreateByOfficeId(this.idOffice);
    if (result.success && result.data) {
      this.applyConfiguration(result.data);
    }
  }

  private applyConfiguration(configuration: IPreprojectModelConfiguration): void {
    this.preprojectModelId = configuration.id;
    this.preprojectSelectionEnabled = configuration.active;
    this.selectedEvaluationOperation = configuration.operation || 'AVERAGE';
    this.savedPreprojectSelectionEnabled = this.preprojectSelectionEnabled;
    this.savedEvaluationOperation = this.selectedEvaluationOperation;
    this.activationCardProperties.initialStateToggle = this.preprojectSelectionEnabled;
    this.configurationForm.reset({
      enabled: this.preprojectSelectionEnabled,
      operation: this.selectedEvaluationOperation
    });
  }

  private loadCriteria(): void {
    const criteria = this.criteriaConfigService.getCriteria(this.idOffice).map(criterion => ({
      typeCardItem: 'listItem',
      iconSvg: criterion.icon === 'fas fa-cog',
      icon: criterion.icon === 'fas fa-cog' ? IconsEnum.Cog : criterion.icon,
      nameCardItem: criterion.name,
      fullNameCardItem: criterion.name,
      itemId: criterion.id,
      idAtributeName: 'criterionId',
      urlCard: '/preproject-selection/criteria/edit',
      paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }],
      menuItems: [
        {
          label: this.translateService.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: () => this.deleteCriterion(criterion.id)
        }
      ] as MenuItem[]
    } as ICardItem));

    const newCriterion: ICardItem = {
      typeCardItem: 'newCardItem',
      iconSvg: true,
      icon: IconsEnum.Plus,
      iconMenuItems: [
        {
          label: this.translateService.instant('new'),
          // icon: 'fas fa-cog',
          command: () => this.createCriterion()
        }
      ]
    };

    this.criteriaCardItems = [...criteria, newCriterion];
    this.totalRecords = this.criteriaCardItems.length;
  }

  private deleteCriterion(id: number): void {
    this.criteriaConfigService.deleteCriterion(this.idOffice, id);
    this.loadCriteria();
  }

  private createCriterion(): void {
    void this.router.navigate(['/preproject-selection/criteria/new'], {
      queryParams: { idOffice: this.idOffice }
    });
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
      }
    ]);
  }
}
