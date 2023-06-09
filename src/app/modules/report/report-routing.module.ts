import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReportListComponent } from './report-list/report-list.component';
import { ReportViewComponent } from './report-view/report-view.component';

const routes: Routes = [
  {
    path: '',
    component: ReportListComponent
  },
  {
    path: 'report-view',
    component: ReportViewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule { }
