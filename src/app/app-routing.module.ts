import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './shared/guards/auth-guard';
import { HomeComponent } from './modules/home/home.component';
import { LoginComponent } from './modules/login/login.component';
import { AdminOfficeConfigComponent } from './modules/admin-office-config/admin-office-config.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'plan',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/plan/plan.module').then(m => m.PlanModule)
  },
  {
    path: 'workpack',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/workpack/workpack.module').then(m => m.WorkpackModule)
  },
  {
    path: 'workpack-model',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/workpack-model/workpack-model.module').then(m => m.WorkpackModelModule)
  },
  {
    path: 'offices',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/office/office.module').then(m => m.OfficeModule)
  },
  {
    path: 'configuration-office',
    canActivate: [ AuthGuard],
    component: AdminOfficeConfigComponent
  },
  {
    path: 'domains',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/domain/domain.module').then(m => m.DomainModule)
  },
  {
    path: 'stakeholder',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/stakeholder/stakeholder.module').then(m => m.StakeholderModule)
  },
  {
    path: 'organizations',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/organization/organization.module').then(m => m.OrganizationModule)
  },
  {
    path: 'measure-units',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/measure-unit/measure-unit.module').then(m => m.MeasureUnitModule)
  },
  {
    path: 'strategies',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/strategy/strategy.module').then(m => m.StrategyModule)
  },
  {
    path: 'filter-dataview',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/filter-dataview/filter-dataview.module').then(m => m.FilterDataviewModule)
  },
  {
    path: 'config/filter-dataview',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/filter-dataview/filter-dataview.module').then(m => m.FilterDataviewModule)
  },
  {
    path: 'persons',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/person/person.module').then(m => m.PersonModule)
  },
  {
    path: 'administrators',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/administrator/administrator.module').then(m => m.AdministratorModule)
  },
  {
    path: 'ccbmember-baselines-view',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/ccbmember-baselines-view/ccbmember-baselines-view.module')
      .then(m => m.CCBMemberBaselinesViewModule)
  },
  {
    path: 'report-models',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/report-model/report-model.module').then(m => m.ReportModelModule)
  },
  {
    path: 'reports',
    canActivate: [ AuthGuard ],
    loadChildren: () => import('./modules/report/report.module').then(m => m.ReportModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true, relativeLinkResolution: 'legacy', onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
