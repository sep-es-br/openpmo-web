import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';

import { IPossibleValueOption } from '../../interfaces/IPossibleValueOption';

@Component({
  selector: 'app-possible-values-editor',
  templateUrl: './possible-values-editor.component.html',
  styleUrls: ['./possible-values-editor.component.scss']
})
export class PossibleValuesEditorComponent implements OnChanges {

  @Input() values: IPossibleValueOption[] = [];
  @Input() disabled = false;
  @Output() valuesChange = new EventEmitter<IPossibleValueOption[]>();

  displayModal = false;
  editableValues: IPossibleValueOption[] = [];
  private initialValues: IPossibleValueOption[] = [];
  private confirmationPending = false;

  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly translateService: TranslateService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.values && !this.displayModal) {
      this.editableValues = this.cloneValues(this.values);
      this.initialValues = this.cloneValues(this.values);
    }
  }

  open(): void {
    if (!this.disabled) {
      this.editableValues = this.cloneValues(this.values);
      this.initialValues = this.cloneValues(this.values);
      this.displayModal = true;
    }
  }

  addValue(): void {
    this.editableValues = [...this.editableValues, { label: '', value: null }];
  }

  removeValue(index: number): void {
    this.editableValues = this.editableValues.filter((_, currentIndex) => currentIndex !== index);
  }

  save(): void {
    if (this.disabled) {
      return;
    }
    this.values = this.cloneValues(this.editableValues);
    this.valuesChange.emit(this.cloneValues(this.values));
    this.displayModal = false;
  }

  cancel(): void {
    if (!this.displayModal || this.confirmationPending) {
      return;
    }
    if (!this.hasPendingChanges) {
      this.discardAndClose();
      return;
    }
    this.confirmationPending = true;
    this.confirmationService.confirm({
      key: 'clearPendingChangesConfirm',
      message: this.translateService.instant('messages.confirmDiscardModalChanges'),
      acceptLabel: this.translateService.instant('yes'),
      rejectLabel: this.translateService.instant('no'),
      accept: () => {
        this.confirmationPending = false;
        this.discardAndClose();
      },
      reject: () => { this.confirmationPending = false; }
    });
  }

  get hasPendingChanges(): boolean {
    return this.editableValues.length !== this.initialValues.length
      || this.editableValues.some((item, index) =>
        item.label !== this.initialValues[index]?.label || item.value !== this.initialValues[index]?.value);
  }

  private discardAndClose(): void {
    this.editableValues = this.cloneValues(this.values);
    this.displayModal = false;
  }

  handleRowReorder(): void {
    this.editableValues = [...this.editableValues];
  }

  private cloneValues(values: IPossibleValueOption[] = []): IPossibleValueOption[] {
    return values.map(item => ({ ...item }));
  }
}
