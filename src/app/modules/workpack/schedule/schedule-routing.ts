import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ScheduleComponent } from './schedule.component';
import { StepComponent } from './step/step.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: ScheduleComponent
      },
      {
        path: 'step',
        component: StepComponent
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScheduleRoutingModule { }
