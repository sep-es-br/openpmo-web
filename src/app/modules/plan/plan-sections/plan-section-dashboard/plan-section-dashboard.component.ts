import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartData } from 'chart.js';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IDashboardData } from 'src/app/shared/interfaces/IDashboard';
import { PlanDashboardService } from 'src/app/shared/services/plan-dashboard.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-plan-section-dashboard',
  templateUrl: './plan-section-dashboard.component.html',
  styleUrls: ['./plan-section-dashboard.component.scss'],
})
export class PlanSectionDashboardComponent implements OnChanges, OnDestroy {
  @Input() planId: number;

  @Input() planFullName: string;

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    collapseble: false,
    cardTitle: '',
    notShowCardTitle: true,
    showFullScreen: true,
    fullScreen: false,
  };

  dashboard: IDashboardData;

  milestoneData: ChartData;

  riskData: ChartData;

  statusData: ChartData;

  referenceMonth: Date;

  startDate: Date;

  endDate: Date;

  yearRange: string;

  calendarFormat: string;

  responsive = false;

  isLoading = false;

  private loadedPlanId: number;

  private $destroy = new Subject();

  constructor(
    private planDashboardSrv: PlanDashboardService,
    private translateSrv: TranslateService,
    private responsiveSrv: ResponsiveService
  ) {
    this.calendarFormat = this.translateSrv.instant('dateFormatMonthYear');
    this.responsiveSrv.observable
      .pipe(takeUntil(this.$destroy))
      .subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange
      .pipe(takeUntil(this.$destroy))
      .subscribe(() => {
        this.calendarFormat = this.translateSrv.instant('dateFormatMonthYear');
        this.buildCharts();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const idPlan = changes.planId?.currentValue;
    if (idPlan && idPlan !== this.loadedPlanId) {
      this.loadedPlanId = idPlan;
      this.loadDashboard();
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async loadDashboard(useSelectedMonth = false): Promise<void> {
    if (!this.planId || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const dateReference = useSelectedMonth && this.referenceMonth
      ? moment(this.referenceMonth).format('MM/yyyy')
      : undefined;
    const result = await this.planDashboardSrv.getPlanDashboard(
      this.planId,
      dateReference
    );

    if (result.success && result.data) {
      this.dashboard = this.planDashboardSrv.mapDashboard(result.data);
      this.consolidateWorkpackModels();
      this.setScheduleInterval();
      this.buildCharts();
    } else {
      this.dashboard = undefined;
    }
    this.isLoading = false;
  }

  async handleSelectedReferenceMonth(): Promise<void> {
    await this.loadDashboard(true);
  }

  handleOnFullScreen(fullScreen: boolean): void {
    this.cardProperties = {
      ...this.cardProperties,
      fullScreen,
    };
  }

  private setScheduleInterval(): void {
    const schedule = this.dashboard?.tripleConstraint?.schedule;
    const starts = [schedule?.plannedStartDate, schedule?.foreseenStartDate]
      .filter(Boolean)
      .map(date => moment(date, 'yyyy-MM-DD'));
    const ends = [schedule?.plannedEndDate, schedule?.foreseenEndDate]
      .filter(Boolean)
      .map(date => moment(date, 'yyyy-MM-DD'));

    if (!starts.length || !ends.length) {
      return;
    }

    const start = moment.min(starts);
    const end = moment.max(ends);
    this.startDate = start.toDate();
    this.endDate = end.toDate();
    this.yearRange = `${start.year()}:${end.year()}`;

    if (!this.referenceMonth) {
      const previousMonth = moment().subtract(1, 'month');
      this.referenceMonth = moment.max(start, moment.min(previousMonth, end)).toDate();
    }
  }

  private buildCharts(): void {
    this.buildStatusData();
    this.buildMilestoneData();
    this.buildRiskData();
  }

  private consolidateWorkpackModels(): void {
    const models = this.dashboard?.workpacksByModel || [];
    const consolidated: { [key: string]: any } = models.reduce((result, model) => {
      const key = `${model.modelName}|${model.icon || ''}`;
      if (!result[key]) {
        result[key] = { ...model };
      } else {
        result[key].quantity += model.quantity;
        result[key].level = Math.min(
          result[key].level ?? Number.MAX_SAFE_INTEGER,
          model.level ?? Number.MAX_SAFE_INTEGER
        );
        result[key].position = Math.min(
          result[key].position ?? Number.MAX_SAFE_INTEGER,
          model.position ?? Number.MAX_SAFE_INTEGER
        );
      }
      return result;
    }, {});
    this.dashboard.workpacksByModel = Object.values(consolidated)
      .sort((first, second) =>
        (first.level ?? Number.MAX_SAFE_INTEGER) - (second.level ?? Number.MAX_SAFE_INTEGER) ||
        (first.position ?? Number.MAX_SAFE_INTEGER) - (second.position ?? Number.MAX_SAFE_INTEGER) ||
        first.modelName.localeCompare(second.modelName)
      );
  }

  private buildStatusData(): void {
    const status = this.dashboard?.dashboardStatusData;
    this.statusData = status?.totalDeliverable ? {
      labels: [
        this.translateSrv.instant('completed'),
        this.translateSrv.instant('execution'),
        this.translateSrv.instant('blocked'),
        this.translateSrv.instant('plannedBaseline'),
        this.translateSrv.instant('TO_CANCEL'),
      ],
      datasets: [{
        data: [
          status.statusConcluida,
          status.statusEmExec,
          status.statusParalisada,
          status.statusPlanejamento,
          status.statusCancelar,
        ],
        backgroundColor: ['#118DFF', '#55B95E', '#EA9D42', '#EC78EA', '#CC2C52'],
      }],
    } : undefined;
  }

  private buildMilestoneData(): void {
    const milestone = this.dashboard?.milestone;
    this.milestoneData = milestone?.quantity ? {
      labels: [
        this.translateSrv.instant('ontime'),
        this.translateSrv.instant('late'),
        this.translateSrv.instant('concluded'),
        this.translateSrv.instant('lateConcluded'),
      ],
      datasets: [{
        data: [milestone.onTime, milestone.late, milestone.concluded, milestone.lateConcluded],
        backgroundColor: ['#00b89c', '#fa4c4f', '#0081c1', '#7C75B9'],
      }],
    } : undefined;
  }

  private buildRiskData(): void {
    const risk = this.dashboard?.risk;
    this.riskData = risk?.total ? {
      labels: [
        this.translateSrv.instant('high'),
        this.translateSrv.instant('medium'),
        this.translateSrv.instant('low'),
      ],
      datasets: [{
        data: [risk.high, risk.medium, risk.low],
        backgroundColor: ['#ce4543', '#fb7800', '#ffc300'],
      }],
    } : undefined;
  }
}
