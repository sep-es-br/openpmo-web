import { ShortNumberPipe } from './shortNumberPipe';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormatarTelefonePipe } from './formatarTelefonePipe';
import { FromStringArrayToSelectItemPipe } from './fromStringArrayToSelectItemPipe';
import { FormatNamePipe } from './format-name.pipe';

@NgModule({
  declarations: [
    FormatarTelefonePipe,
    FromStringArrayToSelectItemPipe,
    ShortNumberPipe,
    FormatNamePipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    FormatarTelefonePipe,
    FromStringArrayToSelectItemPipe,
    ShortNumberPipe,
    FormatNamePipe
  ],
  providers: [ShortNumberPipe]
})
export class PipesModule { }
