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
  selector: 'app-contract',
  templateUrl: './contract.component.html',
  styleUrls: ['./contract.component.scss'],
})
export class ContractComponent implements OnInit, OnDestroy {
  @ViewChild(SaveButtonComponent)
  saveButton: SaveButtonComponent;

  @ViewChild(CancelButtonComponent)
  cancelButton: CancelButtonComponent;

  responsive = false;

  idContract: number;
  idWorkpack: number;
  idPlan: number;

  editPermission = false;
  isLoading = false;
  formIsSaving = false;

  $destroy = new Subject<void>();

  cardContractProperties: ICard;

  formContract: FormGroup;

  contract: IAgreements;

  organizationOptions = [];
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
        this.idContract = queryParams.idContract && +queryParams.idContract;

        this.idWorkpack = queryParams.idWorkpack && +queryParams.idWorkpack;
      });

    this.responsiveSrv.observable
      .pipe(takeUntil(this.$destroy))
      .subscribe((value) => {
        this.responsive = value;
      });

    this.formContract = this.formBuilder.group({
      organization: [null, Validators.required],
      year: [null, Validators.required],
      process: [null, Validators.required],
      supplierCnpj: [''],
      supplierName: [''],
      protocol: [''],
    });

    this.formContract.statusChanges
      .pipe(
        takeUntil(this.$destroy),
        filter((status) => status === 'INVALID')
      )
      .subscribe(() => {
        this.saveButton?.hideButton();
      });

    this.formContract.valueChanges
      .pipe(
        takeUntil(this.$destroy),
        filter(() => this.formContract.dirty && this.formContract.valid)
      )
      .subscribe(() => {
        this.saveButton?.showButton();
      });

    this.formContract.valueChanges
      .pipe(
        takeUntil(this.$destroy),
        filter(() => this.formContract.dirty)
      )
      .subscribe(() => {
        this.cancelButton?.showButton();
      });
  }

  async ngOnInit(): Promise<void> {
    await this.loadPropertiesContract();
    await this.setBreadcrumb();

    if (!this.editPermission) {
      this.formContract.disable();
    } else {
      this.formContract.enable();
    }

    this.loadMockOptions();
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

    this.processOptions = [
      {
        label: '47621222 - AQUISIÇÃO DE GUILHOTINA ELÉTRICA',
        value: 47621222,
        data: {
          processNumber: '47621222',
          object: 'AQUISIÇÃO DE GUILHOTINA ELÉTRICA',
          supplierCnpj: '14.530.067/0001-42',
          supplierName: 'GRÁFICA TRIÂNGULO LTDA - EPP',
          protocol: '2025-NRFTYU',
        },
      },
    ];
  }

  handleOrganizationChange(): void {
    this.clearProcessData();
    this.loadProcesses();
  }

  handleYearChange(): void {
    this.clearProcessData();
    this.loadProcesses();
  }

  private clearProcessData(): void {
    this.processOptions = [];

    this.formContract.patchValue({
      process: null,
      supplierCnpj: '',
      supplierName: '',
      protocol: '',
    });
  }

  async loadProcesses(): Promise<void> {
    const organization = this.formContract.controls.organization.value;

    const year = this.formContract.controls.year.value;

    if (!organization || !year) {
      return;
    }

    // Substituir futuramente pela consulta real.
    this.loadMockOptions();
  }

  handleProcessChange(event): void {
    const selectedProcess = this.processOptions.find(
      (option) => option.value === event.value
    );

    this.formContract.patchValue({
      supplierCnpj: selectedProcess?.data?.supplierCnpj || '',

      supplierName: selectedProcess?.data?.supplierName || '',

      protocol: selectedProcess?.data?.protocol || '',
    });
  }

  resetFormContract(): void {
    this.formContract.reset({
      organization: null,
      year: null,
      process: null,
      supplierCnpj: '',
      supplierName: '',
      protocol: '',
    });
  }

  setFormContract(): void {
    this.formContract.reset({
      organization: this.contract.organizationId,

      year: this.contract.year,

      process: this.contract.processId,

      supplierCnpj: this.contract.supplierCnpj,

      supplierName: this.contract.supplierName,

      protocol: this.contract.protocol,
    });

    this.isLoading = false;
  }

  async loadPropertiesContract(): Promise<void> {
    this.cardContractProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'contract',
      collapseble: true,
      initialStateCollapse: false,
    };

    this.isLoading = !!this.idContract;

    const result =
      this.idContract && (await this.agreementsSrv.GetById(this.idContract));

    if (result && result.success) {
      this.contract = result.data;

      await this.loadPermissions();

      this.setFormContract();
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

    this.breadcrumbSrv.setMenu([
      ...breadcrumbItems,
      {
        key: 'contract',
        info: this.contract?.processNumber,
        tooltip: this.contract?.processNumber,
      },
    ]);
  }

  async saveContract(): Promise<void> {
    if (this.formContract.invalid) {
      this.formContract.markAllAsTouched();
      return;
    }

    this.cancelButton?.hideButton();
    this.formIsSaving = true;

    const formValue = this.formContract.getRawValue();

    const selectedProcess = this.processOptions.find(
      (option) => option.value === formValue.process
    );

    const sender: IAgreementCreate = {
      idWorkpack: this.idWorkpack,
      type: 'CONTRACT',
      processNumber: selectedProcess?.data?.processNumber,
      object: selectedProcess?.data?.object,
    };

    let result;

    if (this.idContract) {
      const updateSender: IAgreementUpdate = {
        ...sender,
        id: this.idContract,
      };

      result = await this.agreementsSrv.put(updateSender);
    } else {
      result = await this.agreementsSrv.post(sender);
    }

    if (result.success) {
      const isUpdate = !!this.idContract;

      this.idContract = result.data.id;

      this.contract = {
        ...this.contract,
        id: result.data.id,
        idWorkpack: this.idWorkpack,
        type: 'CONTRACT',
        processNumber: sender.processNumber,
        object: sender.object,

        organizationId: formValue.organization,
        organizationName: this.organizationOptions.find(
          (option) => option.value === formValue.organization
        )?.label,

        year: formValue.year,
        processId: formValue.process,
        supplierCnpj: formValue.supplierCnpj,
        supplierName: formValue.supplierName,
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

      this.formContract.markAsPristine();
      this.saveButton?.hideButton();
      this.cancelButton?.hideButton();
    }

    this.formIsSaving = false;
  }

  handleOnCancel(): void {
    this.saveButton?.hideButton();
    this.cancelButton?.hideButton();

    if (this.idContract) {
      this.setFormContract();
    } else {
      this.resetFormContract();
      this.contract = undefined;
    }
  }
}
