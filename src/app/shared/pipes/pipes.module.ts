import { ShortNumberPipe } from './shortNumberPipe';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormatarTelefonePipe } from './formatarTelefonePipe';
import { FromStringArrayToSelectItemPipe } from './fromStringArrayToSelectItemPipe';
import { FormatNamePipe } from './format-name.pipe';
import { WorkpackStatusConfigPipe } from './workpackStatusConfig.pipe';

@NgModule({
  declarations: [
    FormatarTelefonePipe,
    FromStringArrayToSelectItemPipe,
    ShortNumberPipe,
    FormatNamePipe,
    WorkpackStatusConfigPipe,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    FormatarTelefonePipe,
    FromStringArrayToSelectItemPipe,
    ShortNumberPipe,
    FormatNamePipe,
    WorkpackStatusConfigPipe
  ],
  providers: [ShortNumberPipe]
})
export class PipesModule { }
