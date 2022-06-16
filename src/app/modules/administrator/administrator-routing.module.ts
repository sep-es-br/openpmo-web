import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdministratorListComponent } from './administrator-list/administrator-list.component';
import { AdministratorComponent } from './administrator/administrator.component';

const routes: Routes = [
  {
    path: '',
    component: AdministratorListComponent
  },
  {
    path: 'administrator',
    component: AdministratorComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministratorRoutingModule { 
}
