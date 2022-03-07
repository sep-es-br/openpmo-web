import { takeUntil } from 'rxjs/operators';
import { ResponsiveService } from './../../services/responsive.service';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { IPerson } from './../../interfaces/IPerson';
import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CookieService } from 'ngx-cookie';
import { AuthService } from '../../services/auth.service';
import * as moment from 'moment';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-config-data-view-panel',
  templateUrl: './config-data-view-panel.component.html',
  styleUrls: ['./config-data-view-panel.component.scss']
})
export class ConfigDataViewPanelComponent implements OnInit, OnDestroy {

  @Output() changeDisplayMode = new EventEmitter();
  @Output() changeCollapsedExpand = new EventEmitter();
  @Output() changePageSize = new EventEmitter();
  @Input() notShowCollapseOptions: boolean = false;

  collapsed = true;
  displayMode = 'grid';
  user;
  pageSizeOptions: SelectItem[] = [
    { label: '5', value: 5 },
    { label: '15', value: 15 },
    { label: '30', value: 30 }
  ];
  selectedPageSize: number;
  cookiesPermission: boolean;
  responsive: boolean;
  $destroy = new Subject();

  constructor(
    private cookieSrv: CookieService,
    private authSrv: AuthService,
    private confirmationSrv: ConfirmationService,
    private translateSrv: TranslateService,
    private responsiveSrv: ResponsiveService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  async ngOnInit() {
    await this.loadUser();
    this.loadCookiePermissionFromStorage();
    if (!!this.cookiesPermission) { this.getCookiesKeys() };
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async loadUser() {
    this.user = this.authSrv.getTokenPayload();
  }

  loadCookiePermissionFromStorage() {
    if (this.user) {
      const cookiesPermission = localStorage.getItem('cookiesPermission'+ this.user.email);
      if (cookiesPermission === 'true') {
        this.cookiesPermission = true;
      } else if (cookiesPermission === 'false') {
        this.cookiesPermission = false;
      }
    }
  }

  getCookiesKeys() {
    if (this.user) {
      const preferencesCollapsedExpandMode = this.cookieSrv.get('collapsedAllDataView' + this.user.email);
      this.collapsed = preferencesCollapsedExpandMode ? (preferencesCollapsedExpandMode === 'collapseAll' ? true : false) : true;
      this.handleCollapseAll(this.collapsed);
      const preferencesDisplayMode = this.cookieSrv.get('displayModeDataView' + this.user.email);
      this.displayMode = preferencesDisplayMode ? preferencesDisplayMode : 'grid';
      this.handleChangeDisplayMode(this.displayMode);
      const preferencePageSize = this.cookieSrv.get('pageSizeDataView' + this.user.email);
      this.selectedPageSize = preferencePageSize ? Number(preferencePageSize) : 5;
      this.handleChangePageSize();
    }

  }

  handleCollapseAll(collapseAll: boolean) {
    const mode = collapseAll ? 'collapse' : 'expand';
    this.collapsed = collapseAll;
    if (this.cookiesPermission === undefined) {
      this.confirmationSrv.confirm({
        message: `${this.translateSrv.instant('messages.setCookiesPermission')}`,
        key: 'cookiesPermission',
        acceptLabel: this.translateSrv.instant('yes'),
        rejectLabel: this.translateSrv.instant('no'),
        accept: async () => {
          localStorage.setItem('cookiesPermission'+ this.user.email, 'true');
          this.cookiesPermission = true;
          this.setCookiesCollapseExpandMode(collapseAll);
        },
        reject: () => {
          localStorage.setItem('cookiesPermission'+ this.user.email, 'false');
          this.cookiesPermission = false;
        }
      });
    } else if (this.cookiesPermission === true) {
      this.setCookiesCollapseExpandMode(collapseAll);
    }
    this.changeCollapsedExpand.emit({ mode });
  }

  handleChangeDisplayMode(displayMode: string) {
    this.displayMode = displayMode;
    if (this.cookiesPermission === undefined) {
      this.confirmationSrv.confirm({
        message: `${this.translateSrv.instant('messages.setCookiesPermission')}`,
        key: 'cookiesPermission',
        acceptLabel: this.translateSrv.instant('yes'),
        rejectLabel: this.translateSrv.instant('no'),
        accept: async () => {
          localStorage.setItem('cookiesPermission'+ this.user.email, 'true');
          this.cookiesPermission = true;
          this.setCookiesDisplayMode(displayMode);
        },
        reject: () => {
          localStorage.setItem('cookiesPermission'+ this.user.email, 'false');
          this.cookiesPermission = false;
        }
      });
    } else if (this.cookiesPermission === true) {
      this.setCookiesDisplayMode(displayMode);
    }
    this.changeDisplayMode.emit({ displayMode });
  }

  handleChangePageSize() {
    if (this.cookiesPermission === undefined) {
      this.confirmationSrv.confirm({
        message: `${this.translateSrv.instant('messages.setCookiesPermission')}?`,
        key: 'cookiesPermission',
        acceptLabel: this.translateSrv.instant('yes'),
        rejectLabel: this.translateSrv.instant('no'),
        accept: async () => {
          localStorage.setItem('cookiesPermission'+ this.user.email, 'true');
          this.cookiesPermission = true;
          this.setCookiesPageSize(this.selectedPageSize);
        },
        reject: () => {
          localStorage.setItem('cookiesPermission'+ this.user.email, 'false');
          this.cookiesPermission = false;
        }
      });
    } else if (this.cookiesPermission === true) {
      this.setCookiesPageSize(this.selectedPageSize);
    }
    this.changePageSize.emit({ pageSize: this.selectedPageSize });
  }

  setCookiesDisplayMode(displayMode: string) {
    const date = moment().add(60, 'days').calendar();
    if (this.user && this.user.email) {
      this.cookieSrv.put('displayModeDataView' + this.user.email, displayMode, { expires: date });
    }
  }

  setCookiesCollapseExpandMode(collapseAll: boolean) {
    const date = moment().add(60, 'days').calendar();
    if (this.user && this.user.email) {
      this.cookieSrv.put('collapsedAllDataView' + this.user.email, collapseAll ? 'collapseAll' : 'expandAll', { expires: date });
    }
  }

  setCookiesPageSize(pageSize: number) {
    const date = moment().add(60, 'days').calendar();
    if (this.user && this.user.email) {
      this.cookieSrv.put('pageSizeDataView' + this.user.email, pageSize.toString(10), { expires: date });
    }
  }

}
