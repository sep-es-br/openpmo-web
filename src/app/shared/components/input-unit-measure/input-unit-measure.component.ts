import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-input-unit-measure',
  templateUrl: './input-unit-measure.component.html',
  styleUrls: ['./input-unit-measure.component.scss']
})
export class InputUnitMeasureComponent implements OnInit, OnDestroy {

  @Input() form: FormGroup;
  @Input() controlName: string;
  @Input() maxFractionDigits = 3;
  @ViewChild('inputElement') inputElement: ElementRef<HTMLInputElement>;
  /* eslint-disable @angular-eslint/no-output-on-prefix */
  @Output() onInput = new EventEmitter();
  @Output() onBlur = new EventEmitter();
  /* eslint-enable @angular-eslint/no-output-on-prefix */
  @Input() model: string | number;
  @Output() modelChange = new EventEmitter<string | number>();
  currentLang: string;
  valueInput = '';
  control: AbstractControl;
  separator = {
    'pt-BR': ',',
    'en-US': '.'
  };
  $destroy = new Subject();
  filled = false;
  focused = false;

  constructor(
    private translateSrv: TranslateService,
    private changeDetectorSrv: ChangeDetectorRef,
    private el: ElementRef
  ) {
    this.currentLang = this.translateSrv.getDefaultLang();
    this.translateSrv.onDefaultLangChange
      .pipe(takeUntil(this.$destroy))
      .subscribe(({ lang }) => {
        this.updateValue(lang);
        this.currentLang = lang;
      });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  ngOnInit(): void {
    if (this.form) {
      this.control = this.form.controls[this.controlName];
      this.valueInput = this.control.value?.toString() || '';
      this.control.valueChanges
        .pipe(take(1))
        .subscribe((value: number) => {
          this.valueInput = value.toLocaleString(this.currentLang, { useGrouping: true, maximumFractionDigits: this.maxFractionDigits });
          this.handleFilled();
        });
    } else {
      this.valueInput = this.model && this.model.toLocaleString(this.currentLang, { useGrouping: true, maximumFractionDigits: this.maxFractionDigits });
    }
    this.handleFilled();
    this.el.nativeElement.classList.add('app-input-number');
  }

  updateValue(lang: string) {
    const value = this.getNumberFromString(this.valueInput)
      .toLocaleString(lang, { useGrouping: true, maximumFractionDigits: this.maxFractionDigits });
    if (this.inputElement) {
      this.inputElement.nativeElement.value = value;
    }
    this.valueInput = value;
    this.changeDetectorSrv.detectChanges();
  }

  onModelChange(value: string) {
    if (value !== '') {
      let currentCarretPosition = this.getCaretPosition(this.inputElement.nativeElement);
      const currentTotalOfSeparators = value.match(/[\,\.]/g)?.length;
      const hasSeparator = value.indexOf(this.separator[this.currentLang]) !== -1;
      const valueNumber = this.getNumberFromString(value);
      const currentNumbersLastValueZero = this.zerosAtTheEnd(value);
      value = valueNumber.toLocaleString(this.currentLang, { useGrouping: true, maximumFractionDigits: this.maxFractionDigits });
      if (hasSeparator && value.indexOf(this.separator[this.currentLang]) === -1 ) {
        value = value + this.separator[this.currentLang];
      }
      if (currentNumbersLastValueZero
        && this.zerosAtTheEnd(value) !== currentNumbersLastValueZero
        && value.split(this.separator[this.currentLang])[1]?.length < 3
      ) {
        value = value + ('0'.repeat(currentNumbersLastValueZero));
      }
      if (this.inputElement) {
        this.inputElement.nativeElement.value = value;
        const afterTotalOfSeparators = value.match(/[\,\.]/g)?.length;
        const difference = afterTotalOfSeparators - currentTotalOfSeparators;
        if (difference) {
          currentCarretPosition = {
            start: currentCarretPosition.start + difference,
            end: currentCarretPosition.start + difference
          };
        }
        this.setCaretPosition(this.inputElement.nativeElement, currentCarretPosition);
      }
    }
    this.valueInput = value;
    this.changeDetectorSrv.detectChanges();
    this.handleFilled();
    const newValueNumber = value !== '' ? this.getNumberFromString(value): '';
    this.control?.setValue(newValueNumber);
    this.onInput.emit(newValueNumber);
    this.model = newValueNumber;
    this.modelChange.emit(this.model);
  }

  zerosAtTheEnd(value: string) {
    return value.split('').reverse().reduce((acc, k, i) => k === '0' && i === acc ? ++acc : acc, 0);
  }

  getNumberFromString(str: string): number {
    const strSplitted = str.split(this.separator[this.currentLang]);
    const strFormated = strSplitted[0].replace(/[\,\.]/g, '') + (
      strSplitted[1] ? `.${strSplitted[1]}`: ''
    );
    return Number(strFormated);
  }

  onKeypress(event: KeyboardEvent) {
    const e = event;
    if (e.key === 'Tab' || e.key === 'TAB') {
      return;
    }
    if ([8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A
      (e.keyCode === 65 && e.ctrlKey === true) ||
      // Allow: Ctrl+C
      (e.keyCode === 67 && e.ctrlKey === true) ||
      // Allow: Ctrl+V
      (e.keyCode === 86 && e.ctrlKey === true) ||
      // Allow: Ctrl+X
      (e.keyCode === 88 && e.ctrlKey === true)) {
      // let it happen, don't do anything
      return;
    }
    if (!['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', this.separator[this.currentLang]].includes(e.key)) {
      e.preventDefault();
    } else {
      if (['.', ','].includes(e.key) && this.hasFractionDigits(this.valueInput)) {
        e.preventDefault();
      }
    }
  }

  hasFractionDigits(value: string) {
    return this.getNumberFromString(value)?.toString()?.indexOf('.') !== -1;
  }

  onPaste(event: ClipboardEvent) {
    const regex = /[0-9]/g;
    const e = event;
    const pasteData = e.clipboardData.getData('text/plain');
    const afterRegex = pasteData
      .split('')
      .filter(k => !!k.match(regex) || k === this.separator[this.currentLang]);
    if (afterRegex.length === pasteData.length) {
      return;
    } else {
      e.preventDefault();
    }
  }

  handleFocus(focused: boolean) {
    if (!focused) {
      this.onBlur.emit();
    }
    this.focused = focused;
    return true;
  }

  handleFilled() {
    this.filled = this.focused || !!(this.valueInput?.toString().length > 0);
    if (this.filled) {
      this.el.nativeElement.classList.add('p-inputwrapper-filled');
    } else {
      this.el.nativeElement.classList.remove('p-inputwrapper-filled');
    }
  }

  getCaretPosition(ctrl: HTMLInputElement) {
    if (ctrl.selectionStart || ctrl.selectionStart === 0) {
      return {
        start: ctrl.selectionStart,
        end: ctrl.selectionEnd
      };
    } else {
      return {
        start: 0,
        end: 0
      };
    }
  }

  setCaretPosition(el: HTMLInputElement, positions: { start: number; end: number }) {
    if (el.setSelectionRange) {
      el.focus();
      el.setSelectionRange(positions.start, positions.end);
    }
  }
}
