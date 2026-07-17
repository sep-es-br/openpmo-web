import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { IAgreementCreate, IAgreements, IAgreementUpdate } from 'src/app/shared/interfaces/IAgreements';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { AgreementsService } from 'src/app/shared/services/agreements.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';

@Component({
  selector: 'app-cooperation',
  templateUrl: './cooperation.component.html',
  styleUrls: ['./cooperation.component.scss'],
})
export class CooperationComponent implements OnInit, OnDestroy {
  @ViewChild(SaveButtonComponent)
  saveButton: SaveButtonComponent;

  @ViewChild(CancelButtonComponent)
  cancelButton: CancelButtonComponent;

  responsive = false;

  idCooperation: number;

  idWorkpack: number;

  idPlan: number;

  editPermission = false;

  isLoading = false;

  formIsSaving = false;

  $destroy = new Subject<void>();

  cardCooperationProperties: ICard;

  formCooperation: FormGroup;

  cooperation: IAgreements;

  managementUnitOptions = [];

  yearOptions = [];

  processOptions = [];

  constructor(
    private actRouter: ActivatedRoute,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private agreementsSrv: AgreementsService,
    private authSrv: AuthService,
    private workpackSrv: WorkpackService
  ) {
    this.actRouter.queryParams
      .pipe(takeUntil(this.$destroy))
      .subscribe((queryParams) => {
        this.idCooperation =
          queryParams.idCooperation && +queryParams.idCooperation;

        this.idWorkpack = queryParams.idWorkpack && +queryParams.idWorkpack;
      });

    this.responsiveSrv.observable
      .pipe(takeUntil(this.$destroy))
      .subscribe((value) => {
        this.responsive = value;
      });

    this.formCooperation = this.formBuilder.group({
      managementUnit: [null, Validators.required],

      year: [null, Validators.required],

      process: [null, Validators.required],

      grantorCnpj: [''],

      grantorName: [''],

      protocol: [''],
    });

    this.formCooperation.statusChanges
      .pipe(
        takeUntil(this.$destroy),
        filter((status) => status === 'INVALID')
      )
      .subscribe(() => {
        this.saveButton?.hideButton();
      });

    this.formCooperation.valueChanges
      .pipe(
        takeUntil(this.$destroy),
        filter(() => this.formCooperation.dirty && this.formCooperation.valid)
      )
      .subscribe(() => {
        this.saveButton?.showButton();
      });

    this.formCooperation.valueChanges
      .pipe(
        takeUntil(this.$destroy),
        filter(() => this.formCooperation.dirty)
      )
      .subscribe(() => {
        this.cancelButton?.showButton();
      });
  }

