import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IProcurement, IProcurementCreate, IProcurementUpdate } from 'src/app/shared/interfaces/IProcurement';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ProcurementsService } from 'src/app/shared/services/procurements.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';

@Component({
  selector: 'app-procurement',
  templateUrl: './procurement.component.html',
  styleUrls: ['./procurement.component.scss'],
})
export class ProcurementComponent implements OnInit, OnDestroy {
  @ViewChild(SaveButtonComponent)
  saveButton: SaveButtonComponent;

  @ViewChild(CancelButtonComponent)
  cancelButton: CancelButtonComponent;

  responsive = false;

  idProcurement: number;

  idWorkpack: number;

  idPlan: number;

  editPermission = false;

  $destroy = new Subject<void>();

  cardProcurementProperties: ICard;

  formProcurement: FormGroup;

  procurement: IProcurement;

  isLoading = false;

  formIsSaving = false;

  organizationOptions = [];

  yearOptions = [];

  procurementProcessOptions = [];

  constructor(
    private actRouter: ActivatedRoute,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private procurementsSrv: ProcurementsService,
    private authSrv: AuthService,
    private workpackSrv: WorkpackService
  ) {
    this.actRouter.queryParams
      .pipe(takeUntil(this.$destroy))
      .subscribe((queryParams) => {
        this.idProcurement =
          queryParams.idProcurement && +queryParams.idProcurement;

        this.idWorkpack = queryParams.idWorkpack && +queryParams.idWorkpack;
      });

    this.responsiveSrv.observable
      .pipe(takeUntil(this.$destroy))
      .subscribe((value) => {
        this.responsive = value;
      });

    this.formProcurement = this.formBuilder.group({
      organization: [null, Validators.required],

      year: [null, Validators.required],

      procurementProcess: [null, Validators.required],

      modality: [''],

      status: [''],

      protocol: [''],
    });

    this.formProcurement.statusChanges
      .pipe(
        takeUntil(this.$destroy),
        filter((status) => status === 'INVALID')
      )
      .subscribe(() => {
        this.saveButton?.hideButton();
      });

    this.formProcurement.valueChanges
      .pipe(
        takeUntil(this.$destroy),
        filter(() => this.formProcurement.dirty && this.formProcurement.valid)
      )
      .subscribe(() => {
        this.saveButton?.showButton();
      });

    this.formProcurement.valueChanges
      .pipe(
        takeUntil(this.$destroy),
        filter(() => this.formProcurement.dirty)
      )
      .subscribe(() => {
        this.cancelButton?.showButton();
      });
  }

