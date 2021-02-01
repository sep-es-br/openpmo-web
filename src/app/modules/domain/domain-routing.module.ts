import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DomainListComponent } from './domain-list/domain-list.component';
import { DomainLocalityComponent } from './domain-locality/domain-locality.component';
import { DomainComponent } from './domain/domain.component';

const routes: Routes = [
    {
        path: '',
        component: DomainListComponent
    },
    {
        path: 'detail',
        component: DomainComponent
    },
    {
        path: 'locality',
        component: DomainLocalityComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})

export class DomainRoutingModule {}
