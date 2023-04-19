import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MilestoneStatusEnum } from 'src/app/shared/enums/MilestoneStatusEnum';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-property-text',
  templateUrl: './property-text.component.html',
  styleUrls: ['./property-text.component.scss']
})
export class PropertyTextComponent implements OnInit {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();
  responsive: boolean;
  milestoneStatusEnum = MilestoneStatusEnum;

  constructor(
    private responsiveSrv: ResponsiveService,
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
  }

  ngOnInit(): void {

  }

}

