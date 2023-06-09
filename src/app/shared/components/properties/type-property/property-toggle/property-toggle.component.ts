import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';

@Component({
  selector: 'app-property-toggle',
  templateUrl: './property-toggle.component.html',
  styleUrls: ['./property-toggle.component.scss']
})
export class PropertyToggleComponent implements OnInit {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

}