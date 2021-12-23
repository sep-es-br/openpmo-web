import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdministratorListComponent } from './administrator/administrator-list/administrator-list.component';
import { AdministratorComponent } from './administrator/administrator/administrator.component';
import { PersonListComponent } from './person-list/person-list.component';
import { PersonProfileComponent } from './person-profile/person-profile.component';
import { PersonComponent } from './person/person.component';

const routes: Routes = [
  {
    path: '',
    component: PersonListComponent
  },
  {
    path: 'person',
    component: PersonComponent
  },
  {
    path: 'profile',
    component: PersonProfileComponent
  },
  {
    path: 'administrators',
    component: AdministratorListComponent
  },
  {
    path: 'administrators/administrator',
    component: AdministratorComponent
  },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PersonRoutingModule { }