  async ngOnInit(): Promise<void> {
    await this.loadPropertiesCooperation();
    await this.setBreadcrumb();

    if (!this.editPermission) {
      this.formCooperation.disable();
    } else {
      this.formCooperation.enable();
    }

    this.loadMockOptions();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  private loadMockOptions(): void {
    this.managementUnitOptions = [
      {
        label: 'SECULT',
        value: 1,
      },
    ];

    this.yearOptions = [
      {
        label: '2026',
        value: 2026,
      },
    ];

    this.processOptions = [
      {
        label: '47621222 - AQUISIÇÃO DE GUILHOTINA ELÉTRICA',
        value: 47621222,
        data: {
          processNumber: '47621222',
          object: 'AQUISIÇÃO DE GUILHOTINA ELÉTRICA',
          grantorCnpj: '14.530.067/0001-42',
          grantorName: 'ASSOCIAÇÃO EVANGÉLICA BENEFICENTE E. SANTENSE',
          protocol: '2025-NRFTYU',
        },
      },
    ];
  }

  resetFormCooperation(): void {
    this.formCooperation.reset({
      managementUnit: null,
      year: null,
      process: null,
      grantorCnpj: '',
      grantorName: '',
      protocol: '',
    });
  }

  handleManagementUnitChange(): void {
    this.clearProcessData();
    this.loadProcesses();
  }

  handleYearChange(): void {
    this.clearProcessData();
    this.loadProcesses();
  }

  private clearProcessData(): void {
    this.processOptions = [];

    this.formCooperation.patchValue({
      process: null,
      grantorCnpj: '',
      grantorName: '',
      protocol: '',
    });
  }

  async loadProcesses(): Promise<void> {
    const managementUnit = this.formCooperation.controls.managementUnit.value;

    const year = this.formCooperation.controls.year.value;

    if (!managementUnit || !year) {
      return;
    }

    /*
      const result =
        await this.agreementsSrv
          .getCooperationProcesses({
            managementUnit,
            year
          });

      this.processOptions =
        result.success
          ? result.data.map(item => ({
              label:
                `${item.processNumber} - ${item.object}`,
              value: item.id,
              data: item
            }))
          : [];
      */

    this.loadMockOptions();
  }

  handleProcessChange(event): void {
    const selectedProcess = this.processOptions.find(
      (option) => option.value === event.value
    );

    this.formCooperation.patchValue({
      grantorCnpj: selectedProcess?.data?.grantorCnpj || '',

      grantorName: selectedProcess?.data?.grantorName || '',

      protocol: selectedProcess?.data?.protocol || '',
    });
  }

  setFormCooperation(): void {
    this.formCooperation.reset({
      managementUnit: this.cooperation.managementUnitId,

      year: this.cooperation.year,

      process: this.cooperation.processId,

      grantorCnpj: this.cooperation.grantorCnpj,

      grantorName: this.cooperation.grantorName,

      protocol: this.cooperation.protocol,
    });

    this.isLoading = false;
  }

  async loadPropertiesCooperation(): Promise<void> {
    this.cardCooperationProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'cooperation',
      collapseble: true,
      initialStateCollapse: false,
    };

    this.isLoading = !!this.idCooperation;

    const result =
      this.idCooperation &&
      (await this.agreementsSrv.GetById(this.idCooperation));

    if (result && result.success) {
      this.cooperation = result.data;

      await this.loadPermissions();

      this.setFormCooperation();
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

      this.editPermission = isUserAdmin
        ? !workpack.canceled
        : !!workpack.permissions &&
          workpack.permissions.some(
            (permission) => permission.level === 'EDIT'
          ) &&
          !workpack.canceled;
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

    const cooperationInfo = this.cooperation?.processNumber;

    this.breadcrumbSrv.setMenu([
      ...breadcrumbItems,
      {
        key: 'cooperation',
        info: cooperationInfo,
        tooltip: cooperationInfo,
      },
    ]);
  }

  async saveCooperation(): Promise<void> {
    if (this.formCooperation.invalid) {
      this.formCooperation.markAllAsTouched();
      return;
    }

    this.cancelButton?.hideButton();
    this.formIsSaving = true;

    const formValue = this.formCooperation.getRawValue();

    const selectedProcess = this.processOptions.find(
      (option) => option.value === formValue.process
    );

    const sender: IAgreementCreate = {
      idWorkpack: this.idWorkpack,
      type: 'COOPERATION',
      processNumber: selectedProcess?.data?.processNumber,
      object: selectedProcess?.data?.object,
    };

    let result;

    if (this.idCooperation) {
      const updateSender: IAgreementUpdate = {
        ...sender,
        id: this.idCooperation,
      };

      result = await this.agreementsSrv.put(updateSender);
    } else {
      result = await this.agreementsSrv.post(sender);
    }

    if (result.success) {
      const isUpdate = !!this.idCooperation;

      this.idCooperation = result.data.id;

      this.cooperation = {
        ...this.cooperation,
        id: result.data.id,
        idWorkpack: this.idWorkpack,
        type: 'COOPERATION',
        processNumber: sender.processNumber,
        object: sender.object,

        managementUnitId: formValue.managementUnit,
        managementUnitName: this.managementUnitOptions.find(
          (option) => option.value === formValue.managementUnit
        )?.label,

        year: formValue.year,
        processId: formValue.process,
        grantorCnpj: formValue.grantorCnpj,
        grantorName: formValue.grantorName,
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

      this.formCooperation.markAsPristine();
      this.saveButton?.hideButton();
      this.cancelButton?.hideButton();
    }

    this.formIsSaving = false;
  }

  handleOnCancel(): void {
    this.saveButton?.hideButton();
    this.cancelButton?.hideButton();

    if (this.idCooperation) {
      this.setFormCooperation();
    } else {
      this.resetFormCooperation();
      this.cooperation = undefined;
    }
  }
}
