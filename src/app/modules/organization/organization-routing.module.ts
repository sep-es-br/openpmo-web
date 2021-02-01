import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrganizationListComponent } from './organization-list/organization-list.component';
import { OrganizationComponent } from './organization/organization.component';

const routes: Routes = [
 {
     path: '',
     component: OrganizationListComponent
 },
 {
     path: 'organization',
     component: OrganizationComponent
 },


]
;

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class OrganizationRoutingModule { }
