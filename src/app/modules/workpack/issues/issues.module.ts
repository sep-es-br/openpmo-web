import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule } from './../../../shared/components/components.module';
import { CoreModule } from './../../../core/core.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IssuesRoutingModule } from './issues-routing.module';
import { IssueComponent } from './issue/issue.component';
import { IssueResponseComponent } from './issue-response/issue-response.component';


@NgModule({
  declarations: [IssueComponent, IssueResponseComponent],
  imports: [
    CommonModule,
    IssuesRoutingModule,
    CoreModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class IssuesModule { }
