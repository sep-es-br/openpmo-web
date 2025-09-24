import { ResponsiveService } from './../../../../shared/services/responsive.service';
import { takeUntil } from 'rxjs/operators';
import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { IEarnedValueAnalysisDashboard, ITripleConstraintDashboard } from 'src/app/shared/interfaces/IDashboard';
import { IGaugeChartData } from 'src/app/shared/interfaces/IGaugeChartData';
import { ShortNumberPipe } from 'src/app/shared/pipes/shortNumberPipe';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-earned-value-analysis-dashboard',
  templateUrl: './earned-value-analysis-dashboard.component.html',
  styleUrls: ['./earned-value-analysis-dashboard.component.scss']
})
export class EarnedValueAnalysisDashboardComponent implements OnInit, OnChanges, OnDestroy {

  @Input() earnedValueAnalysis: IEarnedValueAnalysisDashboard;
  @Input() referenceMonth;
  @Input() tripleConstraint: ITripleConstraintDashboard;
  lineChartData: ChartData;
  lineChartOptions: ChartOptions;
  gaugeChartDataCPI: IGaugeChartData;
  gaugeChartDataSPI: IGaugeChartData;
  maxProgressBar: number;
  language: string;
  $destroy = new Subject();
  responsive = false;
  mediaScreen1500: boolean;
  showContent: boolean;

