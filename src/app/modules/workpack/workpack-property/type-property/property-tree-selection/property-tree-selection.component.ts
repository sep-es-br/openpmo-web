import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-property-tree-selection',
  templateUrl: './property-tree-selection.component.html',
  styleUrls: ['./property-tree-selection.component.scss']
})
export class PropertyTreeSelectionComponent implements OnInit, OnDestroy {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();
  responsive: boolean;
  $destroy = new Subject();

  constructor(
    private responsiveSrv: ResponsiveService,
    public translateSrv: TranslateService,
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      setTimeout(() =>
      {
        this.setLabelButton();
      }, 150)
    );
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLabelButton(event?) {
    if (Array.isArray(this.property.localitiesSelected)) {
      if (this.property.localitiesSelected && this.property.localitiesSelected.length === 1 ){
        this.property.labelButtonLocalitySelected = this.property.localitiesSelected[0].label;
        this.property.showIconButton = false;
      }
      if (this.property.localitiesSelected && this.property.localitiesSelected.length > 1 ){
        this.property.labelButtonLocalitySelected = `${this.property.localitiesSelected.length} ${this.translateSrv.instant('selectedsLocalities')}`;
        this.property.showIconButton = false;
      }
      if (!this.property.localitiesSelected || (this.property.localitiesSelected && this.property.localitiesSelected.length === 0) ){
        this.property.labelButtonLocalitySelected = this.translateSrv.instant('selectDefaultValue');
        this.property.showIconButton = true;
      }
    } else {
      this.property.labelButtonLocalitySelected = this.property.localitiesSelected.label;
      this.property.showIconButton = false;
    }
  }

}
