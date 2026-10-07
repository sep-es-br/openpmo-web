import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';

@Component({
  selector: 'app-property-transversal-view',
  templateUrl: './property-transversal-view.component.html',
  styleUrls: ['./property-transversal-view.component.scss']
})
export class PropertyTransversalViewComponent {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();

  updateSelection(selection: string | number | Array<string | number>): void {
    const selectedValues = Array.isArray(selection) ? selection : selection ? [selection] : [];
    const values = selectedValues.map(value => String(value));
    if (this.property.multipleSelection) {
      (this.property.unavailableTransversalViewSelections || []).forEach(item => values.push(item.value));
    }
    this.property.value = this.property.multipleSelection ? values : values[0] || null;
    this.changed.emit(this.property.value);
  }

  removeUnavailable(value: string): void {
    if (!this.property || this.property.disabled) {
      return;
    }
    const storedValue = this.property.value;
    const values: string[] = Array.isArray(storedValue)
      ? Array.from(storedValue as Array<string | number>, item => String(item))
      : storedValue ? [String(storedValue)] : [];
    const remaining = values.filter(item => item !== value);
    this.property.value = this.property.multipleSelection ? remaining : remaining[0] || null;
    this.property.unavailableTransversalViewSelections =
      this.property.unavailableTransversalViewSelections.filter(item => item.value !== value);
    this.changed.emit(this.property.value);
  }
}