  constructor(
    private shortNumberPipe: ShortNumberPipe,
    private translateSrv: TranslateService,
    private responsiveSrv: ResponsiveService,
    private dashboardSrv: DashboardService,
    private route: ActivatedRoute
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.responsiveSrv.resizeEvent.subscribe((value) => {
      this.mediaScreen1500 = value.width <= 1500;
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      setTimeout(() => {
        this.setLanguage();
      }, 150)
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.earnedValueAnalysis && changes.earnedValueAnalysis.currentValue) {
      this.setGaugeChartData();
      if (this.earnedValueAnalysis && this.earnedValueAnalysis?.earnedValueByStep && this.earnedValueAnalysis?.earnedValueByStep.length > 0) {
        this.setLineChart();
      }
      if (this.earnedValueAnalysis) {
        this.loadMaxProgressBar();
      }
    }
  }

  ngOnInit(): void {
    this.setLanguage();

    this.route.queryParams.subscribe(params => {
      const idWorkpack = params['id'];
      if (idWorkpack) {
        this.dashboardSrv.GetBaselines({ 'id-workpack': idWorkpack }).then(
          response => {
            if (response.success && response.data && response.data.length > 0 || this.tripleConstraint.cost.plannedValue > 0 ) {
              this.showContent = true;
            } else {
              this.showContent = false;
            }
          }
        ).catch(error => { console.log(error); }
        );
      }
    });
  }

  sumPerformanceIndexes(): number {
    const indexes = this.earnedValueAnalysis?.performanceIndexes;
    return (indexes.earnedValue || 0) +
      (indexes.actualCost || 0) +
      (indexes.plannedValue || 0) +
      (indexes.estimatesAtCompletion || 0) +
      (indexes.estimateToComplete || 0);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLineChart() {
    const referenceMonth = moment(this.referenceMonth);
    moment.locale(this.translateSrv.currentLang);
    this.lineChartData = {
      labels: this.earnedValueAnalysis?.earnedValueByStep?.map(item => moment(item.date).format('MMM YYYY')),
      datasets: [
        {
          label: this.translateSrv.instant('EV'),
          data: this.earnedValueAnalysis.earnedValueByStep?.filter(step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth)).map(item => item.earnedValue),
          fill: false,
          borderColor: '#fa7800',
          pointBorderWidth: this.earnedValueAnalysis.earnedValueByStep?.filter(step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth)).map(item => item.earnedValue).length > 1 ? 1 : 0,
          pointRadius: this.earnedValueAnalysis.earnedValueByStep?.filter(step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth)).map(item => item.earnedValue).length > 1 ? 4 : 0,
        },
        {
          label: this.translateSrv.instant('AC'),
          data: this.earnedValueAnalysis.earnedValueByStep?.filter(step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth)).map(item => item.actualCost),
          fill: false,
          borderColor: '#0081c1',
          pointBorderWidth: this.earnedValueAnalysis.earnedValueByStep?.filter(step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth)).map(item => item.actualCost).length > 1 ? 1 : 0,
          pointRadius: this.earnedValueAnalysis.earnedValueByStep?.filter(step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth)).map(item => item.actualCost).length > 1 ? 4 : 0,
        },
        {
          label: this.translateSrv.instant('PV'),
          data: this.earnedValueAnalysis.earnedValueByStep?.map(item => item.plannedCost),
          fill: false,
          borderColor: '#b5b5b5',
          pointBorderWidth: this.earnedValueAnalysis.earnedValueByStep?.map(item => item.plannedCost).length > 1 ? 1 : 0,
          pointRadius: this.earnedValueAnalysis.earnedValueByStep?.map(item => item.plannedCost).length > 1 ? 4 : 0,
        },
        // {
        //   label: this.translateSrv.instant('EC'),
        //   data: this.earnedValueAnalysis.earnedValueByStep?.filter(step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth)).map(item => item.estimatedCost),
        //   fill: false,
        //   borderColor: '#44b39b',
        //   pointBorderWidth: this.earnedValueAnalysis.earnedValueByStep?.filter(step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth)).map(item => item.estimatedCost).length > 1 ? 1 : 0,
        //   pointRadius: this.earnedValueAnalysis.earnedValueByStep?.filter(step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth)).map(item => item.estimatedCost).length > 1 ? 4 : 0,
        // }
      ]
    };

    this.lineChartOptions = {
      plugins: {
        datalabels: {
          display: false,
        },
      },
      scales: {
        yAxes: [{
          ticks: {
            callback: (value, index, values) => this.shortNumberPipe.transform(value, this.language)
          }
        }]
      },
      elements: {
        point: {
          pointStyle: 'circle',
          radius: 4
        },
      },
      tooltips: {
        callbacks: {
          label: (tooltipItem, data) => {
            return tooltipItem.yLabel.toLocaleString(this.language);
          }
        }
      }
    };
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en';
  }

  setGaugeChartData() {
    this.gaugeChartDataCPI = {
      value: this.earnedValueAnalysis?.performanceIndexes?.costPerformanceIndex &&
        (this.earnedValueAnalysis.performanceIndexes?.actualCost !== 0 &&
          this.earnedValueAnalysis.performanceIndexes.actualCost !== null &&
          this.earnedValueAnalysis.performanceIndexes.actualCost !== undefined)
        ?
        (this.earnedValueAnalysis?.performanceIndexes?.costPerformanceIndex?.indexValue === null ? 0 : this.earnedValueAnalysis?.performanceIndexes?.costPerformanceIndex?.indexValue)
        : (null),
      labelBottom: 'CPI',
      classIconLabelBottom: 'fas fa-dollar-sign',
      valueProgressBar: this.earnedValueAnalysis?.performanceIndexes?.costPerformanceIndex ? this.earnedValueAnalysis?.performanceIndexes?.costPerformanceIndex?.costVariation : null,
      maxProgressBar: this.earnedValueAnalysis?.performanceIndexes?.earnedValue,
      labelBottomProgressBar: 'CV',
    };
    this.gaugeChartDataSPI = {
      value: this.earnedValueAnalysis?.performanceIndexes?.schedulePerformanceIndex &&
        (this.earnedValueAnalysis.performanceIndexes.plannedValue !== 0 &&
          this.earnedValueAnalysis.performanceIndexes.plannedValue !== null &&
          this.earnedValueAnalysis.performanceIndexes.plannedValue !== undefined)
        ?
        (this.earnedValueAnalysis?.performanceIndexes?.schedulePerformanceIndex?.indexValue === null ? 0 : this.earnedValueAnalysis?.performanceIndexes?.schedulePerformanceIndex?.indexValue)
        : null,
      labelBottom: 'SPI',
      classIconLabelBottom: 'fas fa-clock',
      valueProgressBar: this.earnedValueAnalysis?.performanceIndexes?.schedulePerformanceIndex ?
        this.earnedValueAnalysis?.performanceIndexes?.schedulePerformanceIndex?.scheduleVariation : null,
      maxProgressBar: this.earnedValueAnalysis?.performanceIndexes?.earnedValue,
      labelBottomProgressBar: 'SV',
    };
  }

  loadMaxProgressBar() {
    const {
      earnedValue,
      actualCost,
      plannedValue,
      estimatesAtCompletion,
      estimateToComplete
    } = this.earnedValueAnalysis.performanceIndexes;
    const values = [
      earnedValue === null ? 0 : earnedValue,
      actualCost === null ? 0 : actualCost,
      plannedValue === null ? 0 : plannedValue,
      estimatesAtCompletion === null ? 0 : estimatesAtCompletion,
      estimateToComplete === null ? 0 : estimateToComplete,
    ];
    this.maxProgressBar = values.reduce((a, b) => Math.max(a, b));
  }

}
