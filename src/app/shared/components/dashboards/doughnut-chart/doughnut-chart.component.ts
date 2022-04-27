import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart, ChartData, ChartOptions, ChartPoint } from 'chart.js';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-doughnut-chart',
  templateUrl: './doughnut-chart.component.html',
  styleUrls: ['./doughnut-chart.component.scss']
})
export class DoughnutChartComponent implements OnInit, OnDestroy {
  @Input() data: ChartData;
  @Input() middleText: string;
  @Input() midleTextBottom: string;
  $destroy = new Subject();
  language: string;

  type = 'doughnut';
  plugins = [];

  options: ChartOptions;

  constructor(
    private translateSrv: TranslateService
  ) {
    this.plugins = [ChartDataLabels, {
      afterDatasetDraw: (chart: Chart) => this.drawMiddleTextChart(chart, this.middleText, this.midleTextBottom)
    }];
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      setTimeout(() => {
        this.setLanguage();
      }, 150)
    );
  }

  ngOnInit(): void {
    this.setLanguage();
    this.setOptions();
  }

  setOptions() {
    this.options = {
      plugins: {
        datalabels: {
          color: '#fff',
          font: {
            size: 9,
            family: 'Montserrat',
            weight: 'bold'
          },
          formatter: (value, context) => {
            if (!value || value == 0) {
              return '';
            }
            const datapoints = context.chart.data.datasets[0].data as ChartPoint[];
            function totalSum(total, datapoint) {
              return total + datapoint;
            }
            const totalValue = datapoints.reduce(totalSum, 0);
            const percentageValue = (Number((value / totalValue * 100).toFixed(1)).toLocaleString(this.language));
            return `${(percentageValue)}%`;
          }
        }
      },
      legend: {
        display: false,
      },
      aspectRatio: 1
    }
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

  ngOnDestroy(): void {
      this.$destroy.next();
      this.$destroy.complete();
  }

  drawMiddleTextChart(chart: Chart, label: string, labelBottom: string) {
    const ctx = chart.ctx;
    const xFillText = chart.width / 2;
    const yFillText = chart.height / 2;

    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = Chart.helpers.fontString(
      13,
      'bold',
      'Montserrat'
    );
    ctx.fillText(label, xFillText, yFillText);
    ctx.font = Chart.helpers.fontString(
      9,
      'normal',
      'Montserrat'
    );
    ctx.fillText(labelBottom, xFillText, yFillText + 15);
    ctx.restore();
  }

}
