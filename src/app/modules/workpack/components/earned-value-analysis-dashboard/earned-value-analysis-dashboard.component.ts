import { ResponsiveService } from './../../../../shared/services/responsive.service';
import { takeUntil } from 'rxjs/operators';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import * as moment from 'moment';
import { pipe, Subject } from 'rxjs';
import { IEarnedValueAnalysisDashboard } from 'src/app/shared/interfaces/IDashboard';
import { IGaugeChartData } from 'src/app/shared/interfaces/IGaugeChartData';
import { ShortNumberPipe } from 'src/app/shared/pipes/shortNumberPipe';

@Component({
  selector: 'app-earned-value-analysis-dashboard',
  templateUrl: './earned-value-analysis-dashboard.component.html',
  styleUrls: ['./earned-value-analysis-dashboard.component.scss']
})
export class EarnedValueAnalysisDashboardComponent implements OnInit {

  @Input() earnedValueAnalysis: IEarnedValueAnalysisDashboard;
  @Input() referenceMonth: string;
  lineChartData: ChartData;
  lineChartOptions: ChartOptions;
  gaugeChartDataCPI: IGaugeChartData;
  gaugeChartDataSPI: IGaugeChartData;
  maxProgressBar: number;
  language: string;
  $destroy = new Subject();
  responsive = false;

  constructor(
    private shortNumberPipe: ShortNumberPipe,
    private translateSrv: TranslateService,
    private responsiveSrv: ResponsiveService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      setTimeout(() => {
        this.setLanguage();
      }, 150)
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.earnedValueAnalysis && changes.earnedValueAnalysis.currentValue) {
      this.setGaugeChartData();
      if(this.earnedValueAnalysis && this.earnedValueAnalysis?.earnedValueByStep && this.earnedValueAnalysis?.earnedValueByStep.length > 0) {
        this.setLineChart();
      }
      if(this.earnedValueAnalysis) {
        this.loadMaxProgressBar();
      }
    }
  }

  ngOnInit(): void {
    this.setLanguage();
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
          label: this.translateSrv.instant('PV'),
          data: this.earnedValueAnalysis.earnedValueByStep?.map(item => item.plannedValue),
          fill: false,
          borderColor: '#b5b5b5',
          pointBorderWidth: this.earnedValueAnalysis.earnedValueByStep?.map(item => item.plannedValue).length > 1 ? 0 : 1,
          pointRadius: this.earnedValueAnalysis.earnedValueByStep?.map(item => item.plannedValue).length > 1 ? 0 : 4,
        },
        {
          label:  this.translateSrv.instant('AC'),
          data: this.earnedValueAnalysis.earnedValueByStep?.filter( step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth)).map(item => item.actualCost),
          fill: false,
          borderColor: '#0081c1',
          pointBorderWidth: this.earnedValueAnalysis.earnedValueByStep?.filter( step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth)).map(item => item.actualCost).length > 1 ? 0 : 1,
          pointRadius: this.earnedValueAnalysis.earnedValueByStep?.filter( step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth)).map(item => item.actualCost).length > 1 ? 0 : 4,
        },
        {
          label: this.translateSrv.instant('EV'),
          data: this.earnedValueAnalysis.earnedValueByStep?.filter( step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth) ).map(item => item.earnedValue),
          fill: false,
          borderColor: '#fa7800',
          pointBorderWidth: this.earnedValueAnalysis.earnedValueByStep?.filter( step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth) ).map(item => item.earnedValue).length > 1 ? 0 : 1,
          pointRadius: this.earnedValueAnalysis.earnedValueByStep?.filter( step => moment(step.date, 'yyyy-MM').isSameOrBefore(referenceMonth) ).map(item => item.earnedValue).length > 1 ? 0 : 4,
        },
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
      }
    };
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en';
  }

  setGaugeChartData() {
    this.gaugeChartDataCPI = {
      value: this.earnedValueAnalysis?.performanceIndexes[0]?.costPerformanceIndex ?
        (this.earnedValueAnalysis?.performanceIndexes[0]?.costPerformanceIndex?.indexValue === null ? 0 : this.earnedValueAnalysis?.performanceIndexes[0]?.costPerformanceIndex?.indexValue)
        : (null),
      labelBottom: 'CPI',
      classIconLabelBottom: 'fas fa-dollar-sign',
      valueProgressBar:  this.earnedValueAnalysis?.performanceIndexes[0]?.costPerformanceIndex ? this.earnedValueAnalysis?.performanceIndexes[0]?.costPerformanceIndex?.costVariation : null,
      maxProgressBar: this.earnedValueAnalysis?.performanceIndexes[0]?.earnedValue,
      labelBottomProgressBar: 'CV',
    };
    this.gaugeChartDataSPI = {
      value: this.earnedValueAnalysis?.performanceIndexes[0]?.schedulePerformanceIndex ?
       ( this.earnedValueAnalysis?.performanceIndexes[0]?.schedulePerformanceIndex?.indexValue === null ? 0 : this.earnedValueAnalysis?.performanceIndexes[0]?.schedulePerformanceIndex?.indexValue)
       : null,
      labelBottom: 'SPI',
      classIconLabelBottom: 'fas fa-clock',
      valueProgressBar: this.earnedValueAnalysis?.performanceIndexes[0]?.schedulePerformanceIndex ?
        this.earnedValueAnalysis?.performanceIndexes[0]?.schedulePerformanceIndex?.scheduleVariation : null,
      maxProgressBar: this.earnedValueAnalysis?.performanceIndexes[0]?.earnedValue,
      labelBottomProgressBar: 'SV',
    };
  }

  loadMaxProgressBar() {
    const { earnedValue, actualCost, plannedValue, estimatesAtCompletion, estimateToComplete } = this.earnedValueAnalysis.performanceIndexes[0];
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
