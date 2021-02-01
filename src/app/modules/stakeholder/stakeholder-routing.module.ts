import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StakeholderOrganizationComponent } from './stakeholder-organization/stakeholder-organization.component';
import { StakeholderPersonComponent } from './stakeholder-person/stakeholder-person.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'person',
        component: StakeholderPersonComponent
      },
      {
        path: 'organization',
        component: StakeholderOrganizationComponent
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StakeholderRoutingModule { }
