import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IObligation, IObligationCreate, IObligationManagementUnit } from 'src/app/shared/interfaces/IObligation';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ObligationsService } from 'src/app/shared/services/obligations.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';

@Component({ selector: 'app-obligation', templateUrl: './obligation.component.html', styleUrls: ['./obligation.component.scss'] })
export class ObligationComponent implements OnInit, OnDestroy {
  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;
  responsive = false;
  idObligation: number;
  idWorkpack: number;
  idPlan: number;
  editPermission = false;
  isLoading = false;
  formIsSaving = false;
  cardObligationProperties: ICard;
  formObligation: FormGroup;
  obligation: IObligation;
  yearOptions = [];
  managementUnitOptions = [];
  processOptions = [];
  processSearchCompleted = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private obligationsSrv: ObligationsService,
    private authSrv: AuthService,
    private workpackSrv: WorkpackService,
    private location: Location
  ) {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.idObligation = params.idObligation ? Number(params.idObligation) : undefined;
      this.idWorkpack = params.idWorkpack ? Number(params.idWorkpack) : undefined;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.destroy$)).subscribe(value => this.responsive = value);
    this.formObligation = this.formBuilder.group({
      year: [null],
      managementUnit: [{ value: null, disabled: true }],
      process: [{ value: null, disabled: true }, Validators.required],
      description: [''],
      supplierCnpj: [''],
      amount: [''],
      protocol: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    this.cardObligationProperties = { toggleable: false, initialStateToggle: false, cardTitle: 'obligation', collapseble: true, initialStateCollapse: false };
    this.isLoading = true;
    await this.loadPermissions();
    if (this.idObligation) await this.loadObligation();
    else {
      await this.loadYears();
      this.isLoading = false;
      this.updateFilterControls();
    }
    await this.setBreadcrumb();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private async loadYears(): Promise<void> {
    const result = await this.obligationsSrv.getProviderYears();
    this.yearOptions = result.success ? result.data.sort((a, b) => b - a).map(value => ({ label: String(value), value })) : [];
  }

  async handleYearChange(): Promise<void> {
    this.managementUnitOptions = [];
    this.clearProcess();
    this.formObligation.patchValue({ managementUnit: null }, { emitEvent: false });
    this.updateFilterControls();
    const year = this.formObligation.controls.year.value;
    if (!year) return;
    const result = await this.obligationsSrv.getProviderManagementUnits(year);
    this.managementUnitOptions = result.success
      ? result.data.sort((a, b) => a.name.localeCompare(b.name)).map(data => ({ label: data.name, value: data.code, data }))
      : [];
    this.updateFilterControls();
  }

  async handleManagementUnitChange(): Promise<void> {
    this.clearProcess();
    this.updateFilterControls();
    const year = this.formObligation.controls.year.value;
    const selected = this.managementUnitOptions.find(option => option.value === this.formObligation.controls.managementUnit.value);
    if (!year || !selected) return;
    const result = await this.obligationsSrv.getProviderProcesses(year, selected.data as IObligationManagementUnit);
    this.processOptions = result.success
      ? result.data.sort((a, b) => String(b.processId).localeCompare(String(a.processId))).map(data => ({
          label: [data.processId, data.description].filter(Boolean).join(' - ').toUpperCase(),
          value: data.processId,
          data
        }))
      : [];
    this.processSearchCompleted = true;
    this.updateFilterControls();
  }

  async handleProcessChange(event): Promise<void> {
    this.clearDetails();
    if (!event.value) { this.saveButton?.hideButton(); return; }
    const unitCode = this.formObligation.controls.managementUnit.value;
    const result = await this.obligationsSrv.getProviderProcess(event.value, unitCode);
    const selected = this.processOptions.find(option => option.value === event.value);
    const data = result.success ? result.data : selected?.data;
    if (selected) selected.data = data;
    this.patchDetails(data);
    this.saveButton?.showButton();
    this.cancelButton?.showButton();
  }

  private clearProcess(): void {
    this.processOptions = [];
    this.processSearchCompleted = false;
    this.formObligation.patchValue({ process: null }, { emitEvent: false });
    this.clearDetails();
    this.saveButton?.hideButton();
    this.cancelButton?.hideButton();
  }

  private clearDetails(): void {
    this.formObligation.patchValue({ description: '', supplierCnpj: '', amount: '', protocol: '' }, { emitEvent: false });
  }

  private patchDetails(data: IObligation): void {
    this.formObligation.patchValue({
      description: data?.description || '', supplierCnpj: data?.supplierCnpj || '', amount: data?.amount || '', protocol: data?.protocol || data?.processNumber || ''
    }, { emitEvent: false });
  }

  private updateFilterControls(): void {
    if (!this.editPermission || this.idObligation) return;
    const unit = this.formObligation.controls.managementUnit;
    const process = this.formObligation.controls.process;
    if (this.formObligation.controls.year.value && this.managementUnitOptions.length) unit.enable({ emitEvent: false });
    else unit.disable({ emitEvent: false });
    if (unit.value && this.processOptions.length) process.enable({ emitEvent: false });
    else process.disable({ emitEvent: false });
  }

  private async loadObligation(): Promise<void> {
    const result = await this.obligationsSrv.GetById(this.idObligation);
    if (result.success) {
      this.obligation = result.data;
      this.formObligation.patchValue({ process: result.data.obligationNumber, ...result.data });
      this.formObligation.disable();
    }
    this.isLoading = false;
  }

  async saveObligation(): Promise<void> {
    const selected = this.processOptions.find(option => option.value === this.formObligation.controls.process.value);
    if (!selected) return;
    this.formIsSaving = true;
    const sender: IObligationCreate = {
      idWorkpack: this.idWorkpack,
      obligationNumber: selected.data.processId,
      description: selected.data.description,
      managementUnitCode: this.formObligation.controls.managementUnit.value
    };
    const result = await this.obligationsSrv.post(sender);
    this.formIsSaving = false;
    if (result.success) {
      this.messageSrv.add({ severity: 'success', summary: this.translateSrv.instant('success'), detail: this.translateSrv.instant('messages.savedSuccessfully') });
      this.location.back();
    }
  }

  handleOnCancel(): void {
    this.formObligation.reset();
    this.managementUnitOptions = [];
    this.clearProcess();
    this.updateFilterControls();
  }

  truncateProcessLabel(value: string, limit = 90): string { return value && value.length > limit ? `${value.slice(0, limit)}...` : value; }

  formatCurrency(value: string | number): string {
    if (value === null || value === undefined || value === '') return '-';

    const text = String(value).trim();
    const normalized = text.includes(',')
      ? text.replace(/\./g, '').replace(',', '.')
      : text;
    const amount = Number(normalized);

    if (Number.isNaN(amount)) return text;

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount).replace(/\s/g, '');
  }

  get processFullValue(): string { return [this.obligation?.obligationNumber, this.obligation?.description].filter(Boolean).join(' - '); }

  private async loadPermissions(): Promise<void> {
    const isAdmin = await this.authSrv.isUserAdmin();
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    const result = await this.workpackSrv.GetWorkpackPermissions(this.idWorkpack, { 'id-plan': this.idPlan });
    if (!result.success) return;
    const workpack = result.data;
    this.editPermission = !workpack.canceled && (isAdmin || !!workpack.permissions?.some(permission => permission.level === 'EDIT'));
  }

  private async setBreadcrumb(): Promise<void> {
    let items = this.breadcrumbSrv.get;
    if (!items?.length) items = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(this.idWorkpack, this.idPlan);
    const info = this.obligation?.description || this.obligation?.obligationNumber;
    this.breadcrumbSrv.setMenu([...items, { key: 'obligation', info: this.truncateProcessLabel(info, 90), tooltip: info }]);
  }
}
