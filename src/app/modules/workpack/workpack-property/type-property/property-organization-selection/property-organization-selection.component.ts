import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-property-organization-selection',
  templateUrl: './property-organization-selection.component.html',
  styleUrls: ['./property-organization-selection.component.scss']
})
export class PropertyOrganizationSelectionComponent implements OnInit {

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

  clearErrorMessage() {
    this.property.invalid = false;
    this.property.message = '';
  }

}
