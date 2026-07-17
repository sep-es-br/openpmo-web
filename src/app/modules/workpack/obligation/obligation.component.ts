import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { CancelButtonComponent } from
  'src/app/shared/components/cancel-button/cancel-button.component';
import { SaveButtonComponent } from
  'src/app/shared/components/save-button/save-button.component';
import { ICard } from
  'src/app/shared/interfaces/ICard';
import { IObligation, IObligationCreate, IObligationUpdate } from
  'src/app/shared/interfaces/IObligation';
import { AuthService } from
  'src/app/shared/services/auth.service';
import { BreadcrumbService } from
  'src/app/shared/services/breadcrumb.service';
import { ObligationsService } from
  'src/app/shared/services/obligations.service';
import { ResponsiveService } from
  'src/app/shared/services/responsive.service';
import { WorkpackService } from
  'src/app/shared/services/workpack.service';

@Component({
  selector: 'app-obligation',
  templateUrl: './obligation.component.html',
  styleUrls: ['./obligation.component.scss'],
})
export class ObligationComponent implements OnInit, OnDestroy {
  @ViewChild(SaveButtonComponent)
  saveButton: SaveButtonComponent;

  @ViewChild(CancelButtonComponent)
  cancelButton: CancelButtonComponent;

  responsive = false;

  idObligation: number;
  idWorkpack: number;
  idPlan: number;

  editPermission = false;
  isLoading = false;
  formIsSaving = false;

  $destroy = new Subject<void>();

  cardObligationProperties: ICard;

  formObligation: FormGroup;

  obligation: IObligation;

  managementUnitOptions = [];
  yearOptions = [];
  obligationNoteOptions = [];

  constructor(
    private actRouter: ActivatedRoute,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private obligationsSrv: ObligationsService,
    private authSrv: AuthService,
    private workpackSrv: WorkpackService
  ) {
    this.actRouter.queryParams
      .pipe(takeUntil(this.$destroy))
      .subscribe((queryParams) => {
        this.idObligation = queryParams.idObligation
          ? Number(queryParams.idObligation)
          : undefined;

        this.idWorkpack = queryParams.idWorkpack
          ? Number(queryParams.idWorkpack)
          : undefined;
      });

    this.responsiveSrv.observable
      .pipe(takeUntil(this.$destroy))
      .subscribe((value) => {
        this.responsive = value;
      });

    this.formObligation = this.formBuilder.group({
      year: [null, Validators.required],

      managementUnit: [null, Validators.required],

      obligationNote: [null, Validators.required],

      supplierCnpj: [''],

      amount: [''],

      protocol: [''],
    });

    this.configureFormChanges();
  }

