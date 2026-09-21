import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

export interface ListSelectionDialogItem {
  id: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
  data?: any;
}

@Component({
  selector: 'app-list-selection-dialog',
  templateUrl: './list-selection-dialog.component.html',
  styleUrls: ['./list-selection-dialog.component.scss']
})
export class ListSelectionDialogComponent implements OnChanges {

  @Input() visible = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() items: ListSelectionDialogItem[] = [];
  @Input() selectedItems: ListSelectionDialogItem[] = [];
  @Input() loading = false;
  @Input() requireSelection = false;
  @Input() filterPlaceholder = 'search';
  @Input() confirmLabel = 'save';
  @Input() cancelLabel = 'cancel';
  @Input() emptyMessage = 'noContent';
  @Input() width = '620px';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<ListSelectionDialogItem[]>();
  @Output() cancelled = new EventEmitter<void>();

  draftSelection: ListSelectionDialogItem[] = [];
  dialogItems: ListSelectionDialogItem[] = [];

  private closedByAction = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.visible && changes.visible.currentValue && !changes.visible.previousValue) {
      this.resetDraftSelection();
    }
  }

  confirm(): void {
    this.confirmed.emit(this.getSelectedItems());
    this.closeByAction();
  }

  cancel(): void {
    this.cancelled.emit();
    this.closeByAction();
  }

  handleHide(): void {
    const wasClosedByAction = this.closedByAction;
    this.closedByAction = false;

    if (!wasClosedByAction) {
      this.visible = false;
      this.visibleChange.emit(false);
      this.cancelled.emit();
    }
  }

  get hasSelection(): boolean {
    return this.getSelectedItems().length > 0;
  }

  private closeByAction(): void {
    this.closedByAction = true;
    this.visible = false;
    this.visibleChange.emit(false);
  }

  private resetDraftSelection(): void {
    const selectedIds = this.selectedItems.map(item => item.id);
    this.dialogItems = [...this.items];
    this.draftSelection = this.dialogItems.filter(item => selectedIds.includes(item.id));
  }

  private getSelectedItems(): ListSelectionDialogItem[] {
    return this.draftSelection || [];
  }
}
