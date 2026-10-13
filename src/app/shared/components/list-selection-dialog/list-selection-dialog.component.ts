import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MultiSelect } from 'primeng/multiselect';

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
  @Input() selectionPlaceholder = 'select';
  @Input() selectionLabel = '';
  @Input() width = '620px';
  @Input() maxHeight = '80vh';
  @Input() showActions = true;
  @Input() showEmptyMessage = true;
  @Input() filterResetKey = 0;
  @Input() selectionResetKey = 0;
  @Input() dismissableMask = true;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<ListSelectionDialogItem[]>();
  @Output() selectionChanged = new EventEmitter<ListSelectionDialogItem[]>();
  @Output() cancelled = new EventEmitter<void>();

  draftSelection: ListSelectionDialogItem[] = [];
  dialogItems: ListSelectionDialogItem[] = [];

  @ViewChild('selectionList') selectionList: MultiSelect;

  private closedByAction = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectionResetKey && !changes.selectionResetKey.firstChange) {
      this.resetDraftSelection();
    } else if (changes.visible && changes.visible.currentValue && !changes.visible.previousValue) {
      this.resetDraftSelection();
    } else if (this.visible && (changes.items || changes.selectedItems)) {
      this.syncDialogItems(true);
    }
    if (this.visible && changes.filterResetKey && !changes.filterResetKey.firstChange) {
      if (this.selectionList) {
        this.selectionList.filterValue = '';
      }
    }
  }

  confirm(): void {
    this.confirmed.emit(this.getSelectedItems());
    this.closeByAction();
  }

  handleSelectionChange(items: ListSelectionDialogItem[]): void {
    this.draftSelection = items || [];
    if (!this.showActions) {
      this.selectionChanged.emit(this.getSelectedItems());
    }
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
    this.draftSelection = [];
    this.syncDialogItems(false);
  }

  private syncDialogItems(preserveDraft: boolean): void {
    const previousSelection = preserveDraft
      ? [...this.draftSelection]
      : [...this.selectedItems];
    const selectedById = previousSelection.reduce(
      (items, item) => items.has(String(item.id)) ? items : items.set(String(item.id), item),
      new Map<string, ListSelectionDialogItem>()
    );

    this.dialogItems = [...this.items];
    const currentById = new Map(
      this.dialogItems.map(item => [String(item.id), item] as [string, ListSelectionDialogItem])
    );
    this.draftSelection = Array.from(selectedById.entries())
      .map(([id, item]) => currentById.get(id) || item);
  }

  private getSelectedItems(): ListSelectionDialogItem[] {
    return this.draftSelection || [];
  }
}
