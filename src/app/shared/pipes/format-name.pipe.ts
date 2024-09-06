import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatName'
})
export class FormatNamePipe implements PipeTransform {

  transform(value: string): string {
    debugger
    if (!value) return value;

    const names = value.trim().split(' ');
    if (names.length === 1) {
      return this.capitalizeFirstLetter(names[0]);
    }

    const firstName = this.capitalizeFirstLetter(names[0]);
    const lastName = this.capitalizeFirstLetter(names[names.length - 1]);

    return `${firstName} ${lastName}`;
  }

  private capitalizeFirstLetter(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }
}