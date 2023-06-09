import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-property-unit-selection',
  templateUrl: './property-unit-selection.component.html',
  styleUrls: ['./property-unit-selection.component.scss']
})
export class PropertyUnitSelectionComponent implements OnInit {

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