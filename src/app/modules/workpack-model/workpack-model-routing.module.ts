import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WorkpackModelComponent } from './workpack-model.component';

const routes: Routes = [
  {
    path: '',
    component: WorkpackModelComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkpackModelRoutingModule { }
