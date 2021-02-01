import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IScheduleStepCardItem } from 'src/app/shared/interfaces/IScheduleStepCardItem';

@Component({
  selector: 'app-schedule-step-card-item',
  templateUrl: './schedule-step-card-item.component.html',
  styleUrls: ['./schedule-step-card-item.component.scss']
})
export class ScheduleStepCardItemComponent implements OnInit {

  @Input() properties: IScheduleStepCardItem;
  @Input() type: string;
  @Output() stepChanged = new EventEmitter();

  cardIdItem: string;
  iconEnum = IconsEnum;

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cardIdItem = this.properties.idStep ?
      `ID: ${this.properties.idStep < 10 ? '0' + this.properties.idStep : this.properties.idStep}` : '';
  }

  navigateToPage(url: string, params?: {idSchedule: number; stepType: string; unitName: string}) {
    this.router.navigate(
      [url],
      {
        queryParams: {
          idSchedule: params.idSchedule,
          stepType: params.stepType,
          unitName: params.unitName
        }
      }
    );
  }

  handleStepChange() {
    this.stepChanged.next();
  }
}
