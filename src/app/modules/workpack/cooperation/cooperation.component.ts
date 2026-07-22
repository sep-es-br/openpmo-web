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
      managementUnit: [{ value: null, disabled: true }],

      year: [null],

      process: [{ value: null, disabled: true }, Validators.required],

      protocolSearch: [''],

      partyCnpj: [''],

      partyName: [''],

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
        filter(() => this.formCooperation.dirty)
      )
      .subscribe(() => {
        if (
          !this.idCooperation &&
          this.formCooperation.valid &&
          this.formCooperation.controls.process.value
        ) {
          this.saveButton?.showButton();
        } else {
          this.saveButton?.hideButton();
        }
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
    if (!this.idCooperation) {
      await this.loadYears();
    }
    await this.loadPropertiesCooperation();
    await this.setBreadcrumb();

    if (!this.editPermission) {
      this.formCooperation.disable();
    } else {
      this.formCooperation.enable();
      if (this.idCooperation) {
        this.formCooperation.controls.process.disable();
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
    const result = await this.agreementsSrv.getProviderYears('COOPERATION');

    this.yearOptions = result.success && Array.isArray(result.data)
      ? result.data
          .map((year) => ({ label: String(year), value: year }))
          .sort((first, second) => Number(second.value) - Number(first.value))
      : [];
  }

  resetFormCooperation(): void {
    this.processFullValue = '';
    this.processSearchCompleted = false;

    this.formCooperation.reset({
      managementUnit: null,
      year: null,
      process: null,
      protocolSearch: '',
      partyCnpj: '',
      partyName: '',
      protocol: '',
    });
    this.updateFilterControls();
  }

  async handleManagementUnitChange(): Promise<void> {
    this.clearProcessData();
    this.updateFilterControls();
    await this.loadProcesses();
  }

  async handleYearChange(): Promise<void> {
    this.managementUnitOptions = [];
    this.clearProcessData();
    this.formCooperation.patchValue({
      managementUnit: null,
      protocolSearch: '',
    });
    this.updateFilterControls();
    await this.loadManagementUnits();
    this.updateFilterControls();
  }

  private clearProcessData(): void {
    this.processSearchCompleted = false;
    this.processOptions = [];

    this.formCooperation.patchValue({
      process: null,
      partyCnpj: '',
      partyName: '',
      protocol: '',
    });
  }

  async loadProcesses(): Promise<void> {
    const managementUnitIdentifier =
      this.formCooperation.controls.managementUnit.value;

    const year = this.formCooperation.controls.year.value;

    const selectedManagementUnit = this.managementUnitOptions.find(
      (option) => option.value === managementUnitIdentifier
    );

    if (!selectedManagementUnit || !year) {
      return;
    }

    const result = await this.agreementsSrv.getProviderProcesses(
      'COOPERATION', year, selectedManagementUnit.data
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
    const protocol = this.formCooperation.controls.protocolSearch.value;

    if (!protocol) {
      return;
    }

    this.managementUnitOptions = [];
    this.clearProcessData();
    this.formCooperation.patchValue({ year: null, managementUnit: null });
    this.updateFilterControls();
  }

  handleProtocolComplete(): void {
    const protocol = String(
      this.formCooperation.controls.protocolSearch.value || ''
    ).toUpperCase();

    this.formCooperation.controls.protocolSearch.setValue(protocol, {
      emitEvent: false,
    });

    // Ao integrar o endpoint, preencha processOptions e marque
    // processSearchCompleted como true depois do retorno bem-sucedido.
  }

  private async loadManagementUnits(): Promise<void> {
    const year = this.formCooperation.controls.year.value;

    if (!year) {
      return;
    }

    const result = await this.agreementsSrv.getProviderOrganizations(
      'COOPERATION', year
    );

    this.managementUnitOptions = result.success && Array.isArray(result.data)
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

    this.formCooperation.patchValue({
      partyCnpj: selectedProcess?.data?.partyCnpj || '',

      partyName: selectedProcess?.data?.partyName || '',

      protocol: selectedProcess?.data?.protocol || '',
    });
  }

  setFormCooperation(): void {
    this.ensureCurrentOptions();

    const selectedProcess = this.getCurrentProcessOption();

    this.processFullValue = this.idCooperation
      ? [this.cooperation.processId, this.cooperation.object]
          .filter(Boolean).join(' - ').toUpperCase()
      : '';

    const processValue = this.idCooperation
      ? truncateText(this.processFullValue)
      : selectedProcess?.value || this.cooperation.processId;

    const processData = selectedProcess?.data || {};

    this.formCooperation.reset({
      managementUnit: this.cooperation.organizationName,

      year: this.cooperation.year,

      process: processValue,

      partyCnpj: this.cooperation.partyCnpj || processData.partyCnpj,

      partyName: this.cooperation.partyName || processData.partyName,

      protocol: this.cooperation.protocol || processData.protocol,
    });

    this.isLoading = false;
  }

  private ensureCurrentOptions(): void {
    const managementUnitValue = this.cooperation.organizationName;

    if (
      managementUnitValue &&
      !this.managementUnitOptions.some(
        (option) => option.value === managementUnitValue
      )
    ) {
      this.managementUnitOptions.push({
        label: (
          this.cooperation.organizationName || String(managementUnitValue)
        ).toUpperCase(),
        value: managementUnitValue,
      });
    }

    if (
      this.cooperation.year &&
      !this.yearOptions.some((option) => option.value === this.cooperation.year)
    ) {
      this.yearOptions.push({
        label: String(this.cooperation.year),
        value: this.cooperation.year,
      });
    }

    const processValue = this.cooperation.processId;

    if (
      processValue &&
      !this.getCurrentProcessOption()
    ) {
      this.processOptions.push({
        label: [this.cooperation.processId, this.cooperation.object]
          .filter(Boolean)
          .join(' - ')
          .toUpperCase(),
        value: processValue,
        data: this.cooperation,
      });
    }
  }

  private getCurrentProcessOption(): any {
    return this.processOptions.find(
      (option) =>
        option.value === this.cooperation.processId
    );
  }

  private updateFilterControls(): void {
    if (!this.editPermission || this.idCooperation) {
      return;
    }

    if (
      this.formCooperation.controls.year.value &&
      this.managementUnitOptions.length
    ) {
      this.formCooperation.controls.managementUnit.enable();
    } else {
      this.formCooperation.controls.managementUnit.disable();
    }

    if (this.formCooperation.controls.managementUnit.value) {
      this.formCooperation.controls.process.enable();
    } else {
      this.formCooperation.controls.process.disable();
    }
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

      if (this.cooperation.processId) {
        const detailResult = await this.agreementsSrv.getProviderProcess(
          'COOPERATION', this.cooperation.processId
        );

        if (detailResult.success && detailResult.data) {
          this.cooperation = { ...this.cooperation, ...detailResult.data };
        }
      }

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

    const cooperationInfo = this.cooperation?.object || '';

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
    if (
      this.formCooperation.invalid ||
      !this.formCooperation.controls.process.value
    ) {
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
      processId: selectedProcess?.data?.processId,
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
        processId: sender.processId,
        object: sender.object,

        organizationName: this.managementUnitOptions.find(
          (option) => option.value === formValue.managementUnit
        )?.label,

        year: formValue.year,
        partyCnpj: formValue.partyCnpj,
        partyName: formValue.partyName,
        protocol: formValue.protocol,
      };

      this.setFormCooperation();

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
      this.location.back();
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
