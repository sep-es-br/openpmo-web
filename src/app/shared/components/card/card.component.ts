import { Component, Input, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ICard } from '../../interfaces/ICard';
import { ResponsiveService } from '../../services/responsive.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnDestroy {

  @Input() properties: ICard;
  responsive: boolean;
  subResponsive: Subscription;
  language: string;
  $destroy = new Subject();

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService
  ) {
    this.subResponsive = this.responsiveSrv.observable.subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      {
        setTimeout(() => this.setLanguage(), 200);
      }
    );
  }

  ngOnDestroy(): void {
    this.subResponsive?.unsubscribe();
    this.properties?.onToggle?.complete();
    this.$destroy.next();
    this.$destroy.complete();
  }

  handleCollapsed() {
    this.properties.initialStateCollapse = !this.properties.initialStateCollapse;
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

}
