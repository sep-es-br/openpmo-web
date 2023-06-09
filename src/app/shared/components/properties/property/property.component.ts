import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';

@Component({
  selector: 'app-property',
  templateUrl: './property.component.html',
  styleUrls: ['./property.component.scss']
})
export class PropertyComponent {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();

  types = TypePropertyModelEnum;

}

