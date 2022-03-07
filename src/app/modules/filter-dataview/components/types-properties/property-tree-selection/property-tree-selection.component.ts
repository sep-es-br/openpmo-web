import { TreeNode } from 'primeng/api';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-property-tree-selection',
  templateUrl: './property-tree-selection.component.html',
  styleUrls: ['./property-tree-selection.component.scss']
})
export class PropertyTreeSelectionComponent implements OnInit {

  @Input() property: IFilterProperty;
  @Input() value: TreeNode | TreeNode[];
  @Output() changed = new EventEmitter();
  responsive: boolean;
  $destroy = new Subject();
  labelButtonLocalitySelected: string;
  showIconButton: boolean;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService
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
    this.setLabelButton();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLabelButton(event?) {
    if (Array.isArray(this.value)) {
      if (this.value && this.value.length === 1 ){
        const selecteds = this.value as TreeNode[];
        this.labelButtonLocalitySelected = selecteds[0].label;
        this.showIconButton = false;
      }
      if (this.value && this.value.length > 1 ){
        this.labelButtonLocalitySelected = `${this.value.length} ${this.translateSrv.instant('selectedsLocalities')}`;
        this.showIconButton = false;
      }
      if (!this.value || (this.value && this.value.length === 0) ){
        this.labelButtonLocalitySelected = this.translateSrv.instant('selectDefaultValue');
        this.showIconButton = true;
      }
    } else {
      const selected = this.value as TreeNode;
      this.labelButtonLocalitySelected = selected.label;
      this.showIconButton = false;
    }
  }

  handleChangedValue() {
    this.changed.next({value: this.value})
  }

}
