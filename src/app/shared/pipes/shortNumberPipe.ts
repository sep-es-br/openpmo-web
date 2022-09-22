/* eslint-disable @typescript-eslint/prefer-for-of */
// short-number.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'shortNumber'
})
export class ShortNumberPipe implements PipeTransform {
  transform(value: any, lang: string, fractionSize = 1): any {
    if (value === null) { return null; }
    if (value === 0) { return '0'; }
    let abs = Math.abs(value);
    const rounder = Math.pow(10, fractionSize);
    let key = '';
    const powers = [
      { key: 'Q', value: Math.pow(10, 15) },
      { key: 'T', value: Math.pow(10, 12) },
      { key: 'B', value: Math.pow(10, 9) },
      { key: 'M', value: Math.pow(10, 6) },
      { key: (lang === 'pt' || lang === 'pt-BR') ? 'm' : 'k', value: 1000 }];
    for (let i = 0; i < powers.length; i++) {
      let reduced = abs / powers[i].value;
      reduced = Math.round((reduced * rounder)) / rounder;
      if (reduced >= 1) {
        abs = Number(reduced.toFixed(fractionSize));
        key = powers[i].key;
        break;
      }
    }
    if (key === '') {
      abs = Number(abs.toFixed(2));
    }
    return lang === 'pt' || lang === 'pt-BR' ? abs.toString().replace('.', ',') + key : abs + key;
  }
}
