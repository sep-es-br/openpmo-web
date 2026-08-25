import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PreprojectComponent } from './preproject.component';

const routes: Routes = [
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
