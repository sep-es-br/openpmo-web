import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';

@Component({
  selector: 'app-property-transversal-view',
  templateUrl: './property-transversal-view.component.html',
  styleUrls: ['./property-transversal-view.component.scss']
})
export class PropertyTransversalViewComponent {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();

  isSelected(option: SelectItem): boolean {
    const value = this.property?.value;
    return Array.isArray(value) ? (value as any[]).includes(option.value) : value === option.value;
  }

  isDisabled(option: SelectItem): boolean {
    return !!(option as any).disabled;
  }

  toggle(option: SelectItem): void {
    if (!this.property || this.property.disabled || this.isDisabled(option)) {
      return;
    }

    if (this.property.multipleSelection) {
      const currentValues: any[] = Array.isArray(this.property.value)
        ? [...this.property.value as any[]]
        : this.property.value ? [this.property.value] : [];
      this.property.value = this.isSelected(option)
        ? currentValues.filter(value => value !== option.value)
        : [...currentValues, option.value];
    } else {
      this.property.value = this.isSelected(option) ? null : option.value;
    }

    this.changed.emit(this.property.value);
  }
}
