import { Pipe, PipeTransform } from '@angular/core';
import { SelectItem } from 'primeng/api';

@Pipe({
  name: 'toSelectItem'
})
export class FromStringArrayToSelectItemPipe implements PipeTransform {

  transform = (strArray: string[]): SelectItem[] => strArray?.map(s => ({ label: s.trim(), value: s.trim() }));

}
