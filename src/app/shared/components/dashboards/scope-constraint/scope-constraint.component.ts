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

  constructor(
    private responsiveSrv: ResponsiveService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
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
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  loadMaxScopeValue() {
    const values = [];
    if (this.scope.plannedVariationPercent) {
      values.push(this.scope.plannedVariationPercent);
    }
    if (this.scope.foreseenVariationPercent) {
      values.push(this.scope.foreseenVariationPercent);
    }
    if (this.scope.actualVariationPercent) {
      values.push(this.scope.actualVariationPercent);
    }
    this.maxScopeValue = values.reduce((a, b) => {
      return Math.max(a, b);
    });
  }

}
