import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormatarTelefonePipe } from './formatarTelefonePipe';
import { FromStringArrayToSelectItemPipe } from './fromStringArrayToSelectItemPipe';

@NgModule({
  declarations: [
    FormatarTelefonePipe,
    FromStringArrayToSelectItemPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    FormatarTelefonePipe,
    FromStringArrayToSelectItemPipe
  ]
})
export class PipesModule { }
