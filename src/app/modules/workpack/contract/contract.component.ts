import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { IAgreementCreate, IAgreementOrganization, IAgreements, IAgreementUpdate } from 'src/app/shared/interfaces/IAgreements';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { AgreementsService } from 'src/app/shared/services/agreements.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { truncateText } from 'src/app/shared/utils/truncateText';

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

  processFullValue = '';

  processSearchCompleted = false;

  truncateProcessLabel(
    value: string | null | undefined,
    maxLength?: number
  ): string {
    return truncateText(value, maxLength);
  }

  constructor(
    private actRouter: ActivatedRoute,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private agreementsSrv: AgreementsService,
    private authSrv: AuthService,
    private workpackSrv: WorkpackService,
    private location: Location
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
      organization: [{ value: null, disabled: true }],
      year: [null],
      process: [{ value: null, disabled: true }, Validators.required],
      protocolSearch: [''],
      partyCnpj: [''],
      partyName: [''],
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
        filter(() => this.formContract.dirty)
      )
      .subscribe(() => {
        if (
          !this.idContract &&
          this.formContract.valid &&
          this.formContract.controls.process.value
        ) {
          this.saveButton?.showButton();
        } else {
          this.saveButton?.hideButton();
        }
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
    if (!this.idContract) {
      await this.loadYears();
    }
    await this.loadPropertiesContract();
    await this.setBreadcrumb();

    if (!this.editPermission) {
      this.formContract.disable();
    } else {
      this.formContract.enable();
      if (this.idContract) {
        this.formContract.controls.process.disable();
      } else {
        this.updateFilterControls();
      }
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  private async loadYears(): Promise<void> {
    const result = await this.agreementsSrv.getProviderYears('CONTRACT');

    this.yearOptions = result.success && Array.isArray(result.data)
      ? result.data
          .map((year) => ({ label: String(year), value: year }))
          .sort((first, second) => Number(second.value) - Number(first.value))
      : [];
  }

  async handleOrganizationChange(): Promise<void> {
    this.clearProcessData();
    this.updateFilterControls();
    await this.loadProcesses();
  }

  async handleYearChange(): Promise<void> {
    this.organizationOptions = [];
    this.clearProcessData();
    this.formContract.patchValue({ organization: null, protocolSearch: '' });
    this.updateFilterControls();
    await this.loadOrganizations();
    this.updateFilterControls();
  }

  private clearProcessData(): void {
    this.processSearchCompleted = false;
    this.processOptions = [];

    this.formContract.patchValue({
      process: null,
      partyCnpj: '',
      partyName: '',
      protocol: '',
    });
  }

  async loadProcesses(): Promise<void> {
    const organizationIdentifier =
      this.formContract.controls.organization.value;

    const year = this.formContract.controls.year.value;

    const selectedOrganization = this.organizationOptions.find(
      (option) => option.value === organizationIdentifier
    );

    if (!selectedOrganization || !year) {
      return;
    }

    const result = await this.agreementsSrv.getProviderProcesses(
      'CONTRACT', year, selectedOrganization.data
    );

    this.processOptions = result.success && Array.isArray(result.data)
      ? result.data
          .map((item) => ({
            label: [item.processId, item.object]
              .filter(Boolean).join(' - ').toUpperCase(),
            value: item.processId,
            data: item
          }))
          .sort((first, second) =>
            first.label.localeCompare(second.label, 'pt-BR', { numeric: true })
          )
      : [];

    this.processSearchCompleted = !!result.success;
  }

  handleProtocolInput(): void {
    const protocol = this.formContract.controls.protocolSearch.value;

    if (!protocol) {
      return;
    }

    this.organizationOptions = [];
    this.clearProcessData();
    this.formContract.patchValue({ year: null, organization: null });
    this.updateFilterControls();
  }

  handleProtocolComplete(): void {
    const protocol = String(
      this.formContract.controls.protocolSearch.value || ''
    ).toUpperCase();

    this.formContract.controls.protocolSearch.setValue(protocol, {
      emitEvent: false,
    });

    // Ao integrar o endpoint, preencha processOptions e marque
    // processSearchCompleted como true depois do retorno bem-sucedido.
  }

  private async loadOrganizations(): Promise<void> {
    const year = this.formContract.controls.year.value;

    if (!year) {
      return;
    }

    const result = await this.agreementsSrv.getProviderOrganizations(
      'CONTRACT', year
    );

    this.organizationOptions = result.success && Array.isArray(result.data)
      ? result.data
          .map((item: IAgreementOrganization) => ({
            label: item.name.toUpperCase(),
            value: item.identifier,
            data: item
          }))
          .sort((first, second) =>
            first.label.localeCompare(second.label, 'pt-BR')
          )
      : [];
  }

  handleProcessChange(event): void {
    const selectedProcess = this.processOptions.find(
      (option) => option.value === event.value
    );

    this.formContract.patchValue({
      partyCnpj: selectedProcess?.data?.partyCnpj || '',

      partyName: selectedProcess?.data?.partyName || '',

      protocol: selectedProcess?.data?.protocol || '',
    });
  }

  resetFormContract(): void {
    this.processFullValue = '';
    this.processSearchCompleted = false;

    this.formContract.reset({
      organization: null,
      year: null,
      process: null,
      protocolSearch: '',
      partyCnpj: '',
      partyName: '',
      protocol: '',
    });
    this.updateFilterControls();
  }

  setFormContract(): void {
    this.ensureCurrentOptions();

    const selectedProcess = this.getCurrentProcessOption();

    this.processFullValue = this.idContract
      ? [this.contract.processId, this.contract.object]
          .filter(Boolean).join(' - ').toUpperCase()
      : '';

    const processValue = this.idContract
      ? truncateText(this.processFullValue)
      : selectedProcess?.value || this.contract.processId;

    const processData = selectedProcess?.data || {};

    this.formContract.reset({
      organization: this.contract.organizationName,

      year: this.contract.year,

      process: processValue,

      partyCnpj: this.contract.partyCnpj || processData.partyCnpj,

      partyName: this.contract.partyName || processData.partyName,

      protocol: this.contract.protocol || processData.protocol,
    });

    this.isLoading = false;
  }

  private ensureCurrentOptions(): void {
    const organizationValue = this.contract.organizationName;

    if (
      organizationValue &&
      !this.organizationOptions.some(
        (option) => option.value === organizationValue
      )
    ) {
      this.organizationOptions.push({
        label: (
          this.contract.organizationName || String(organizationValue)
        ).toUpperCase(),
        value: organizationValue,
      });
    }

    if (
      this.contract.year &&
      !this.yearOptions.some((option) => option.value === this.contract.year)
    ) {
      this.yearOptions.push({
        label: String(this.contract.year),
        value: this.contract.year,
      });
    }

    const processValue = this.contract.processId;

    if (
      processValue &&
      !this.getCurrentProcessOption()
    ) {
      this.processOptions.push({
        label: [this.contract.processId, this.contract.object]
          .filter(Boolean)
          .join(' - ')
          .toUpperCase(),
        value: processValue,
        data: this.contract,
      });
    }
  }

  private getCurrentProcessOption(): any {
    return this.processOptions.find(
      (option) =>
        option.value === this.contract.processId
    );
  }

  private updateFilterControls(): void {
    if (!this.editPermission || this.idContract) {
      return;
    }

    if (
      this.formContract.controls.year.value &&
      this.organizationOptions.length
    ) {
      this.formContract.controls.organization.enable();
    } else {
      this.formContract.controls.organization.disable();
    }

    if (this.formContract.controls.organization.value) {
      this.formContract.controls.process.enable();
    } else {
      this.formContract.controls.process.disable();
    }
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

      if (this.contract.processId) {
        const detailResult = await this.agreementsSrv.getProviderProcess(
          'CONTRACT', this.contract.processId
        );

        if (detailResult.success && detailResult.data) {
          this.contract = { ...this.contract, ...detailResult.data };
        }
      }

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
        info: this.contract?.object || '',
        tooltip: this.contract?.object || '',
      },
    ]);
  }

  async saveContract(): Promise<void> {
    if (
      this.formContract.invalid ||
      !this.formContract.controls.process.value
    ) {
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
      processId: selectedProcess?.data?.processId,
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
        processId: sender.processId,
        object: sender.object,

        organizationName: this.organizationOptions.find(
          (option) => option.value === formValue.organization
        )?.label,

        year: formValue.year,
        partyCnpj: formValue.partyCnpj,
        partyName: formValue.partyName,
        protocol: formValue.protocol,
      };

      this.setFormContract();

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
      this.location.back();
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
