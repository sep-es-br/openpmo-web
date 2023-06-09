import { ResponsiveService } from './../../../../../shared/services/responsive.service';
import { TypePropertyModelEnum } from './../../../../../shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import {ConfigDataViewService} from "../../../../../shared/services/config-dataview.service";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";

@Component({
  selector: 'app-property-group',
  templateUrl: './property-group.component.html',
  styleUrls: ['./property-group.component.scss']
})
export class PropertyGroupComponent implements OnInit {

  @Input() groupProperty: PropertyTemplateModel;
  @Output() changed = new EventEmitter();

  types = TypePropertyModelEnum;
  collapsed = true;
  responsive: boolean;
  $destroy = new Subject();

  constructor(
    private responsiveSrv: ResponsiveService,
    private configDataSrv: ConfigDataViewService
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });

    this.configDataSrv.observableCollapsePanelsStatus
      .pipe(takeUntil(this.$destroy))
      .subscribe(panelStatus => {
        this.collapsed = panelStatus === 'collapse';
      });
  }

  ngOnInit(): void {
  }

}
