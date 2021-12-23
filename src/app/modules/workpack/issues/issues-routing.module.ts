import { IssueResponseComponent } from './issue-response/issue-response.component';
import { IssueComponent } from './issue/issue.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: IssueComponent
      },
      {
        path: 'response',
        component: IssueResponseComponent
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IssuesRoutingModule { }
