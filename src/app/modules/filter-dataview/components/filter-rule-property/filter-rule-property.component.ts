import { TypePropertyModelEnum } from './../../../../shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from './../../../../shared/models/PropertyTemplateModel';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-filter-rule-property',
  templateUrl: './filter-rule-property.component.html',
  styleUrls: ['./filter-rule-property.component.scss']
})
export class FilterRulePropertyComponent implements OnInit {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();

  types = TypePropertyModelEnum;

  ngOnInit() {
  }

}