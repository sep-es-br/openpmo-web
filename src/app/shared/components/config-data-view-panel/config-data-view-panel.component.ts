import { takeUntil } from 'rxjs/operators';
import { ResponsiveService } from './../../services/responsive.service';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService, SelectItem } from 'primeng/api';
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
    this.loadCookiePermission();
    if (!!this.cookiesPermission) { this.getCookiesKeys() };
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async loadUser() {
    this.user = this.authSrv.getTokenPayload();
  }

  loadCookiePermission() {
    if (this.user) {
      const cookiesPermission = this.cookieSrv.get('cookiesPermission'+ this.user.email);
      if (!!cookiesPermission) {
        this.cookiesPermission = true;
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
    if (!!this.cookiesPermission) {
      this.setCookiesCollapseExpandMode(collapseAll);
    }
    this.changeCollapsedExpand.emit({ mode });
  }

  handleChangeDisplayMode(displayMode: string) {
    this.displayMode = displayMode;
    if (!!this.cookiesPermission) {
      this.setCookiesDisplayMode(displayMode);
    }
    this.changeDisplayMode.emit({ displayMode });
  }

  handleChangePageSize() {
    if (!!this.cookiesPermission) {
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
