import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StrategyListComponent } from './strategy-list/strategy-list.component';
import { StrategynRoutingModule } from './strategy-routing.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { CoreModule } from 'src/app/core/core.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StrategyComponent } from './strategy/strategy.component';
import { CostAccountModelComponent } from './components/cost-account-model/cost-account-model.component';



@NgModule({
  declarations: [StrategyListComponent, StrategyComponent, CostAccountModelComponent],
  imports: [
    CommonModule,
    StrategynRoutingModule,
    ComponentsModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class StrategyModule { }
