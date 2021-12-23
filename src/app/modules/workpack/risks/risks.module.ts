import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule } from './../../../shared/components/components.module';
import { CoreModule } from './../../../core/core.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RisksRoutingModule } from './risks-routing.module';
import { RiskComponent } from './risk/risk.component';
import { RiskResponseComponent } from './risk-response/risk-response.component';


@NgModule({
  declarations: [RiskComponent, RiskResponseComponent],
  imports: [
    CommonModule,
    RisksRoutingModule,
    CoreModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class RisksModule { }
