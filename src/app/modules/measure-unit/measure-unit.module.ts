import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeasureUnitRoutingModule } from './measure-unit-routing.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { CoreModule } from 'src/app/core/core.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MeasureUnitComponent } from './measure-unit.component';



@NgModule({
  declarations: [MeasureUnitComponent],
  imports: [
    CommonModule,
    CommonModule,
    MeasureUnitRoutingModule,
    ComponentsModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class MeasureUnitModule { }
