import { Component, Input, EventEmitter, Output, ViewChildren, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { Calendar } from 'primeng/calendar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IStakeholderRole } from 'src/app/shared/interfaces/IStakeholder';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

interface ICardItemRole {
  type: string;
  role?: IStakeholderRole;
  readOnly?: boolean;
  personRoleOptions?: { label: string; value: string }[];
  new?: boolean;
}

@Component({
  selector: 'app-stakeholder-role-card-item',
  templateUrl: './stakeholder-role-card-item.component.html',
  styleUrls: ['./stakeholder-role-card-item.component.scss']
})
export class StakeholderRoleCardItemComponent implements OnInit, OnDestroy {

  @ViewChildren(Calendar) calendarComponents: Calendar[];
  @Input() properties: ICardItemRole;
  @Input() stakeholderRoles: IStakeholderRole[];
  @Output() newCardItemRole = new EventEmitter();
  @Output() roleChanged = new EventEmitter();
  @Output() roleDeleted = new EventEmitter();
  responsive: boolean;
  iconsEnum = IconsEnum;
  calendarFormat: string;
  $destroy = new Subject();
  yearRange: string;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.calendarComponents?.map(calendar => {
        calendar.ngOnInit();
        calendar.dateFormat = this.translateSrv.instant('dateFormat');
        calendar.updateInputfield();
      }, 150));
    }
  );
  }

  ngOnInit(): void {
    const today = moment();
    const yearStart = today.year();
    this.yearRange = (yearStart-10).toString() + ':'+ (yearStart+10).toString();
    this.calendarFormat = this.translateSrv.instant('dateFormat');
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  handleNewCardItemRole() {
    this.newCardItemRole.next();
  }

  handleRoleChange() {
    this.roleChanged.next();
  }

  deleteRole() {
    this.roleDeleted.next()
  }
}
