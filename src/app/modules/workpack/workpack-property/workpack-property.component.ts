import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';

@Component({
  selector: 'app-workpack-property',
  templateUrl: './workpack-property.component.html',
  styleUrls: ['./workpack-property.component.scss']
})
export class WorkpackPropertyComponent {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();

  types = TypePropertyModelEnum;

}
