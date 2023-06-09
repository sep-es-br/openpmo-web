import { AbstractControl, FormGroup } from '@angular/forms';

export class MinLengthTextCustomValidator {
  static minLengthText(text: AbstractControl) {
    const valid = text.value && text.value.trim().length > 0;
    if (valid) return null;

    return { minLengthTextInvalid: true };
  }

}
