// short-number.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'shortNumber'
})
export class ShortNumberPipe implements PipeTransform {
  transform(value: any, lang?: any, fractionSize = 1): any {
    if (value === null) return null;
    if (value === 0) return "0";
    var abs = Math.abs(value);
    var rounder = Math.pow(10, fractionSize);
    var key = '';
    var powers = [
      { key: "Q", value: Math.pow(10, 15) }, 
      { key: "T", value: Math.pow(10, 12) }, 
      { key: "B", value: Math.pow(10, 9) }, 
      { key: "M", value: Math.pow(10, 6) }, 
      { key: lang === 'pt' ? "m" : "k", value: 1000 }];
    for (var i = 0; i < powers.length; i++) {
      var reduced = abs / powers[i].value;
      reduced = Math.round((reduced * rounder)) / rounder;
      if (reduced >= 1) {
        abs = fractionSize === 2 ? Math.round(reduced) : reduced;
        key = powers[i].key;
        break;
      }
    }
    return abs + key;
  }
}