import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Calendar } from 'primeng/calendar';

import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-property-date',
  templateUrl: './property-date.component.html',
  styleUrls: ['./property-date.component.scss']
})
export class PropertyDateComponent implements OnInit, OnDestroy {

  @ViewChild(Calendar) calendarComponent: Calendar;
  @Input() property: IFilterProperty;
  @Input() value: string | number | boolean | string[] | Date | number[];
  @Output() changed = new EventEmitter();
  defaultValue: Date;
  dateMin: Date;
  dateMax: Date;
  responsive: boolean;
  $destroy = new Subject();
  calendarFormat: string;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      setTimeout(() =>
      {
        this.calendarComponent?.ngOnInit();
        this.calendarComponent.dateFormat = this.translateSrv.instant('dateFormat');
        this.calendarComponent.updateInputfield();
      }, 150)
    );
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  ngOnInit(): void {
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    this.loadDates();
  }

  loadDates() {
    const defaultValueDate = this.property.defaultValue && this.property.defaultValue.toLocaleString();
    this.defaultValue = defaultValueDate && new Date(defaultValueDate);
    this.dateMin = this.property.min && new Date(this.property.min);
    this.dateMax = this.property.max && new Date(this.property.max);
  }

  handleChangedValue() {
    this.changed.next({value: this.value})
  }

}
