import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MeasureUnitComponent } from './measure-unit.component';

const routes: Routes = [
 {
     path: '',
     component: MeasureUnitComponent
 },

]
;

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class MeasureUnitRoutingModule { }
