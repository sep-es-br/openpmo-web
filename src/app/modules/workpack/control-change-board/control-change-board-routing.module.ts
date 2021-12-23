import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ControlChangeBoardListComponent } from './control-change-board-list/control-change-board-list.component';
import { ControlChangeBoardMemberComponent } from './control-change-board-member/control-change-board-member.component';

const routes: Routes = [
  {
    path: '',
    component: ControlChangeBoardListComponent,
  },
  {
    path: 'member',
    component: ControlChangeBoardMemberComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ControlChangeBoardRouting { }
