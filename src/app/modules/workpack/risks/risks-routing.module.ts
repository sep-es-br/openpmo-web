import { RiskResponseComponent } from './risk-response/risk-response.component';
import { RiskComponent } from './risk/risk.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: RiskComponent
      },
      {
        path: 'response',
        component: RiskResponseComponent
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RisksRoutingModule { }
