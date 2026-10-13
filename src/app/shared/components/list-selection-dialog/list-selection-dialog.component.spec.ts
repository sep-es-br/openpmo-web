import { SimpleChange } from '@angular/core';

import { ListSelectionDialogComponent } from './list-selection-dialog.component';

describe('ListSelectionDialogComponent', () => {
  it('keeps a saved selection when items arrive after the dialog opens', () => {
    const component = new ListSelectionDialogComponent();
    const selected = { id: 'challenge:1', label: 'Desafio' };
    component.visible = true;
    component.selectedItems = [selected];
    component.items = [];
    component.ngOnChanges({ visible: new SimpleChange(false, true, true) });

    component.items = [selected];
    component.ngOnChanges({ items: new SimpleChange([], [selected], false) });

    expect(component.draftSelection).toEqual([selected]);
  });

  it('does not restore an item the user removed when filters change', () => {
    const component = new ListSelectionDialogComponent();
    const selected = { id: 'challenge:1', label: 'Desafio' };
    component.visible = true;
    component.selectedItems = [selected];
    component.items = [selected];
    component.ngOnChanges({ visible: new SimpleChange(false, true, true) });
    component.draftSelection = [];

    component.items = [];
    component.ngOnChanges({ items: new SimpleChange([selected], [], false) });

    expect(component.draftSelection).toEqual([]);
  });

  it('emits the selection immediately when actions are hidden', () => {
    const component = new ListSelectionDialogComponent();
    const selected = { id: 'challenge:1', label: 'Desafio' };
    const emitted = jasmine.createSpy('selectionChanged');
    component.showActions = false;
    component.selectionChanged.subscribe(emitted);

    component.handleSelectionChange([selected]);

    expect(emitted).toHaveBeenCalledWith([selected]);
  });

  it('clears residual draft selection when a new opening is requested', () => {
    const component = new ListSelectionDialogComponent();
    component.visible = true;
    component.selectedItems = [];
    component.draftSelection = [{ id: 'challenge:1', label: 'Desafio anterior' }];

    component.ngOnChanges({ selectionResetKey: new SimpleChange(1, 2, false) });

    expect(component.draftSelection).toEqual([]);
  });
});
