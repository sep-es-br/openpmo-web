import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { PreprojectRoutingModule } from './preproject-routing.module';
import { PreprojectComponent } from './preproject.component';
import { PreprojectToolbarComponent } from './preproject-toolbar/preproject-toolbar.component';
import { CoreModule } from 'src/app/core/core.module';

@NgModule({
  declarations: [PreprojectComponent, PreprojectToolbarComponent],
  imports: [
    CommonModule,
    ComponentsModule,
    CoreModule,
    TranslateModule,
    PreprojectRoutingModule
  ]
})
export class PreprojectModule { }
