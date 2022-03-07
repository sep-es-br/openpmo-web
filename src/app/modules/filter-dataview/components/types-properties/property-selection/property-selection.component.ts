import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-property-selection',
  templateUrl: './property-selection.component.html',
  styleUrls: ['./property-selection.component.scss']
})
export class PropertySelectionComponent implements OnInit {

  @Input() property: IFilterProperty;
  @Input() value: string | string[];
  @Output() changed = new EventEmitter();
  type = TypePropertyModelEnum;
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
