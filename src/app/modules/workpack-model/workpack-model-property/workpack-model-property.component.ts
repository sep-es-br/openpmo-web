import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Calendar } from 'primeng/calendar';

import { IconPropertyWorkpackModelEnum } from 'src/app/shared/enums/IconPropertyWorkpackModelEnum';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { TypePropertyWorkpackModelEnum } from 'src/app/shared/enums/TypePropertyWorkpackModelEnum';
import * as moment from 'moment';

@Component({
  selector: 'app-workpack-model-property',
  templateUrl: './workpack-model-property.component.html',
  styleUrls: ['./workpack-model-property.component.scss']
})
export class WorkpackModelPropertyComponent implements OnDestroy, AfterViewInit {

  @ViewChild(Calendar) calendarComponent: Calendar;
  @Input() property: IWorkpackModelProperty;
  @Output() delete = new EventEmitter();
  @Output() changed = new EventEmitter();
  IconsEnum = IconPropertyWorkpackModelEnum;
  responsive = false;
  $destroy = new Subject();
  calendarFormat: string;
  yearRange: string;

  constructor(
    private translateSrv: TranslateService,
    private responsiveSrv: ResponsiveService
  ) {
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(responsive => this.responsive = responsive);
    const today = moment();
    const yearStart = today.year();
    this.yearRange = (yearStart-1).toString() + ':'+ (yearStart+15).toString();
  }

  ngAfterViewInit(): void {
    if (this.property?.type === TypePropertyWorkpackModelEnum.DateModel) {
      this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
        setTimeout(() => {
          this.calendarComponent?.ngOnInit();
          this.calendarComponent.dateFormat = this.translateSrv.instant('dateFormat');
          this.calendarComponent.updateInputfield();
        }, 150)
      );
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  checkDefaultValue() {
    if ([ TypePropertyWorkpackModelEnum.LocalitySelectionModel, TypePropertyWorkpackModelEnum.OrganizationSelectionModel ]
      .includes(TypePropertyWorkpackModelEnum[this.property.type])) {
      if (this.property?.defaults) {
        const isArray = this.property?.defaults instanceof Array;
        if (this.property.multipleSelection && !isArray) {
          this.property.defaults = [ this.property.defaults as any ];
        }
        if (!this.property.multipleSelection && isArray) {
          this.property.defaults = (this.property.defaults as any[]).shift();
        }
        this.property.selectedLocalities = this.translateSrv.instant('selectDefaultValue');
        this.property.showIconButtonSelectLocality = true;
      }
    } else {
      const isArray = this.property?.defaultValue instanceof Array;
      if (this.property.multipleSelection && !isArray) {
        this.property.defaultValue = this.property.defaultValue ? [ this.property.defaultValue as any ] : [];
      }
      if (!this.property.multipleSelection && isArray) {
        this.property.defaultValue = (this.property.defaultValue as any[]).shift();
      }
    }
  }

  checkIfRemovedValueIsDefault({ value }) {
    const isArray = this.property?.defaultValue instanceof Array;
    if (isArray) {
      const arr = this.property?.defaultValue as string[];
      if (arr.includes(value.trim())) {
        arr.splice(arr.findIndex(r => r === value.trim()), 1);
        this.property.defaultValue = Array.from(arr);
      }
    } else if (!isArray && this.property.defaultValue === value.trim()) {
      this.property.defaultValue = '';
    }
  }

  handleCollapseChanged(collapsed: boolean) {
    this.property.isCollapsed = collapsed;
  }
}
