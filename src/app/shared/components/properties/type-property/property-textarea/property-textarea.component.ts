import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';

@Component({
  selector: 'app-property-textarea',
  templateUrl: './property-textarea.component.html',
  styleUrls: ['./property-textarea.component.scss']
})
export class PropertyTextareaComponent implements OnInit {

  @Input() property: PropertyTemplateModel;
  @Input() form: FormGroup;
  @Input() controlName: string;
  @Input() inputId: string;
  @Input() label: string;
  @Input() required = false;
  @Input() rows = 1;
  @Output() changed = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

}
