import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UniversalSearchComponent } from './universal-search.component';
import { UniversalSearchRoutes } from './universal-search.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { TranslateModule } from '@ngx-translate/core';
import { DataViewModule } from 'primeng/dataview';
import { SearchItemCardComponent } from '../../shared/components/search-item-card/search-item-card.component';

@NgModule({
  imports: [
    CommonModule,
    UniversalSearchRoutes,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    TranslateModule,
    DataViewModule
  ],
  declarations: [
    UniversalSearchComponent
  ]
})
export class UniversalSearchModule { }
