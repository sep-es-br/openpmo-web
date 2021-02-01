import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CostAccountComponent } from './cost-account/cost-account.component';
import { WorkpackComponent } from './workpack.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: WorkpackComponent
      },
      {
        path: 'cost-account',
        component: CostAccountComponent
      },
      {
        path: 'schedule',
        loadChildren: () => import('./schedule/schedule.module').then(m => m.ScheduleModule)
      },
    ],
    runGuardsAndResolvers: 'always'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkpackRoutingModule { }
