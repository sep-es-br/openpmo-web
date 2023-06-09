import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportRoutingModule } from './report-routing.module';
import { ReportListComponent } from './report-list/report-list.component';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { CoreModule } from 'src/app/core/core.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReportViewComponent } from './report-view/report-view.component';


@NgModule({
  declarations: [ReportListComponent, ReportViewComponent],
  imports: [
    CommonModule,
    ReportRoutingModule,
    ComponentsModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class ReportModule { }
