import { Component, Input, OnInit } from '@angular/core';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
registerLocaleData(localePt);

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss']
})
export class ProgressBarComponent implements OnInit {

  @Input() total: number;
  @Input() progress: number;
  @Input() labelProgress: string;
  @Input() labelTotal: string;
  @Input() color: string;
  @Input() valueUnit: string;

  constructor() { }

  ngOnInit(): void {
    if (!this.progress) {
      this.progress = 0;
    }
    if (this.total === 0) {
      this.total = this.progress;
    } else if (!this.total) {
      this.total = 100;
    }
    if (this.progress > this.total) {
      this.progress = 100;
      this.total = 100;
    }
  }

}