  async ngOnInit(): Promise<void> {
    this.loadInitialOptions();

    await this.loadPropertiesObligation();
    await this.setBreadcrumb();

    if (!this.editPermission) {
      this.formObligation.disable();
    } else {
      this.formObligation.enable();

      if (this.idObligation) {
        this.disableIdentificationFields();
      }
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  private configureFormChanges(): void {
    this.formObligation.statusChanges
      .pipe(
        takeUntil(this.$destroy),
        filter((status) => status === 'INVALID')
      )
      .subscribe(() => {
        this.saveButton?.hideButton();
      });

    this.formObligation.valueChanges
      .pipe(
        takeUntil(this.$destroy),
        filter(() => this.formObligation.dirty && this.formObligation.valid)
      )
      .subscribe(() => {
        this.saveButton?.showButton();
      });

    this.formObligation.valueChanges
      .pipe(
        takeUntil(this.$destroy),
        filter(() => this.formObligation.dirty)
      )
      .subscribe(() => {
        this.cancelButton?.showButton();
      });
  }

  private loadInitialOptions(): void {
    this.managementUnitOptions = [
      {
        label: 'SECULT',
        value: 'SECULT',
      },
    ];

    this.yearOptions = [
      {
        label: '2026',
        value: 2026,
      },
    ];

    /*
     * Pode deixar vazio inicialmente.
     * Ele será populado depois que Ano e Unidade Gestora
     * forem selecionados.
     */
    this.obligationNoteOptions = [];
  }

  handleYearChange(): void {
    this.clearObligationSelection();
    this.loadObligationNotes();
  }

  handleManagementUnitChange(): void {
    this.clearObligationSelection();
    this.loadObligationNotes();
  }

  private clearObligationSelection(): void {
    this.obligationNoteOptions = [];

    this.formObligation.patchValue({
      obligationNote: null,
      supplierCnpj: '',
      amount: '',
      protocol: '',
    });
  }

  async loadObligationNotes(): Promise<void> {
    const year = this.formObligation.controls.year.value;

    const managementUnit = this.formObligation.controls.managementUnit.value;

    if (!year || !managementUnit) {
      return;
    }

    this.isLoading = true;

    /*
     * Quando o endpoint estiver pronto, substitua o mock:
     *
     * const result =
     *   await this.obligationsSrv
     *     .getObligationNotes({
     *       year,
     *       managementUnit
     *     });
     *
     * this.obligationNoteOptions =
     *   result.success
     *     ? result.data.map(item => ({
     *         label:
     *           `${item.obligationNumber} - ${item.description}`,
     *         value: item.obligationNumber,
     *         data: item
     *       }))
     *     : [];
     */

    this.obligationNoteOptions = [
      {
        label: '2026NE000458 - Aquisição de mudas de espécies nativas',
        value: '2026NE000458',
        data: {
          obligationNumber: '2026NE000458',
          description: 'Aquisição de mudas de espécies nativas',
          supplierCnpj: '14.530.067/0001-42',
          amount: '1.000.000,00',
          protocol: '2026/000458',
        },
      },
    ];

    this.isLoading = false;
  }

  handleObligationNoteChange(event): void {
    const selectedNote = this.obligationNoteOptions.find(
      (option) => option.value === event.value
    );

    this.formObligation.patchValue({
      supplierCnpj: selectedNote?.data?.supplierCnpj || '',

      amount: selectedNote?.data?.amount || '',

      protocol: selectedNote?.data?.protocol || '',
    });
  }

  resetFormObligation(): void {
    this.formObligation.reset({
      year: null,
      managementUnit: null,
      obligationNote: null,
      supplierCnpj: '',
      amount: '',
      protocol: '',
    });

    this.obligationNoteOptions = [];
  }

  setFormObligation(): void {
    this.ensureCurrentOptions();

    this.formObligation.reset({
      year: this.obligation.year,

      managementUnit: this.obligation.managementUnitName,

      obligationNote: this.obligation.obligationNumber,

      supplierCnpj: this.obligation.supplierCnpj,

      amount: this.obligation.amount,

      protocol: this.obligation.protocol,
    });

    if (this.editPermission) {
      this.disableIdentificationFields();
    }

    this.isLoading = false;
  }

  private ensureCurrentOptions(): void {
    if (
      this.obligation?.year &&
      !this.yearOptions.some((option) => option.value === this.obligation.year)
    ) {
      this.yearOptions.push({
        label: String(this.obligation.year),
        value: this.obligation.year,
      });
    }

    if (
      this.obligation?.managementUnitName &&
      !this.managementUnitOptions.some(
        (option) => option.value === this.obligation.managementUnitName
      )
    ) {
      this.managementUnitOptions.push({
        label: this.obligation.managementUnitName,
        value: this.obligation.managementUnitName,
      });
    }

    if (
      this.obligation?.obligationNumber &&
      !this.obligationNoteOptions.some(
        (option) => option.value === this.obligation.obligationNumber
      )
    ) {
      this.obligationNoteOptions.push({
        label: this.obligation.obligationNumber,
        value: this.obligation.obligationNumber,
        data: {
          supplierCnpj: this.obligation.supplierCnpj,
          amount: this.obligation.amount,
          protocol: this.obligation.protocol,
        },
      });
    }
  }

  private disableIdentificationFields(): void {
    this.formObligation.controls.year.disable();

    this.formObligation.controls.managementUnit.disable();

    this.formObligation.controls.obligationNote.disable();
  }

  async loadPropertiesObligation(): Promise<void> {
    this.cardObligationProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'obligation',
      collapseble: true,
      initialStateCollapse: false,
    };

    this.isLoading = !!this.idObligation;

    const result = this.idObligation
      ? await this.obligationsSrv.GetById(this.idObligation)
      : undefined;

    await this.loadPermissions();

    if (result?.success) {
      this.obligation = result.data;
      this.setFormObligation();
    } else {
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

    if (!result.success) {
      return;
    }

    const workpack = result.data;

    if (isUserAdmin) {
      this.editPermission = !workpack.canceled;

      return;
    }

    this.editPermission =
      !!workpack.permissions &&
      workpack.permissions.some((permission) => permission.level === 'EDIT') &&
      !workpack.canceled;
  }

  async setBreadcrumb(): Promise<void> {
    let breadcrumbItems = this.breadcrumbSrv.get;

    if (!breadcrumbItems || breadcrumbItems.length === 0) {
      breadcrumbItems = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(
        this.idWorkpack,
        this.idPlan
      );
    }

    const obligationInfo = this.obligation?.obligationNumber;

    this.breadcrumbSrv.setMenu([
      ...breadcrumbItems,
      {
        key: 'obligation',
        info: obligationInfo,
        tooltip: obligationInfo,
      },
    ]);
  }

  async saveObligation(): Promise<void> {
    if (this.formObligation.invalid) {
      this.formObligation.markAllAsTouched();
      return;
    }

    this.cancelButton?.hideButton();
    this.formIsSaving = true;

    const formValue = this.formObligation.getRawValue();

    const selectedNote = this.obligationNoteOptions.find(
      (option) => option.value === formValue.obligationNote
    );

    const sender: IObligationCreate = {
      idWorkpack: this.idWorkpack,
      obligationNumber: formValue.obligationNote,
      description: selectedNote?.data?.description
    };

    const isUpdate = !!this.idObligation;

    const result = isUpdate
      ? await this.obligationsSrv.put({
          ...sender,
          id: this.idObligation
        } as IObligationUpdate)
      : await this.obligationsSrv.post(sender);

    if (result.success) {
      this.idObligation = result.data.id;

      this.obligation = {
        ...this.obligation,
        ...sender,
        id: result.data.id,

        managementUnitName: formValue.managementUnit,

        year: formValue.year,

        supplierCnpj: formValue.supplierCnpj,

        amount: formValue.amount,

        protocol: formValue.protocol,
      };

      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully'),
      });

      if (!isUpdate) {
        await this.setBreadcrumb();
        this.disableIdentificationFields();
      }

      this.formObligation.markAsPristine();

      this.saveButton?.hideButton();
      this.cancelButton?.hideButton();
    }

    this.formIsSaving = false;
  }

  handleOnCancel(): void {
    this.saveButton?.hideButton();
    this.cancelButton?.hideButton();

    if (this.idObligation) {
      this.setFormObligation();
      return;
    }

    this.resetFormObligation();
    this.obligation = undefined;
  }
}
