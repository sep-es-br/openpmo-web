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
  draftPrincipalProgramId: string | null = null;
  draftFilter = '';
  principalSelectionInvalid = false;

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
    this.draftFilter = '';
    this.draftPrincipalProgramId = this.property.principalProgramId != null
      ? String(this.property.principalProgramId)
      : null;
    if (!this.hasSelectedPrincipalProgram) {
      this.draftPrincipalProgramId = null;
    }
    this.principalSelectionInvalid = this.requiresPrincipalProgram && !this.hasSelectedPrincipalProgram;
    this.showSelection = true;
  }

  onDraftSelectionChange(selection: TreeNode | TreeNode[] | null): void {
    const selectedNodes = Array.isArray(selection) ? selection : selection ? [selection] : [];
    if (!selectedNodes.some(node => String(node.data) === this.draftPrincipalProgramId)) {
      this.draftPrincipalProgramId = null;
    }
    this.principalSelectionInvalid = this.requiresPrincipalProgram && !this.hasSelectedPrincipalProgram;
  }

  setPrincipalProgram(node: TreeNode, checked: boolean): void {
    if (!this.property.multipleSelection) { return; }
    const selectedNodes = Array.isArray(this.draftSelection)
      ? [...this.draftSelection]
      : this.draftSelection ? [this.draftSelection] : [];
    const programId = String(node.data);
    if (!checked) {
      if (this.draftPrincipalProgramId === programId) {
        this.draftPrincipalProgramId = null;
      }
      this.principalSelectionInvalid = this.requiresPrincipalProgram && !this.hasSelectedPrincipalProgram;
      return;
    }
    if (!selectedNodes.some(selected => String(selected.data) === programId)) {
      selectedNodes.push(node);
      this.draftSelection = selectedNodes;
    }
    this.draftPrincipalProgramId = programId;
    this.principalSelectionInvalid = false;
  }

  isPrincipalProgram(node: TreeNode): boolean {
    return this.draftPrincipalProgramId === String(node.data);
  }

  onPrincipalProgramChange(node: TreeNode, event: Event): void {
    this.setPrincipalProgram(node, (event.target as HTMLInputElement).checked);
  }

  confirmSelection(): void {
    const selectedNodes = Array.isArray(this.draftSelection)
      ? this.draftSelection
      : this.draftSelection ? [this.draftSelection] : [];
    if (selectedNodes.length > 1 && !this.hasSelectedPrincipalProgram) {
      this.principalSelectionInvalid = true;
      return;
    }
    const selectedValues = selectedNodes
      .map(node => String(node.data))
      .filter(value => !!value);
    this.property.principalProgramId = this.property.multipleSelection && this.draftPrincipalProgramId
      ? Number(this.draftPrincipalProgramId)
      : null;
    this.updateSelection(this.property.multipleSelection ? selectedValues : selectedValues[0] || null);
    this.showSelection = false;
  }

  get requiresPrincipalProgram(): boolean {
    const selectedNodes = Array.isArray(this.draftSelection)
      ? this.draftSelection
      : this.draftSelection ? [this.draftSelection] : [];
    return !!this.property?.multipleSelection && selectedNodes.length > 1;
  }

  get filteredTransversalViewTree(): TreeNode[] {
    const filter = this.draftFilter.trim().toLocaleLowerCase();
    if (!filter) { return this.property?.transversalViewTree || []; }
    return this.filterTransversalViewTree(this.property?.transversalViewTree || [], filter);
  }

  private get hasSelectedPrincipalProgram(): boolean {
    const selectedNodes = Array.isArray(this.draftSelection)
      ? this.draftSelection
      : this.draftSelection ? [this.draftSelection] : [];
    return !!this.draftPrincipalProgramId && selectedNodes.some(node =>
      String(node.data) === this.draftPrincipalProgramId
    );
  }

  private filterTransversalViewTree(nodes: TreeNode[], filter: string): TreeNode[] {
    return (nodes || []).reduce((filteredNodes, node) => {
      const children = this.filterTransversalViewTree(node.children || [], filter);
      const labelMatches = String(node.label || '').toLocaleLowerCase().includes(filter);
      if (labelMatches) {
        filteredNodes.push(node);
      } else if (children.length) {
        filteredNodes.push({ ...node, children });
      }
      return filteredNodes;
    }, [] as TreeNode[]);
  }

  updateDraftFilter(event: Event): void {
    this.draftFilter = (event.target as HTMLInputElement).value;
  }

  get selectedLabels(): string {
    return this.selectedProgramLabels.join(', ');
  }

  get selectedProgramLabels(): string[] {
    const selectedValues = Array.isArray(this.property?.value)
      ? (this.property.value as Array<string | number>).map(value => String(value))
      : this.property?.value ? [String(this.property.value)] : [];
    const selectedNodes = this.findSelectedNodes(this.property?.transversalViewTree || [], new Set(selectedValues));
    const principalProgramId = this.property?.principalProgramId != null
      ? String(this.property.principalProgramId)
      : null;
    const principalNode = principalProgramId
      ? selectedNodes.find(node => String(node.data) === principalProgramId)
      : null;
    const displayNodes = principalNode
      ? [principalNode, ...selectedNodes.filter(node => node !== principalNode)]
      : selectedNodes;
    return displayNodes.map(node => node.label).filter(label => !!label);
  }

  get principalProgramLabel(): string | null {
    if (!this.property?.multipleSelection || this.property.principalProgramId == null) { return null; }
    const principalProgramId = String(this.property.principalProgramId);
    const selectedValues = Array.isArray(this.property.value)
      ? (this.property.value as Array<string | number>).map(value => String(value))
      : this.property.value ? [String(this.property.value)] : [];
    const selectedNodes = this.findSelectedNodes(this.property.transversalViewTree || [], new Set(selectedValues));
    return selectedNodes.find(node => String(node.data) === principalProgramId)?.label || null;
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
    if (String(this.property.principalProgramId) === value) {
      this.property.principalProgramId = null;
    }
    this.property.unavailableTransversalViewSelections =
      this.property.unavailableTransversalViewSelections.filter(item => item.value !== value);
    this.changed.emit(this.property.value);
  }
}
