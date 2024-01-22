import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Calendar } from 'primeng/calendar';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { MilestoneChangeService } from 'src/app/shared/services/milestone-change.service';
import * as moment from 'moment';

@Component({
  selector: 'app-property-date',
  templateUrl: './property-date.component.html',
  styleUrls: ['./property-date.component.scss']
})
export class PropertyDateComponent implements OnInit {

  @ViewChild(Calendar) calendarComponent: Calendar;
  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();
  defaultValue: Date;
  value: Date;
  dateMin: Date;
  dateMax: Date;
  responsive: boolean;
  $destroy = new Subject();
  calendarFormat: string;
  yearRange: string;
  showReason: boolean;
  language: string;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private milestoneChangeDateSrv: MilestoneChangeService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      setTimeout(() =>
      {
        this.calendarComponent?.ngOnInit();
        this.calendarComponent.dateFormat = this.translateSrv.instant('dateFormat');
        this.calendarComponent.updateInputfield();
        this.setLanguage()
      }, 150)
    );
  }

  changeDateValue(event?: any) {
    if (event?.type === 'blur') {
      this.changed.emit(event);
      return;
    }

    const formatedDate = moment().format('YYYY-MM-DD');
    const actualDate = moment(formatedDate, 'YYYY-MM-DD');
    const newDate = moment(event);
    const baselineDate = this.property.milestoneData && this.property.milestoneData.baselineDate ?
      new Date(this.property.milestoneData.baselineDate+ 'T00:00:00') : undefined;
    if (baselineDate) {
      this.property.milestoneData.delayInDays = actualDate.isBefore(moment(baselineDate)) ? moment(newDate).diff(baselineDate, 'days') :
      ( moment(newDate).isBefore(actualDate) ?  moment(actualDate).diff(baselineDate, 'days') :  moment(newDate).diff(baselineDate, 'days')) ;
      this.milestoneChangeDateSrv.next(this.property.milestoneData.delayInDays);
    }
    const defaultValueDiffNewDate = this.property?.defaultValue?.toString().split('T')[0] !== newDate.format('YYYY-MM-DD');
    if (!newDate || !this.property?.milestoneData || isNaN(event) || !defaultValueDiffNewDate) {
      this.showReason = false;
      this.property.needReason = false;
      this.property.reason = null;
      return;
    }
    
    if (baselineDate) {
      if (defaultValueDiffNewDate && newDate.diff(moment(baselineDate))) {
        this.emitChanges(event, true);
        return;
      }
    }
    this.emitChanges(event, false);
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

  emitChanges(event: any, reason: boolean) {
    this.showReason = reason;
    this.property.needReason = reason;
    this.changed.emit(event);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  ngOnInit(): void {
    this.setLanguage();
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    const today = moment();
    const yearStart = today.year();
    this.yearRange = (yearStart-10).toString() + ':'+ (yearStart+10).toString();
    this.loadDates();
  }

  loadDates() {
    const defaultValueDate = this.property.defaultValue && this.property.defaultValue.toLocaleString();
    this.defaultValue = defaultValueDate && new Date(defaultValueDate);
    this.dateMin = this.property.min && new Date(this.property.min);
    this.dateMax = this.property.max && new Date(this.property.max);
  }

}
