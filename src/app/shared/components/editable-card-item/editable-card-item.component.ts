import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MenuItem } from 'primeng/api';

export interface IEditableCardField {
  controlName: string;
  label: string;
  type?: 'text' | 'number' | 'textarea';
  required?: boolean;
  helpTooltip?: string;
  min?: number;
  max?: number;
  rows?: number;
  ellipsisAfter?: number;
}

@Component({
  selector: 'app-editable-card-item',
  templateUrl: './editable-card-item.component.html',
  styleUrls: ['./editable-card-item.component.scss']
})
export class EditableCardItemComponent {
  @Input() form: FormGroup | undefined;
  @Input() fields: IEditableCardField[] = [];
  @Input() menuItems: MenuItem[] = [];
  @Input() itemId: string | number | undefined;
  @Input() uniqueId: string | number | undefined = '';
  @Input() displayMode: 'grid' | 'list' = 'grid';
  @Input() responsive = false;
  @Input() newItem = false;
  @Input() newItemIcon = 'plus';

  @Output() newItemClick = new EventEmitter<void>();

  get isListMode(): boolean {
    return this.displayMode === 'list';
  }

  get hasTextarea(): boolean {
    return this.fields.some((field: IEditableCardField) => field.type === 'textarea');
  }

  inputId(field: IEditableCardField): string {
    return `${field.controlName}-${this.uniqueId}-${this.displayMode}`;
  }

  showTextareaEllipsis(field: IEditableCardField): boolean {
    const value: string = this.form?.get(field.controlName)?.value || '';
    return field.type === 'textarea' && value.length > (field.ellipsisAfter || 120);
  }
}
