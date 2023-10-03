import { BaselineComponent } from './baseline/baseline.component';
import { ProcessComponent } from './process/process.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CostAccountComponent } from './cost-account/cost-account.component';
import { WorkpackComponent } from './workpack.component';
import { SharingComponent } from './sharing/sharing.component';
import { BaselineCancellingComponent } from './baseline-cancelling/baseline-cancelling.component';
import { JournalComponent } from './journal/journal.component';

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
      {
        path: 'risks',
        loadChildren: () => import('./risks/risks.module').then(m => m.RisksModule)
      },
      {
        path: 'issues',
        loadChildren: () => import('./issues/issues.module').then(m => m.IssuesModule)
      },
      {
        path: 'processes',
        component: ProcessComponent
      },
      {
        path: 'sharing',
        component: SharingComponent
      },
      {
        path: 'change-control-board',
        loadChildren: () => import('./control-change-board/control-change-board.module').then(m => m.ControlChangeBoardModule)
      },
      {
        path: 'baseline',
        component: BaselineComponent
      },
      {
        path: 'baseline-cancelling',
        component: BaselineCancellingComponent
      },
      {
        path: 'journal',
        component: JournalComponent
      }
    ],
    runGuardsAndResolvers: 'always'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkpackRoutingModule { }
