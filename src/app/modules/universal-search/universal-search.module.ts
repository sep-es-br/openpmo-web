import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UniversalSearchComponent } from './universal-search.component';
import { UniversalSearchRoutes } from './universal-search.routing';

@NgModule({
  imports: [
    CommonModule,
    UniversalSearchRoutes
  ],
  declarations: [
    UniversalSearchComponent
  ]
})
export class UniversalSearchModule { }
