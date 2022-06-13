import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-property-integer',
  templateUrl: './property-integer.component.html',
  styleUrls: ['./property-integer.component.scss']
})
export class PropertyIntegerComponent implements OnInit {

  @Input() property: IFilterProperty;
  @Input() value: string | number | boolean | string[] | Date | number[];
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

  handleChangedValue(event) {
    this.value = event.value;
    this.changed.next({value: this.value})
  }
}
