import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-property-organization-selection',
  templateUrl: './property-organization-selection.component.html',
  styleUrls: ['./property-organization-selection.component.scss']
})
export class PropertyOrganizationSelectionComponent implements OnInit {

  @Input() property: IFilterProperty;
  @Input() value: string | number | boolean | string[] | Date | number[];
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

  handleChangedValue() {
    this.changed.next({value: this.value})
  }

}
