import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UniversalSearchComponent } from './universal-search.component';
import { UniversalSearchRoutes } from './universal-search.routing';
import { FormsModule } from '@angular/forms';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    UniversalSearchRoutes,
    FormsModule,
    ComponentsModule,
    TranslateModule
  ],
  declarations: [
    UniversalSearchComponent
  ]
})
export class UniversalSearchModule { }
