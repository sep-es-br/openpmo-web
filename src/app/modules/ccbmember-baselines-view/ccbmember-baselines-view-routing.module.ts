import { BaselineViewComponent } from './baseline-view/baseline-view.component';
import { BaselinesListComponent } from './baselines-list/baselines-list.component';
import { NgModule, Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: BaselinesListComponent
  },
  {
    path: 'baseline',
    component: BaselineViewComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CCBMemberBaselinesViewRoutingModule { }
