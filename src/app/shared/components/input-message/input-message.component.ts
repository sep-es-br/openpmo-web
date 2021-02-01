import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-input-message',
  templateUrl: './input-message.component.html',
  styleUrls: ['./input-message.component.scss']
})
export class InputMessageComponent {

  @Input() form: FormGroup;
  @Input() field: string;

  constructor(
  ) { }

  isInvalid() {
    try {
      return !this.form.get(this.field).valid && this.form.get(this.field).touched;
    } catch (error) {
      return false;
    }
  }

  message() {
    let message = 'Informação inválida';

    if (this.form.get(this.field)?.errors?.email) {
      message = 'Informe um email válido';
    } else if (this.form.get(this.field)?.errors?.required) {
      message = 'Campo obrigatório';
    } else if (this.form.get(this.field)?.errors?.maxlength) {
      message = `Tamanho máximo: ${this.form.get(this.field).errors.maxlength.requiredLength} caracteres`;
    }

    return message;
  }
}
