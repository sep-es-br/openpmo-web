import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';

@Component({
  selector: 'app-property-toggle',
  templateUrl: './property-toggle.component.html',
  styleUrls: ['./property-toggle.component.scss']
})
export class PropertyToggleComponent implements OnInit {

  @Input() property: IFilterProperty;
  @Input() value: boolean;
  @Output() changed = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  handleChangedValue() {
    this.changed.next({value: this.value})
  }

}
