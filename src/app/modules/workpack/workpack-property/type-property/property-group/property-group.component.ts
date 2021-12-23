import { ResponsiveService } from './../../../../../shared/services/responsive.service';
import { TypePropertyModelEnum } from './../../../../../shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

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

  constructor(
    private responsiveSrv: ResponsiveService
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
  }

  ngOnInit(): void {
  }

}
