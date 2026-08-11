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
import { IProcurement, IProcurementCreate, IProcurementOrganization } from 'src/app/shared/interfaces/IProcurement';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ProcurementsService } from 'src/app/shared/services/procurements.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';

@Component({
  selector: 'app-procurement',
  templateUrl: './procurement.component.html',
  styleUrls: ['./procurement.component.scss']
})
export class ProcurementComponent implements OnInit, OnDestroy {
  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

  responsive = false;
  idProcurement: number;
  idWorkpack: number;
  idPlan: number;
  editPermission = false;
  isLoading = false;
  formIsSaving = false;
  cardProcurementProperties: ICard;
  formProcurement: FormGroup;
  procurement: IProcurement;
  yearOptions = [];
  organizationOptions = [];
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
    private procurementsSrv: ProcurementsService,
    private authSrv: AuthService,
    private workpackSrv: WorkpackService,
    private location: Location
  ) {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.idProcurement = params.idProcurement ? Number(params.idProcurement) : undefined;
      this.idWorkpack = params.idWorkpack ? Number(params.idWorkpack) : undefined;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.destroy$)).subscribe(value => this.responsive = value);
    this.formProcurement = this.formBuilder.group({
      year: [null],
      organization: [{ value: null, disabled: true }],
      process: [{ value: null, disabled: true }, Validators.required],
      object: [''],
      modality: [''],
      status: [''],
      protocol: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    this.cardProcurementProperties = { toggleable: false, initialStateToggle: false, cardTitle: 'procurement', collapseble: true, initialStateCollapse: false };
    this.isLoading = true;
    await this.loadPermissions();
    if (this.idProcurement) await this.loadProcurement();
    else {
      await this.loadYears();
      this.isLoading = false;
      this.updateFilterControls();
    }
    await this.setBreadcrumb();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadYears(): Promise<void> {
    const result = await this.procurementsSrv.getProviderYears();
    this.yearOptions = result.success
      ? result.data.sort((a, b) => b - a).map(value => ({ label: String(value), value }))
      : [];
  }

  async handleYearChange(): Promise<void> {
    this.organizationOptions = [];
    this.clearProcess();
    this.formProcurement.patchValue({ organization: null }, { emitEvent: false });
    this.updateFilterControls();
    const year = this.formProcurement.controls.year.value;
    if (!year) return;
    const result = await this.procurementsSrv.getProviderOrganizations(year);
    this.organizationOptions = result.success
      ? result.data.sort((a, b) => a.name.localeCompare(b.name)).map(data => ({ label: data.name, value: data.identifier, data }))
      : [];
    this.updateFilterControls();
  }

  async handleOrganizationChange(): Promise<void> {
    this.clearProcess();
    this.updateFilterControls();
    const year = this.formProcurement.controls.year.value;
    const selected = this.organizationOptions.find(option => option.value === this.formProcurement.controls.organization.value);
    if (!year || !selected) return;
    const result = await this.procurementsSrv.getProviderProcesses(year, selected.data as IProcurementOrganization);
    this.processOptions = result.success
      ? result.data.sort((a, b) => String(b.processId).localeCompare(String(a.processId))).map(data => ({
          label: [data.processId, data.object].filter(Boolean).join(' - ').toUpperCase(),
          value: data.processId,
          data
        }))
      : [];
    this.processSearchCompleted = true;
    this.updateFilterControls();
  }

  async handleProcessChange(event): Promise<void> {
    this.clearDetails();
    if (!event.value) {
      this.saveButton?.hideButton();
      return;
    }
    const result = await this.procurementsSrv.getProviderProcess(event.value);
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
    this.formProcurement.patchValue({ process: null }, { emitEvent: false });
    this.clearDetails();
    this.saveButton?.hideButton();
    this.cancelButton?.hideButton();
  }

  private clearDetails(): void {
    this.formProcurement.patchValue({ object: '', modality: '', status: '', protocol: '' }, { emitEvent: false });
  }

  private patchDetails(data: IProcurement): void {
    this.formProcurement.patchValue({
      object: data?.object || '',
      modality: data?.modality || '',
      status: data?.status || '',
      protocol: data?.protocol || data?.processNumber || ''
    }, { emitEvent: false });
  }

  private updateFilterControls(): void {
    if (!this.editPermission || this.idProcurement) return;
    const organization = this.formProcurement.controls.organization;
    const process = this.formProcurement.controls.process;
    if (this.formProcurement.controls.year.value && this.organizationOptions.length) organization.enable({ emitEvent: false });
    else organization.disable({ emitEvent: false });
    if (organization.value && this.processOptions.length) process.enable({ emitEvent: false });
    else process.disable({ emitEvent: false });
  }

  private async loadProcurement(): Promise<void> {
    const result = await this.procurementsSrv.GetById(this.idProcurement);
    if (result.success) {
      this.procurement = result.data;
      this.formProcurement.patchValue({ process: result.data.processId, ...result.data });
      this.formProcurement.disable();
    }
    this.isLoading = false;
  }

  async saveProcurement(): Promise<void> {
    const selected = this.processOptions.find(option => option.value === this.formProcurement.controls.process.value);
    if (!selected) return;
    this.formIsSaving = true;
    const sender: IProcurementCreate = {
      idWorkpack: this.idWorkpack,
      processId: selected.data.processId,
      object: selected.data.object,
      organizationIdentifier: this.formProcurement.controls.organization.value
    };
    const result = await this.procurementsSrv.post(sender);
    this.formIsSaving = false;
    if (result.success) {
      this.messageSrv.add({ severity: 'success', summary: this.translateSrv.instant('success'), detail: this.translateSrv.instant('messages.savedSuccessfully') });
      this.location.back();
    }
  }

  handleOnCancel(): void {
    this.formProcurement.reset();
    this.organizationOptions = [];
    this.clearProcess();
    this.updateFilterControls();
  }

  truncateProcessLabel(value: string, limit = 90): string {
    return value && value.length > limit ? `${value.slice(0, limit)}...` : value;
  }

  get processFullValue(): string {
    return [this.procurement?.processId, this.procurement?.object].filter(Boolean).join(' - ');
  }

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
    const info = this.procurement?.object;
    this.breadcrumbSrv.setMenu([...items, { key: 'procurement', info: this.truncateProcessLabel(info, 90), tooltip: info }]);
  }
}
