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
import { ICommitment } from
  'src/app/shared/interfaces/ICommitment';
import { AuthService } from
  'src/app/shared/services/auth.service';
import { BreadcrumbService } from
  'src/app/shared/services/breadcrumb.service';
import { CommitmentsService } from
  'src/app/shared/services/commitments.service';
import { ResponsiveService } from
  'src/app/shared/services/responsive.service';
import { WorkpackService } from
  'src/app/shared/services/workpack.service';

@Component({
  selector: 'app-commitment',
  templateUrl: './commitment.component.html',
  styleUrls: ['./commitment.component.scss']
})
export class CommitmentComponent
  implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent)
  saveButton: SaveButtonComponent;

  @ViewChild(CancelButtonComponent)
  cancelButton: CancelButtonComponent;

  responsive = false;

  idCommitment: number;
  idWorkpack: number;
  idPlan: number;

  editPermission = false;
  isLoading = false;
  formIsSaving = false;

  $destroy = new Subject<void>();

  cardCommitmentProperties: ICard;

  formCommitment: FormGroup;

  commitment: ICommitment;

  managementUnitOptions = [];
  yearOptions = [];
  commitmentNoteOptions = [];

  constructor(
    private actRouter: ActivatedRoute,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private commitmentsSrv: CommitmentsService,
    private authSrv: AuthService,
    private workpackSrv: WorkpackService
  ) {
    this.actRouter.queryParams
      .pipe(takeUntil(this.$destroy))
      .subscribe(queryParams => {
        this.idCommitment =
          queryParams.idCommitment
            ? Number(queryParams.idCommitment)
            : undefined;

        this.idWorkpack =
          queryParams.idWorkpack
            ? Number(queryParams.idWorkpack)
            : undefined;
      });

    this.responsiveSrv.observable
      .pipe(takeUntil(this.$destroy))
      .subscribe(value => {
        this.responsive = value;
      });

    this.formCommitment = this.formBuilder.group({
      year: [
        null,
        Validators.required
      ],

      managementUnit: [
        null,
        Validators.required
      ],

      commitmentNote: [
        null,
        Validators.required
      ],

      supplierCnpj: [''],

      amount: [''],

      protocol: ['']
    });

    this.configureFormChanges();
  }

  async ngOnInit(): Promise<void> {
    this.loadInitialOptions();

    await this.loadPropertiesCommitment();
    await this.setBreadcrumb();

    if (!this.editPermission) {
      this.formCommitment.disable();
    } else {
      this.formCommitment.enable();

      if (this.idCommitment) {
        this.disableIdentificationFields();
      }
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  private configureFormChanges(): void {
    this.formCommitment.statusChanges
      .pipe(
        takeUntil(this.$destroy),
        filter(status => status === 'INVALID')
      )
      .subscribe(() => {
        this.saveButton?.hideButton();
      });

    this.formCommitment.valueChanges
      .pipe(
        takeUntil(this.$destroy),
        filter(() =>
          this.formCommitment.dirty &&
          this.formCommitment.valid
        )
      )
      .subscribe(() => {
        this.saveButton?.showButton();
      });

    this.formCommitment.valueChanges
      .pipe(
        takeUntil(this.$destroy),
        filter(() => this.formCommitment.dirty)
      )
      .subscribe(() => {
        this.cancelButton?.showButton();
      });
  }

  private loadInitialOptions(): void {
    this.managementUnitOptions = [
      {
        label: 'SECULT',
        value: 'SECULT'
      }
    ];

    this.yearOptions = [
      {
        label: '2026',
        value: 2026
      }
    ];

    /*
     * Pode deixar vazio inicialmente.
     * Ele será populado depois que Ano e Unidade Gestora
     * forem selecionados.
     */
    this.commitmentNoteOptions = [];
  }

  handleYearChange(): void {
    this.clearCommitmentSelection();
    this.loadCommitmentNotes();
  }

  handleManagementUnitChange(): void {
    this.clearCommitmentSelection();
    this.loadCommitmentNotes();
  }

  private clearCommitmentSelection(): void {
    this.commitmentNoteOptions = [];

    this.formCommitment.patchValue({
      commitmentNote: null,
      supplierCnpj: '',
      amount: '',
      protocol: ''
    });
  }

  async loadCommitmentNotes(): Promise<void> {
    const year =
      this.formCommitment.controls.year.value;

    const managementUnit =
      this.formCommitment
        .controls
        .managementUnit
        .value;

    if (!year || !managementUnit) {
      return;
    }

    this.isLoading = true;

    /*
     * Quando o endpoint estiver pronto, substitua o mock:
     *
     * const result =
     *   await this.commitmentsSrv
     *     .getCommitmentNotes({
     *       year,
     *       managementUnit
     *     });
     *
     * this.commitmentNoteOptions =
     *   result.success
     *     ? result.data.map(item => ({
     *         label:
     *           `${item.commitmentNumber} - ${item.description}`,
     *         value: item.commitmentNumber,
     *         data: item
     *       }))
     *     : [];
     */

    this.commitmentNoteOptions = [
      {
        label:
          '2026NE000458 - Aquisição de mudas de espécies nativas',
        value: '2026NE000458',
        data: {
          commitmentNumber: '2026NE000458',
          description:
            'Aquisição de mudas de espécies nativas',
          supplierCnpj:
            '14.530.067/0001-42',
          amount:
            '1.000.000,00',
          protocol:
            '2026/000458'
        }
      }
    ];

    this.isLoading = false;
  }

  handleCommitmentNoteChange(event): void {
    const selectedNote =
      this.commitmentNoteOptions.find(
        option => option.value === event.value
      );

    this.formCommitment.patchValue({
      supplierCnpj:
        selectedNote?.data?.supplierCnpj || '',

      amount:
        selectedNote?.data?.amount || '',

      protocol:
        selectedNote?.data?.protocol || ''
    });
  }

  resetFormCommitment(): void {
    this.formCommitment.reset({
      year: null,
      managementUnit: null,
      commitmentNote: null,
      supplierCnpj: '',
      amount: '',
      protocol: ''
    });

    this.commitmentNoteOptions = [];
  }

  setFormCommitment(): void {
    this.ensureCurrentOptions();

    this.formCommitment.reset({
      year:
        this.commitment.year,

      managementUnit:
        this.commitment.managementUnitName,

      commitmentNote:
        this.commitment.commitmentNumber,

      supplierCnpj:
        this.commitment.supplierCnpj,

      amount:
        this.commitment.amount,

      protocol:
        this.commitment.protocol
    });

    if (this.editPermission) {
      this.disableIdentificationFields();
    }

    this.isLoading = false;
  }

  private ensureCurrentOptions(): void {
    if (
      this.commitment?.year &&
      !this.yearOptions.some(
        option =>
          option.value === this.commitment.year
      )
    ) {
      this.yearOptions.push({
        label:
          String(this.commitment.year),
        value:
          this.commitment.year
      });
    }

    if (
      this.commitment?.managementUnitName &&
      !this.managementUnitOptions.some(
        option =>
          option.value ===
          this.commitment.managementUnitName
      )
    ) {
      this.managementUnitOptions.push({
        label:
          this.commitment.managementUnitName,
        value:
          this.commitment.managementUnitName
      });
    }

    if (
      this.commitment?.commitmentNumber &&
      !this.commitmentNoteOptions.some(
        option =>
          option.value ===
          this.commitment.commitmentNumber
      )
    ) {
      this.commitmentNoteOptions.push({
        label:
          this.commitment.commitmentNumber,
        value:
          this.commitment.commitmentNumber,
        data: {
          supplierCnpj:
            this.commitment.supplierCnpj,
          amount:
            this.commitment.amount,
          protocol:
            this.commitment.protocol
        }
      });
    }
  }

  private disableIdentificationFields(): void {
    this.formCommitment
      .controls
      .year
      .disable();

    this.formCommitment
      .controls
      .managementUnit
      .disable();

    this.formCommitment
      .controls
      .commitmentNote
      .disable();
  }

  async loadPropertiesCommitment():
    Promise<void> {
    this.cardCommitmentProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'commitment',
      collapseble: true,
      initialStateCollapse: false
    };

    this.isLoading =
      !!this.idCommitment;

    const result =
      this.idCommitment
        ? await this.commitmentsSrv
            .GetById(this.idCommitment)
        : undefined;

    await this.loadPermissions();

    if (result?.success) {
      this.commitment = result.data;
      this.setFormCommitment();
    } else {
      this.isLoading = false;
    }
  }

  async loadPermissions(): Promise<void> {
    const isUserAdmin =
      await this.authSrv.isUserAdmin();

    this.idPlan = Number(
      localStorage.getItem('@currentPlan')
    );

    const result =
      await this.workpackSrv
        .GetWorkpackPermissions(
          this.idWorkpack,
          {
            'id-plan': this.idPlan
          }
        );

    if (!result.success) {
      return;
    }

    const workpack = result.data;

    if (isUserAdmin) {
      this.editPermission =
        !workpack.canceled;

      return;
    }

    this.editPermission =
      !!workpack.permissions &&
      workpack.permissions.some(
        permission =>
          permission.level === 'EDIT'
      ) &&
      !workpack.canceled;
  }

  async setBreadcrumb(): Promise<void> {
    let breadcrumbItems =
      this.breadcrumbSrv.get;

    if (
      !breadcrumbItems ||
      breadcrumbItems.length === 0
    ) {
      breadcrumbItems =
        await this.breadcrumbSrv
          .loadWorkpackBreadcrumbs(
            this.idWorkpack,
            this.idPlan
          );
    }

    const commitmentInfo =
      this.commitment?.commitmentNumber;

    this.breadcrumbSrv.setMenu([
      ...breadcrumbItems,
      {
        key: 'commitment',
        info: commitmentInfo,
        tooltip: commitmentInfo
      }
    ]);
  }

  async saveCommitment(): Promise<void> {
    if (this.formCommitment.invalid) {
      this.formCommitment
        .markAllAsTouched();

      return;
    }

    this.cancelButton?.hideButton();
    this.formIsSaving = true;

    /*
     * getRawValue() também retorna os controles
     * desabilitados na edição.
     */
    const formValue =
      this.formCommitment.getRawValue();

    const selectedNote =
      this.commitmentNoteOptions.find(
        option =>
          option.value ===
          formValue.commitmentNote
      );

    const sender: ICommitment = {
      id:
        this.idCommitment,

      idWorkpack:
        this.idWorkpack,

      managementUnitName:
        formValue.managementUnit,

      year:
        formValue.year,

      commitmentNumber:
        formValue.commitmentNote,

      description:
        selectedNote?.data?.description,

      supplierCnpj:
        formValue.supplierCnpj,

      amount:
        formValue.amount,

      protocol:
        formValue.protocol
    };

    const isUpdate =
      !!this.idCommitment;

    const result = isUpdate
      ? await this.commitmentsSrv.put(sender)
      : await this.commitmentsSrv.post(sender);

    if (result.success) {
      this.idCommitment =
        result.data.id;

      this.commitment = {
        ...this.commitment,
        ...sender,
        id: result.data.id
      };

      this.messageSrv.add({
        severity: 'success',
        summary:
          this.translateSrv.instant('success'),
        detail:
          this.translateSrv.instant(
            'messages.savedSuccessfully'
          )
      });

      if (!isUpdate) {
        await this.setBreadcrumb();
        this.disableIdentificationFields();
      }

      this.formCommitment
        .markAsPristine();

      this.saveButton?.hideButton();
      this.cancelButton?.hideButton();
    }

    this.formIsSaving = false;
  }

  handleOnCancel(): void {
    this.saveButton?.hideButton();
    this.cancelButton?.hideButton();

    if (this.idCommitment) {
      this.setFormCommitment();
      return;
    }

    this.resetFormCommitment();
    this.commitment = undefined;
  }
}
