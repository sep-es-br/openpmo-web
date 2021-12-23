import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreModule } from 'src/app/core/core.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ControlChangeBoardRouting } from './control-change-board-routing.module';
import { ControlChangeBoardListComponent } from './control-change-board-list/control-change-board-list.component';
import { ControlChangeBoardMemberComponent } from './control-change-board-member/control-change-board-member.component';



@NgModule({
  declarations: [ControlChangeBoardListComponent, ControlChangeBoardMemberComponent],
  imports: [
    CommonModule,
    CoreModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
    ControlChangeBoardRouting
  ]
})
export class ControlChangeBoardModule { }
