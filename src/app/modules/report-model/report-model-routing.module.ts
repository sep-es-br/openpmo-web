import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReportModelComponent } from './report-model/report-model.component';

const routes: Routes = [
  {
    path: 'report-model',
    component: ReportModelComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportModelRoutingModule { }
