import { ShortNumberPipe } from './shortNumberPipe';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormatarTelefonePipe } from './formatarTelefonePipe';
import { FromStringArrayToSelectItemPipe } from './fromStringArrayToSelectItemPipe';

@NgModule({
  declarations: [
    FormatarTelefonePipe,
    FromStringArrayToSelectItemPipe,
    ShortNumberPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    FormatarTelefonePipe,
    FromStringArrayToSelectItemPipe,
    ShortNumberPipe
  ],
  providers: [ShortNumberPipe]
})
export class PipesModule { }
