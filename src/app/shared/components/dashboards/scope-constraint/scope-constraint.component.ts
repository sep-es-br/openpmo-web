import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { ResponsiveService } from './../../../services/responsive.service';
import { Subject } from 'rxjs';
import { Component, OnInit, Input, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-scope-constraint',
  templateUrl: './scope-constraint.component.html',
  styleUrls: ['./scope-constraint.component.scss']
})
export class ScopeConstraintComponent implements OnInit {

  @Input() scope: {
    actualVariationPercent: number,
    foreseenVariationPercent: number,
    plannedVariationPercent?: number,
    foreseenValue?: number;
    actualValue?: number;
    variation?: number
  }
  maxScopeValue: number;
  marginRightPlanned: number;
  marginRightForeseen: number;
  marginRightActual: number;
  difPlannedEndDateToMaxEndDate: number;
  difForeseenEndDateToMaxEndDate: number;
  difActualEndDateToMaxEndDate: number;
  marginLeftPlanned: number;
  marginLeftForeseen: number;
  marginLeftActual: number;
  $destroy = new Subject();
  responsive = false;
  language: string;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      {
        setTimeout(() => this.setLanguage(), 200);
      }
    );
   }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes.scope && changes.scope.currentValue
    ) {
      if (this.scope && this.scope) {
        this.loadMaxScopeValue();
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

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en';
  }

  loadMaxScopeValue() {
    const values = [];
    if (this.scope.plannedVariationPercent) {
      values.push(this.scope.plannedVariationPercent);
    }
    if (this.scope.actualVariationPercent) {
      values.push(this.scope.actualVariationPercent);
    }
    
    this.maxScopeValue = values && values.length > 0 && values.reduce((a, b) => {
      return Math.max(a, b);
    });
  }

}
