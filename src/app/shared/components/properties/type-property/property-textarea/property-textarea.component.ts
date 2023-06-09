import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';

@Component({
  selector: 'app-property-textarea',
  templateUrl: './property-textarea.component.html',
  styleUrls: ['./property-textarea.component.scss']
})
export class PropertyTextareaComponent implements OnInit {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

}