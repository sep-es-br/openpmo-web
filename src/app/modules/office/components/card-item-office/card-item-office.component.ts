import { OfficeService } from './../../../../shared/services/office.service';
import { AuthService } from './../../../../shared/services/auth.service';
import { AuthServerService } from './../../../../shared/services/auth-server.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICardItemOffice } from 'src/app/shared/interfaces/ICardItemOffice';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
registerLocaleData(localePt);

@Component({
  selector: 'app-card-item-office',
  templateUrl: './card-item-office.component.html',
  styleUrls: ['./card-item-office.component.scss']
})
export class CardItemOfficeComponent implements OnInit {

  @Input() properties: ICardItemOffice;
  @Input() displayModeCard: string;
  @Output() deleteOffice = new EventEmitter<IOffice>();

  cardIdItem: string;
  iconImg;
  responsive: boolean;
  editPermission = false;

  constructor(
    private router: Router,
    private responsiveSrv: ResponsiveService,
    private authSrv: AuthService,
    private officeSrv: OfficeService
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
   }

  async ngOnInit() {
    // const isUserAdmin = await this.authSrv.isUserAdmin();
    // this.editPermission = !!isUserAdmin;
    // if (!isUserAdmin) {
    //   this.editPermission = this.properties?.office?.permissions.filter( permission => permission.level === 'EDIT').length > 0; 
    // }
    this.editPermission = this.properties?.editPermission;
    this.cardIdItem = this.properties.itemId || this.properties.itemId === 0 ?
    `ID: ${ this.properties.itemId < 10 && this.properties.itemId !== 0 ? '0'+this.properties.itemId : this.properties.itemId}` : '';
    if ( this.properties.office)  { this.officeSrv.nextIDOffice(this.properties.office.id)};
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

  handleDeleteOffice(office: IOffice) {
    this.deleteOffice.emit(office);
  }
}
