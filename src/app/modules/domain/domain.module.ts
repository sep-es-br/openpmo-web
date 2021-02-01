import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomainListComponent } from './domain-list/domain-list.component';
import { DomainRoutingModule } from './domain-routing.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { CoreModule } from 'src/app/core/core.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DomainComponent } from './domain/domain.component';
import { DomainLocalityComponent } from './domain-locality/domain-locality.component';



@NgModule({
  declarations: [DomainListComponent, DomainComponent, DomainLocalityComponent],
  imports: [
    CommonModule,
    DomainRoutingModule,
    ComponentsModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class DomainModule { }
