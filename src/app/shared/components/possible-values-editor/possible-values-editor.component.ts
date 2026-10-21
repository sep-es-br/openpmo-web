import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';
import { FormControl, FormGroup, Validators } from '@angular/forms';

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
  private valueForms = new WeakMap<IPossibleValueOption, FormGroup>();

  getValueForm(option: IPossibleValueOption): FormGroup {
    let form = this.valueForms.get(option);
    if (!form) {
      form = new FormGroup({ value: new FormControl(option.value, Validators.required) });
      form.get('value').valueChanges.subscribe(value => option.value = value);
      this.valueForms.set(option, form);
    }
    return form;
  }

  get numericLocale(): string {
    return this.translateService.currentLang || 'pt-BR';
  }

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
    const forms = this.editableValues.map(option => this.getValueForm(option));
    if (forms.some(form => form.invalid)) {
      forms.forEach(form => form.markAllAsTouched());
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
