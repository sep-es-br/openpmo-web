import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { ResponsiveService } from './../../../services/responsive.service';
import { Subject } from 'rxjs';
import { ITripleConstraintDashboard } from './../../../interfaces/IDashboard';
import { Component, OnInit, Input, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-cost-constraint',
  templateUrl: './cost-constraint.component.html',
  styleUrls: ['./cost-constraint.component.scss']
})
export class CostConstraintComponent implements OnInit {

  @Input() cost: {
    actualValue: number,
    foreseenValue: number,
    plannedValue: number,
    variation: number
  };
  maxCostValue: number;
  monthsInPeriod: number;
  $destroy = new Subject();
  responsive = false;
  language: string;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      setTimeout(() => {
        this.setLanguage();
      }, 150)
    );
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en';
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes.cost && changes.cost.currentValue
    ) {
      if (this.cost) {
        this.loadMaxCostValue();
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

  loadMaxCostValue() {
    const values = [];
    if (this.cost) {
      if (this.cost.plannedValue) {
        values.push(this.cost.plannedValue);
      }
      if (this.cost.foreseenValue) {
        values.push(this.cost.foreseenValue);
      }
      if (this.cost.actualValue) {
        values.push(this.cost.actualValue);
      }
      this.maxCostValue = values.length > 0 ? values.reduce((a, b) => {
        return Math.max(a, b);
      }) : 0;
    }
  }

}
