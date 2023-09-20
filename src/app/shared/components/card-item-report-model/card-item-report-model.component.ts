import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICardItem } from '../../interfaces/ICardItem';
import { MobileViewService } from '../../services/mobile-view.service';

@Component({
  selector: 'app-card-item-report-model',
  templateUrl: './card-item-report-model.component.html',
  styleUrls: ['./card-item-report-model.component.scss']
})
export class CardItemReportModelComponent implements OnInit {

  @Input() properties: ICardItem;
  @Input() displayModeCard: string;
  @Output() deleteReport = new EventEmitter();

  cardIdItem: string;
  iconImg;
  responsive: boolean;
  editPermission = false;

  constructor(
    private router: Router,
    private responsiveSrv: MobileViewService,
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
   }

  async ngOnInit() {
    this.editPermission = this.properties?.editPermission;
    this.cardIdItem = this.properties.itemId || this.properties.itemId === 0 ?
    `${ this.properties.itemId < 10 && this.properties.itemId !== 0 ? '0'+this.properties.itemId : this.properties.itemId}` : '';
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

  handleDeleteReport(idReport: number) {
    this.deleteReport.emit({idReport});
  }
}

