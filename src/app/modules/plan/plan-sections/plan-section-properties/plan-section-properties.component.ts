import { Component, Input, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Calendar } from 'primeng/calendar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ICard } from 'src/app/shared/interfaces/ICard';

@Component({
  selector: 'app-plan-section-properties',
  templateUrl: './plan-section-properties.component.html',
  styleUrls: ['./plan-section-properties.component.scss'],
})
export class PlanSectionPropertiesComponent implements OnDestroy {
  @Input() cardProperties: ICard;

  @Input() form: FormGroup;

  @Input() formIsSaving: boolean;

  @Input() responsive: boolean;

  @Input() yearRange: string;

  @Input() calendarFormat: string;

  @Input() mirrorFullName: boolean;

  @ViewChildren(Calendar) calendarComponents: QueryList<Calendar>;

  private $destroy = new Subject();

  constructor(private translateSrv: TranslateService) {
    this.translateSrv.onLangChange
      .pipe(takeUntil(this.$destroy))
      .subscribe(() => setTimeout(() => this.updateCalendar(), 150));
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  private updateCalendar(): void {
    this.calendarComponents?.forEach(calendar => {
      calendar.ngOnInit();
      calendar.dateFormat = this.translateSrv.instant('dateFormat');
      calendar.updateInputfield();
    });
  }
}
