import { Routes, RouterModule } from '@angular/router';
import { UniversalSearchComponent } from './universal-search.component';

const routes: Routes = [
  { 
    path: '',
    pathMatch: 'full',
    component: UniversalSearchComponent
   },
];

export const UniversalSearchRoutes = RouterModule.forChild(routes);
