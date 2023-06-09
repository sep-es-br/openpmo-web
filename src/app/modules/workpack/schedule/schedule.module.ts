import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScheduleComponent } from '../schedule/schedule.component';
import { ScheduleRoutingModule } from './schedule-routing';
import { CoreModule } from 'src/app/core/core.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StepComponent } from './step/step.component';

@NgModule({
  declarations: [ScheduleComponent, StepComponent],
  imports: [
    CommonModule,
    ScheduleRoutingModule,
    CoreModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class ScheduleModule { }
