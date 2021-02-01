import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OfficeListComponent } from './office-list/office-list.component';
import { OfficePermissionsListComponent } from './office-permissions/office-permissions-list/office-permissions-list.component';
import { OfficePermissionsComponent } from './office-permissions/office-permissions.component';
import { OfficeComponent } from './office/office.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: OfficeListComponent
      },
      {
        path: 'office',
        component: OfficeComponent
      },
      {
        path: 'permission',
        children: [
          {
            path: '',
            component: OfficePermissionsListComponent
          },
          {
            path: 'detail',
            component: OfficePermissionsComponent
          },
        ]
      },
    ]
  },

];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class OficceRoutingModule { }
