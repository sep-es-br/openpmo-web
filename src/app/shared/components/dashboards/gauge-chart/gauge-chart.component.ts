import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Chart, ChartData, ChartOptions, ChartPluginsOptions, ChartPoint } from 'chart.js';
import { IGaugeChartData } from 'src/app/shared/interfaces/IGaugeChartData';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-gauge-chart',
  templateUrl: './gauge-chart.component.html',
  styleUrls: ['./gauge-chart.component.scss']
})
export class GaugeChartComponent implements OnInit {
  
  @Input() config: IGaugeChartData;
  $destroy = new Subject();
  progressBarRight: boolean = true;
  valueChart: number;
  valueChartLeft: number;
  valueChartRight: number;
  data: ChartData;
  type = 'doughnut';
  plugins: ChartPluginsOptions = [];
  options: ChartOptions = {
    plugins: {
      datalabels: {
        display: false
      }
    },
    circumference: Math.PI + 0.3,
    rotation: Math.PI - 0.15,
    cutoutPercentage: 50,
    legend: {
      display: false,
    },
    tooltips: {
      enabled: false
    },
    aspectRatio: 1,
  }

  constructor(
    private translateSrv: TranslateService
  ) {
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => {
        this.setConfigValuesChart();
        this.setPluginsChart();
        this.setDataChart();
      }, 200);
    });
  }

  ngOnInit(): void {
    console.log('config', this.config);
  }

  ngOnDestroy() {
    this.$destroy.next();
    this.$destroy.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.config && changes.config.currentValue) {
      this.setConfigValuesChart();
      this.setPluginsChart();
      this.setDataChart();
      this.progressBarRight = this.config?.valueProgressBar > 0;
    }
  }

  setConfigValuesChart() {
    const max = 2;
    const middle = max / 2;
    const min = 0;
    if (this.config.value !== null) {
      this.config.value = (this.config.value > max ?
        max :
        (this.config.value < min ?
          min :
          this.config.value));
      this.valueChart = this.config.value - middle;
      if (this.valueChart > min) {
        this.valueChartLeft = middle;
        this.valueChartRight = middle - this.valueChart;
      }
      if (this.valueChart < min) {
        this.valueChartLeft = middle + this.valueChart;
        this.valueChartRight = middle;
      }
      if (this.valueChart === min) {
        this.valueChartLeft = middle;
        this.valueChartRight = middle;
      }
    } else {
      this.valueChart = null;
      this.valueChartLeft = middle;
      this.valueChartRight = middle;
    }

  }

  setDataChart() {
    this.data = {
      datasets: [{
        data: [this.valueChartLeft, Math.abs(this.valueChart), this.valueChartRight],
        backgroundColor: [
          '#d9d9d9',
          this.valueChart > 0 ? '#0081c1' : '#fa4c4f',
          '#d9d9d9',
        ]
      }]
    };
  }

  setPluginsChart() {
    this.plugins = [{
      afterDatasetDraw: (chart: Chart) => this.drawMiddleTextChart(chart)
    }]
  }

  drawMiddleTextChart(chart: Chart) {
    const ctx = chart.ctx;
    const xFillText = chart.width / 2;
    const yFillText = (chart.height / 2) + 35;
    const label = this.config.value !== null ? (this.config.value === 0 ? '0' : this.config.value.toFixed(2)) : null;
    const labelBottom = this.translateSrv.instant(this.config.labelBottom);

    ctx.fillStyle = this.valueChart !== null ? (this.valueChart > 0 ? '#0081c1' : '#fa4c4f') : '#646464';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = Chart.helpers.fontString(
      32,
      'bold',
      'Montserrat'
    );
    if (label !== null) {
      ctx.fillText(label, xFillText, yFillText);
      ctx.font = Chart.helpers.fontString(
        17,
        'normal',
        'Montserrat'
      );
      ctx.fillText(labelBottom, xFillText + 10, yFillText + 20);
      ctx.font = '400 16px FontAwesome';
      ctx.fillText(this.getIconUnicode(this.config.classIconLabelBottom), xFillText - 15, yFillText + 18);
    } else {
      ctx.font = Chart.helpers.fontString(
        17,
        'normal',
        'Montserrat'
      );
      ctx.fillText(labelBottom, xFillText + 5, yFillText);
      ctx.font = '400 16px FontAwesome';
      ctx.fillText(this.getIconUnicode(this.config.classIconLabelBottom), xFillText - 20, yFillText - 2);
    }

    ctx.restore();

  }

  getIconUnicode(iconClass) {
    const iconElement = document.createElement('i');

    iconElement.className = iconClass;
    document.body.appendChild(iconElement);

    const char = window.getComputedStyle(iconElement, ':before')
      .getPropertyValue('content');

    iconElement.remove();

    return char.replace(/\"/g, '')
  }

  getNumberAbsolute(value: number) {
    return Math.abs(value);
  }

}
