import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoreModule } from './../../core/core.module';
import { ComponentsModule } from './../../shared/components/components.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CCBMemberBaselinesViewRoutingModule } from './ccbmember-baselines-view-routing.module';
import { BaselinesListComponent } from './baselines-list/baselines-list.component';
import { BaselineViewComponent } from './baseline-view/baseline-view.component';


@NgModule({
  declarations: [BaselinesListComponent, BaselineViewComponent],
  imports: [
    CommonModule,
    CCBMemberBaselinesViewRoutingModule,
    ComponentsModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class CCBMemberBaselinesViewModule { }
