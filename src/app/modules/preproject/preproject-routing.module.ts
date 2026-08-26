import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PreprojectComponent } from './preproject.component';
import { PreprojectFormComponent } from './preproject-form/preproject-form.component';
import { PreprojectDeliveryComponent } from './preproject-delivery/preproject-delivery.component';

const routes: Routes = [
  {
    path: 'delivery/new',
    component: PreprojectDeliveryComponent
  },
  {
    path: 'new',
    component: PreprojectFormComponent
  },
  {
    path: '',
    pathMatch: 'full',
    component: PreprojectComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PreprojectRoutingModule { }
