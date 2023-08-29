import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StrategyListComponent } from './strategy-list/strategy-list.component';
import { StrategyComponent } from './strategy/strategy.component';
import { CostAccountModelComponent } from './components/cost-account-model/cost-account-model.component';

const routes: Routes = [
    {
        path: '',
        component: StrategyListComponent
    },
    {
        path: 'strategy',
        component: StrategyComponent
    },
    {
        path: 'strategy/cost-account-model',
        component: CostAccountModelComponent
    }
]
    ;

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class StrategynRoutingModule { }