  async ngOnInit(): Promise<void> {
    this.loadMockOptions();

    await this.loadPropertiesProcurement();
    await this.setBreadcrumb();

    if (!this.editPermission) {
      this.formProcurement.disable();
    } else {
      this.formProcurement.enable();
      this.disableComplementaryFields();
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  private loadMockOptions(): void {
    this.organizationOptions = [
      {
        label: 'SECULT',
        value: 1,
      },
    ];

    this.yearOptions = [
      {
        label: '2023',
        value: 2023,
      },
    ];

    this.procurementProcessOptions = [
      {
        label: '47621222 - AQUISIÇÃO DE CULHOTINA ELÉTRICA',
        value: 47621222,
        data: {
          processNumber: '47621222',
          object: 'AQUISIÇÃO DE CULHOTINA ELÉTRICA',
          modality: 'Pregão',
          status: 'Em andamento',
          protocol: '2025-NRFTYU',
        },
      },
    ];
  }

  resetFormProcurement(): void {
    this.formProcurement.reset({
      organization: null,
      year: null,
      procurementProcess: null,
      modality: '',
      status: '',
      protocol: '',
    });
  }

  handleOrganizationChange(): void {
    this.clearProcessData();
    this.loadProcurementProcesses();
  }

  handleYearChange(): void {
    this.clearProcessData();
    this.loadProcurementProcesses();
  }

  private clearProcessData(): void {
    this.procurementProcessOptions = [];

    this.formProcurement.patchValue({
      procurementProcess: null,
      modality: '',
      status: '',
      protocol: '',
    });
  }

  async loadProcurementProcesses(): Promise<void> {
    const organization = this.formProcurement.controls.organization.value;

    const year = this.formProcurement.controls.year.value;

    if (!organization || !year) {
      return;
    }

    /*
      const result =
        await this.procurementsSrv
          .getProcurementProcesses({
            organization,
            year
          });

      this.procurementProcessOptions =
        result.success
          ? result.data.map(item => ({
              label:
                `${item.processNumber} - ${item.object}`.toUpperCase(),
              value: item.id,
              data: item
            }))
          : [];
      */

    this.loadMockOptions();
  }

  handleProcurementProcessChange(event): void {
    const selectedProcess = this.procurementProcessOptions.find(
      (option) => option.value === event.value
    );

    this.formProcurement.patchValue({
      modality: selectedProcess?.data?.modality || '',

      status: selectedProcess?.data?.status || '',

      protocol: selectedProcess?.data?.protocol || '',
    });
  }

  setFormProcurement(): void {
    this.ensureCurrentOptions();

    const selectedProcess = this.getCurrentProcessOption();

    const processValue = selectedProcess?.value ||
      this.procurement.processId || this.procurement.processNumber;

    const processData = selectedProcess?.data || {};

    this.formProcurement.reset({
      organization:
        this.procurement.organizationId || this.procurement.organizationName,

      year: this.procurement.year,

      procurementProcess: processValue,

      modality: this.procurement.modality || processData.modality,

      status: this.procurement.status || processData.status,

      protocol: this.procurement.protocol || processData.protocol,
    });

    this.isLoading = false;
  }

  private ensureCurrentOptions(): void {
    const organizationValue =
      this.procurement.organizationId || this.procurement.organizationName;

    if (
      organizationValue &&
      !this.organizationOptions.some(
        (option) => option.value === organizationValue
      )
    ) {
      this.organizationOptions.push({
        label: (
          this.procurement.organizationName || String(organizationValue)
        ).toUpperCase(),
        value: organizationValue,
      });
    }

    if (
      this.procurement.year &&
      !this.yearOptions.some((option) => option.value === this.procurement.year)
    ) {
      this.yearOptions.push({
        label: String(this.procurement.year),
        value: this.procurement.year,
      });
    }

    const processValue =
      this.procurement.processId || this.procurement.processNumber;

    if (
      processValue &&
      !this.getCurrentProcessOption()
    ) {
      this.procurementProcessOptions.push({
        label: [this.procurement.processNumber, this.procurement.object]
          .filter(Boolean)
          .join(' - ')
          .toUpperCase(),
        value: processValue,
        data: this.procurement,
      });
    }
  }

  private getCurrentProcessOption(): any {
    return this.procurementProcessOptions.find(
      (option) =>
        option.value === this.procurement.processId ||
        String(option.data?.processNumber) ===
          String(this.procurement.processNumber)
    );
  }

  private disableComplementaryFields(): void {
    this.formProcurement.controls.modality.disable();
    this.formProcurement.controls.status.disable();
    this.formProcurement.controls.protocol.disable();
  }

  async loadPropertiesProcurement(): Promise<void> {
    this.cardProcurementProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'procurement',
      collapseble: true,
      initialStateCollapse: false,
    };

    this.isLoading = !!this.idProcurement;

    const result =
      this.idProcurement &&
      (await this.procurementsSrv.GetById(this.idProcurement));

    if (result && result.success) {
      this.procurement = result.data;

      await this.loadPermissions();

      this.setFormProcurement();
    } else {
      await this.loadPermissions();

      this.isLoading = false;
    }
  }

  async loadPermissions(): Promise<void> {
    const isUserAdmin = await this.authSrv.isUserAdmin();

    this.idPlan = Number(localStorage.getItem('@currentPlan'));

    const result = await this.workpackSrv.GetWorkpackPermissions(
      this.idWorkpack,
      {
        'id-plan': this.idPlan,
      }
    );

    if (result.success) {
      const workpack = result.data;

      if (isUserAdmin) {
        this.editPermission = !workpack.canceled;
      } else {
        this.editPermission =
          !!workpack.permissions &&
          workpack.permissions.filter(
            (permission) => permission.level === 'EDIT'
          ).length > 0 &&
          !workpack.canceled;
      }
    }
  }

  async setBreadcrumb(): Promise<void> {
    let breadcrumbItems = this.breadcrumbSrv.get;

    if (!breadcrumbItems || breadcrumbItems.length === 0) {
      breadcrumbItems = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(
        this.idWorkpack,
        this.idPlan
      );
    }

    const procurementInfo = this.procurement?.processNumber;

    this.breadcrumbSrv.setMenu([
      ...breadcrumbItems,
      {
        key: 'procurement',
        info: procurementInfo,
        tooltip: procurementInfo,
      },
    ]);
  }

  async saveProcurement(): Promise<void> {
    if (this.formProcurement.invalid) {
      this.formProcurement.markAllAsTouched();
      return;
    }

    this.cancelButton?.hideButton();
    this.formIsSaving = true;

    const formValue = this.formProcurement.getRawValue();

    const selectedProcess = this.procurementProcessOptions.find(
      (option) => option.value === formValue.procurementProcess
    );

    const sender: IProcurementCreate = {
      idWorkpack: this.idWorkpack,
      processNumber: selectedProcess?.data?.processNumber,
      object: selectedProcess?.data?.object,
    };

    let result;

    if (this.idProcurement) {
      const updateSender: IProcurementUpdate = {
        ...sender,
        id: this.idProcurement,
      };

      result = await this.procurementsSrv.put(updateSender);
    } else {
      result = await this.procurementsSrv.post(sender);
    }

    if (result.success) {
      const isUpdate = !!this.idProcurement;

      this.idProcurement = result.data.id;

      this.procurement = {
        ...this.procurement,
        id: result.data.id,
        idWorkpack: this.idWorkpack,
        processNumber: sender.processNumber,
        object: sender.object,

        organizationId: formValue.organization,
        organizationName: this.organizationOptions.find(
          (option) => option.value === formValue.organization
        )?.label,

        year: formValue.year,
        processId: formValue.procurementProcess,
        modality: formValue.modality,
        status: formValue.status,
        protocol: formValue.protocol,
      };

      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully'),
      });

      if (!isUpdate) {
        await this.setBreadcrumb();
      }

      this.formProcurement.markAsPristine();
      this.saveButton?.hideButton();
      this.cancelButton?.hideButton();
    }

    this.formIsSaving = false;
  }

  handleOnCancel(): void {
    this.saveButton?.hideButton();
    this.cancelButton?.hideButton();

    if (this.idProcurement) {
      this.setFormProcurement();
    } else {
      this.resetFormProcurement();
      this.procurement = undefined;
    }
  }
}
