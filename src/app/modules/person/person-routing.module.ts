import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
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
  
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PersonRoutingModule { }
