import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-property-tree-selection',
  templateUrl: './property-tree-selection.component.html',
  styleUrls: ['./property-tree-selection.component.scss']
})
export class PropertyTreeSelectionComponent implements OnInit {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();
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
