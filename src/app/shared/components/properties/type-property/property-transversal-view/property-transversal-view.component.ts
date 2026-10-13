import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-property-transversal-view',
  templateUrl: './property-transversal-view.component.html',
  styleUrls: ['./property-transversal-view.component.scss']
})
export class PropertyTransversalViewComponent {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();
  showSelection = false;
  draftSelection: TreeNode | TreeNode[];

  updateSelection(selection: string | number | Array<string | number> | null | undefined): void {
    const selectedValues = Array.isArray(selection) ? selection : selection ? [selection] : [];
    const values = selectedValues.map(value => String(value));
    if (this.property.multipleSelection) {
      (this.property.unavailableTransversalViewSelections || []).forEach(item => values.push(item.value));
    }
    this.property.value = this.property.multipleSelection ? values : values[0] || null;
    this.changed.emit(this.property.value);
  }

  openSelection(): void {
    if (!this.property || this.property.disabled) { return; }
    const selectedValues = Array.isArray(this.property.value)
      ? (this.property.value as Array<string | number>).map(value => String(value))
      : this.property.value ? [String(this.property.value)] : [];
    const selectedNodes = this.findSelectedNodes(this.property.transversalViewTree || [], new Set(selectedValues));
    this.draftSelection = this.property.multipleSelection ? selectedNodes : selectedNodes[0] || null;
    this.showSelection = true;
  }

  confirmSelection(): void {
    const selectedNodes = Array.isArray(this.draftSelection)
      ? this.draftSelection
      : this.draftSelection ? [this.draftSelection] : [];
    const selectedValues = selectedNodes
      .map(node => String(node.data))
      .filter(value => !!value);
    this.updateSelection(this.property.multipleSelection ? selectedValues : selectedValues[0] || null);
    this.showSelection = false;
  }

  get selectedLabels(): string {
    const selectedValues = Array.isArray(this.property?.value)
      ? (this.property.value as Array<string | number>).map(value => String(value))
      : this.property?.value ? [String(this.property.value)] : [];
    const selectedNodes = this.findSelectedNodes(this.property?.transversalViewTree || [], new Set(selectedValues));
    return selectedNodes.map(node => node.label).filter(label => !!label).join(', ');
  }

  private findSelectedNodes(nodes: TreeNode[], selectedValues: Set<string>): TreeNode[] {
    const selectedNodes: TreeNode[] = [];
    const visit = (items: TreeNode[]) => items.forEach(node => {
      if (selectedValues.has(String(node.data))) { selectedNodes.push(node); }
      if (node.children?.length) { visit(node.children); }
    });
    visit(nodes);
    return selectedNodes;
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
