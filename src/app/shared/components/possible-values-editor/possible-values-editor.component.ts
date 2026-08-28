import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.values && !this.displayModal) {
      this.editableValues = this.cloneValues(this.values);
    }
  }

  open(): void {
    if (!this.disabled) {
      this.editableValues = this.cloneValues(this.values);
      this.displayModal = true;
    }
  }

  addValue(): void {
    this.editableValues = [...this.editableValues, { label: '', value: null }];
    this.emitChanges();
  }

  removeValue(index: number): void {
    this.editableValues = this.editableValues.filter((_, currentIndex) => currentIndex !== index);
    this.emitChanges();
  }

  commitValueChange(): void {
    this.emitChanges();
  }

  handleRowReorder(): void {
    this.editableValues = [...this.editableValues];
    this.emitChanges();
  }

  private emitChanges(): void {
    this.values = this.cloneValues(this.editableValues);
    this.valuesChange.emit(this.cloneValues(this.editableValues));
  }

  private cloneValues(values: IPossibleValueOption[] = []): IPossibleValueOption[] {
    return values.map(item => ({ ...item }));
  }
}
