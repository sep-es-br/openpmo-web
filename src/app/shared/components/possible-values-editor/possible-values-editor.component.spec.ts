import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Dialog, DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { PossibleValuesEditorComponent } from './possible-values-editor.component';

describe('PossibleValuesEditorComponent', () => {
  let component: PossibleValuesEditorComponent;
  let confirmationService: jasmine.SpyObj<ConfirmationService>;

  beforeEach(() => {
    confirmationService = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    const translateService = jasmine.createSpyObj('TranslateService', ['instant']);
    translateService.instant.and.callFake(key => key);
    component = new PossibleValuesEditorComponent(confirmationService, translateService);
    component.values = [{ label: 'Original', value: 2 }];
  });

  it('keeps edits, additions, removals and reorder in the draft', () => {
    const emit = spyOn(component.valuesChange, 'emit');
    component.open();
    component.editableValues[0].label = 'Edited';
    component.addValue();
    component.editableValues.reverse();
    component.handleRowReorder();
    component.removeValue(0);
    expect(component.values).toEqual([{ label: 'Original', value: 2 }]);
    expect(emit).not.toHaveBeenCalled();
  });

  it('applies a valid draft only on save and accepts zero', () => {
    const emit = spyOn(component.valuesChange, 'emit');
    component.open();
    component.editableValues = [{ label: 'Zero', value: 0 }];
    component.save();
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith([{ label: 'Zero', value: 0 }]);
    expect(component.displayModal).toBeFalse();
    component.editableValues[0].label = 'Other';
    expect(component.values[0].label).toBe('Zero');
  });

  it('discards the draft on cancel and restores it on reopening', () => {
    const emit = spyOn(component.valuesChange, 'emit');
    component.open();
    component.editableValues[0].value = 99;
    component.addValue();
    component.cancel();
    expect(component.displayModal).toBeTrue();
    confirmationService.confirm.calls.mostRecent().args[0].accept();
    component.open();
    expect(component.editableValues).toEqual([{ label: 'Original', value: 2 }]);
    expect(emit).not.toHaveBeenCalled();
  });

  it('allows saving empty lists, blank labels and absent values without validation', () => {
    const emit = spyOn(component.valuesChange, 'emit');
    for (const draft of [[], [{ label: '', value: 1 }], [{ label: 'Option', value: null }]]) {
      component.open();
      component.editableValues = draft;
      component.save();
      expect(component.displayModal).toBeFalse();
      expect(emit).toHaveBeenCalledWith(draft);
    }
    expect(emit).toHaveBeenCalledTimes(3);
  });

  it('retains a saved draft when the dialog hide event follows save', () => {
    const emit = spyOn(component.valuesChange, 'emit');
    component.open();
    component.editableValues[0].label = 'Saved';
    component.save();
    component.cancel();
    expect(component.values[0].label).toBe('Saved');
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('does not open or save when disabled', () => {
    const emit = spyOn(component.valuesChange, 'emit');
    component.disabled = true;
    component.open();
    component.save();
    expect(component.displayModal).toBeFalse();
    expect(emit).not.toHaveBeenCalled();
  });

  it('keeps edits when discarding is rejected and avoids duplicate confirmations', () => {
    component.open();
    component.editableValues[0].label = 'Draft';
    component.cancel();
    component.cancel();
    expect(confirmationService.confirm).toHaveBeenCalledTimes(1);
    expect(confirmationService.confirm.calls.mostRecent().args[0].key).toBe('clearPendingChangesConfirm');
    confirmationService.confirm.calls.mostRecent().args[0].reject();
    expect(component.displayModal).toBeTrue();
    expect(component.editableValues[0].label).toBe('Draft');
    component.cancel();
    expect(confirmationService.confirm).toHaveBeenCalledTimes(2);
  });

  it('closes without asking when unchanged or when edits have been reverted', () => {
    component.open();
    component.editableValues[0].value = 9;
    component.editableValues[0].value = 2;
    component.cancel();
    expect(component.displayModal).toBeFalse();
    expect(confirmationService.confirm).not.toHaveBeenCalled();
  });

  it('detects additions, deletions and reorder as pending changes', () => {
    component.values = [{ label: 'A', value: 1 }, { label: 'B', value: 2 }];
    component.open();
    component.editableValues.reverse();
    component.handleRowReorder();
    expect(component.hasPendingChanges).toBeTrue();
    component.editableValues.reverse();
    expect(component.hasPendingChanges).toBeFalse();
    component.removeValue(0);
    expect(component.hasPendingChanges).toBeTrue();
    component.open();
    component.addValue();
    expect(component.hasPendingChanges).toBeTrue();
  });

  describe('dialog template', () => {
    let fixture: ComponentFixture<PossibleValuesEditorComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [PossibleValuesEditorComponent],
        providers: [{ provide: ConfirmationService, useValue: confirmationService }],
        imports: [FormsModule, NoopAnimationsModule, TranslateModule.forRoot(),
          ButtonModule, DialogModule, InputNumberModule, InputTextModule, TableModule]
      }).overrideComponent(PossibleValuesEditorComponent, {
        set: { styleUrls: [], styles: [
          ':host ::ng-deep *, :host ::ng-deep *::before { font-family: sans-serif !important; }'
        ] }
      }).compileComponents();
      fixture = TestBed.createComponent(PossibleValuesEditorComponent);
      component = fixture.componentInstance;
      component.values = [{ label: 'Original', value: 2 }];
      component.open();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    afterEach(() => fixture?.destroy());

    it('prevents closing outside and requests confirmation before X/Esc can hide the editor', () => {
      const dialog: Dialog = fixture.debugElement.query(By.directive(Dialog)).componentInstance;
      expect(dialog.dismissableMask).toBeFalse();
      expect(dialog.closeOnEscape).toBeTrue();
      expect(dialog.baseZIndex).toBe(0);
      component.editableValues[0].label = 'Discard';
      dialog.visibleChange.emit(false);
      fixture.detectChanges();
      expect(component.displayModal).toBeTrue();
      expect(dialog.visible).toBeTrue();
      expect(component.editableValues[0].label).toBe('Discard');
      confirmationService.confirm.calls.mostRecent().args[0].accept();
      expect(component.displayModal).toBeFalse();
      expect(component.values[0].label).toBe('Original');
      expect(component.editableValues[0].label).toBe('Original');
    });

    it('keeps the editor content in one full-width column apart from the standard footer', () => {
      const body = fixture.debugElement.query(By.css('.p-dialog-content'));
      const column = body.query(By.css('.p-col-12.p-p-0'));
      expect(column).toBeTruthy();
      expect(body.nativeElement.children.length).toBe(1);
      expect(column.query(By.css('p-table'))).toBeTruthy();
      expect(column.query(By.css('.add-value-link'))).toBeTruthy();
      expect(column.queryAll(By.css('small')).length).toBe(0);
      expect(fixture.debugElement.query(By.css('.p-dialog-header small')).nativeElement.textContent)
        .toContain('possibleValuesDescription');
      expect(column.query(By.css('.p-dialog-footer'))).toBeNull();
    });

    it('saves incomplete fields without displaying validation', () => {
      const emit = spyOn(component.valuesChange, 'emit');
      const buttons = fixture.debugElement.queryAll(By.css('.p-dialog-footer button'));
      expect(buttons.length).toBe(2);
      component.editableValues[0].label = ' ';
      component.editableValues[0].value = null;
      buttons[1].triggerEventHandler('click', null);
      expect(fixture.debugElement.query(By.css('[role="alert"]'))).toBeNull();
      expect(emit).toHaveBeenCalledWith([{ label: ' ', value: null }]);
      expect(component.displayModal).toBeFalse();
    });
  });
});
