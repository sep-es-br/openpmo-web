import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ICardItem } from '../../interfaces/ICardItem';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { ResponsiveService } from '../../services/responsive.service';
registerLocaleData(localePt);

@Component({
  selector: 'app-card-item',
  templateUrl: './card-item.component.html',
  styleUrls: ['./card-item.component.scss']
})
export class CardItemComponent implements OnInit {

  @Input() properties: ICardItem;

  cardIdItem: string;
  iconImg;
  responsive: boolean;

  constructor(
    private router: Router,
    private responsiveSrv: ResponsiveService,
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
   }

  ngOnInit(): void {
    this.cardIdItem = this.properties.itemId || this.properties.itemId === 0 ?
    `ID: ${ this.properties.itemId < 10 && this.properties.itemId !== 0 ? '0'+this.properties.itemId : this.properties.itemId}` : '';
  }

  navigateToPage(url: string, params?: {name: string; value: string | number}[]) {
    const queryParams = params && params.reduce((obj, item) => ((obj[item.name] = item.value), obj), {});
    this.router.navigate(
      [url],
      {
        queryParams
      }
    );
  }

  getQueryParams() {
    let params = this.properties?.itemId ? { id: this.properties.itemId } : { };
    if (this.properties.paramsUrlCard) {
      params = {
        ... params,
        ... this.properties.paramsUrlCard.reduce((obj, item) => ((obj[item.name] = item.value), obj), {})
      };
    }
    return params;
  }
}
