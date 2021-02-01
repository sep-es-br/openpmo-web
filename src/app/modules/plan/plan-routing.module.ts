import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlanPermissionsListComponent } from './plan-permissions-list/plan-permissions-list.component';
import { PlanPermissionsComponent } from './plan-permissions/plan-permissions.component';
import { PlanComponent } from './plan.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: PlanComponent
      },
      {
        path: 'permission',
        children: [
          {
            path: '',
            component: PlanPermissionsListComponent
          },
          {
            path: 'detail',
            component: PlanPermissionsComponent
          },
        ]
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlanRoutingModule { }
