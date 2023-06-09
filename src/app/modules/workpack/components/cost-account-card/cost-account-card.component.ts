import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { Component, Input, OnDestroy, Output, SimpleChanges, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SelectItem } from 'primeng/api';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-cost-account-card',
  templateUrl: './cost-account-card.component.html',
  styleUrls: ['./cost-account-card.component.scss']
})
export class CostAccountCardComponent implements OnInit {

  @Input() properties: ICard;

  responsive: boolean;
  subResponsive: Subscription;
  language: string;
  $destroy = new Subject();

  constructor(
    private responsiveSrv: ResponsiveService,
    public translateSrv: TranslateService,
    private workpackSrv: WorkpackService,
  ) {
    this.subResponsive = this.responsiveSrv.observable.subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
    }
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.properties && changes.properties.currentValue
    ) {
      this.properties.progressBarValues = this.properties.progressBarValues && this.properties.progressBarValues.filter(item => item.total !== 0);
    }
  }

  ngOnInit() {
    this.properties.progressBarValues = this.properties?.progressBarValues && this.properties?.progressBarValues.filter(item => item.total !== 0);
    this.setLanguage();
  }

  ngOnDestroy(): void {
    this.subResponsive?.unsubscribe();
    this.properties?.onToggle?.complete();
    this.$destroy.next();
    this.$destroy.complete();
  }

  handleCollapsed(event?) {
    this.properties.initialStateCollapse = event ? event : !this.properties.initialStateCollapse;
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

}

