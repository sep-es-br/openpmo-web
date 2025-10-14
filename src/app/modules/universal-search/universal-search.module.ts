import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UniversalSearchComponent } from './universal-search.component';
import { UniversalSearchRoutes } from './universal-search.routing';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    UniversalSearchRoutes,
    FormsModule
  ],
  declarations: [
    UniversalSearchComponent
  ]
})
export class UniversalSearchModule { }
