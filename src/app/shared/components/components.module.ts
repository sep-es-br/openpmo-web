import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card/card.component';
import { CardItemComponent } from './card-item/card-item.component';
import { CoreModule } from 'src/app/core/core.module';
import { InputMessageComponent } from './input-message/input-message.component';
import { SaveButtonComponent } from './save-button/save-button.component';
import { CardItemPermissionComponent } from './card-item-permission/card-item-permission.component';
import { PipesModule } from '../pipes/pipes.module';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { InputUnitMeasureComponent } from './input-unit-measure/input-unit-measure.component';
import { ConfigDataViewPanelComponent } from './config-data-view-panel/config-data-view-panel.component';
import { AvatarModule } from 'primeng/avatar';
import { BaselineCardItemComponent } from './baseline-card-item/baseline-card-item.component';
import { CardItemFileComponent } from './card-item-file/card-item-file.component';

@NgModule({
  declarations: [
    CardComponent,
    CardItemComponent,
    InputMessageComponent,
    SaveButtonComponent,
    CardItemPermissionComponent,
    ProgressBarComponent,
    InputUnitMeasureComponent,
    ConfigDataViewPanelComponent,
    BaselineCardItemComponent,
    CardItemFileComponent,
  ],
  imports: [
    CommonModule,
    CoreModule,
    PipesModule,
    AvatarModule,
  ],
  exports: [
    PipesModule,
    CardComponent,
    CardItemComponent,
    CardItemPermissionComponent,
    InputMessageComponent,
    SaveButtonComponent,
    ProgressBarComponent,
    InputUnitMeasureComponent,
    ConfigDataViewPanelComponent,
    BaselineCardItemComponent,
    CardItemFileComponent
  ]
})
export class ComponentsModule { }
