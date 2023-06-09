import { takeUntil } from 'rxjs/operators';
import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { MilestoneStatusEnum } from 'src/app/shared/enums/MilestoneStatusEnum';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { MilestoneChangeService } from 'src/app/shared/services/milestone-change.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Subject } from 'rxjs';

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
  $destroy = new Subject();

  constructor(
    private responsiveSrv: ResponsiveService,
    private milestoneChangeDateSrv: MilestoneChangeService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.milestoneChangeDateSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      if (value !== null && this.property && this.property.milestoneData) {
        this.property.milestoneData.delayInDays = value;
      }
    });
  }

  ngOnInit(): void {

  }

  ngOnDestroy() {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

}

