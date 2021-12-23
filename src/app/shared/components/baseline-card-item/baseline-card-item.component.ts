import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Router } from '@angular/router';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { Component, OnInit, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-baseline-card-item',
  templateUrl: './baseline-card-item.component.html',
  styleUrls: ['./baseline-card-item.component.scss']
})
export class BaselineCardItemComponent implements OnInit, OnDestroy {

  @Input() properties: ICardItem;
  @Input() displayModeCard: string;
  @Output() reuseModelSelected = new EventEmitter();

  cardIdItem: string;
  iconImg;
  responsive: boolean;
  showMenuNewModel = false;
  language: string;
  $destroy = new Subject();

  constructor(
    private router: Router,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
      this.ngOnInit();
    });
  }

  ngOnInit(): void {
    this.setLanguage();
    this.cardIdItem = this.properties.itemId || this.properties.itemId === 0 ?
      `ID: ${this.properties.itemId < 10 && this.properties.itemId !== 0 ? '0' + this.properties.itemId : this.properties.itemId}` : '';
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en';
  }

  navigateToPage(url: string, params?: { name: string; value: string | number }[]) {
    const queryParams = params && params.reduce((obj, item) => ((obj[item.name] = item.value), obj), {});
    this.router.navigate(
      [url],
      {
        queryParams
      }
    );
  }

  getQueryParams() {
    let params = this.properties?.itemId ? { id: this.properties.itemId } : {};
    if (this.properties.paramsUrlCard) {
      params = {
        ...params,
        ... this.properties.paramsUrlCard.reduce((obj, item) => ((obj[item.name] = item.value), obj), {})
      };
    }
    return params;
  }

  handleModelSelected(event) {
    this.reuseModelSelected.next({idModel: event.node.data});
  }
}
