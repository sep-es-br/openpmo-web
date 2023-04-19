import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-property-text',
  templateUrl: './property-text.component.html',
  styleUrls: ['./property-text.component.scss']
})
export class PropertyTextComponent implements OnInit {

  @Input() property: IFilterProperty;
  @Input() value;
  @Output() changed = new EventEmitter();
  responsive: boolean;

  constructor(
    private responsiveSrv: ResponsiveService,
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
