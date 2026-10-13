import { ConfigDataViewService } from './../../services/config-dataview.service';
import { take, takeUntil } from 'rxjs/operators';
import { ResponsiveService } from './../../services/responsive.service';
import { SelectItem } from 'primeng/api';
import { Component, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { CookieService } from 'ngx-cookie';
import { AuthService } from '../../services/auth.service';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { EventEmitter } from 'stream';
import { PersonService } from '../../services/person.service';
import { IPreferences } from '../../interfaces/preferences.interface';

@Component({
  selector: 'app-config-data-view-panel',
  templateUrl: './config-data-view-panel.component.html',
  styleUrls: ['./config-data-view-panel.component.scss']
})
export class ConfigDataViewPanelComponent implements OnInit, OnDestroy {

  @Input() notShowCollapseOptions: boolean = false;
  @Input() notShowpageSizeOptions: boolean = false;
  @Input() notShowLayoutTypeOptions: boolean = false;

  collapsed = true;
  displayMode = 'list';
  user;
  pageSizeOptions: SelectItem[] = [
    { label: '5', value: 5 },
    { label: '15', value: 15 },
    { label: '30', value: 30 }
  ];
  selectedPageSize = 5;
  cookiesPermission: boolean;
  responsive: boolean;
  $destroy = new Subject();
  collapsePanelsStatus: boolean;
  displayModeAll

  constructor(
    private cookieSrv: CookieService,
    private authSrv: AuthService,
    private responsiveSrv: ResponsiveService,
    private configDataSrv: ConfigDataViewService,
    private personSrv : PersonService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.configDataSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsed = collapsePanelStatus === 'collapse' ? true : false;
    });
    this.configDataSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayMode = displayMode;
    });
    this.configDataSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.selectedPageSize = pageSize;
    });
    this.personSrv.$preferences.pipe(takeUntil(this.$destroy)).subscribe(preferences => {
      if (preferences?.pageSize !== undefined && preferences?.pageSize !== null) {
        this.configDataSrv.nextPageSize(preferences.pageSize);
      }
      if (preferences?.displayMode) {
        this.configDataSrv.nextDisplayModeAll(preferences.displayMode.toLowerCase());
      }
    })
    
  }

  async ngOnInit() {
    await this.loadUser();
    this.loadCookiePermission();
    try {
      await this.personSrv.updatePreferences().pipe(takeUntil(this.$destroy), take(1)).toPromise();
    } catch (_) {
      // Keep the current view settings if saved preferences cannot be loaded.
    }
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
        this.handleSetCookiesPermission();
      }
    }
  }

  handleSetCookiesPermission() {
    const date = moment().add(60, 'days').calendar();
    const user = this.authSrv.getTokenPayload();
    if (user && user.email) {
      this.cookieSrv.put('cookiesPermission' + user.email, 'true', { expires: date });
    }
  }

  getCookiesKeys() {
    if (this.user) {
      const preferencesCollapsedExpandMode = this.cookieSrv.get('collapsedAllDataView' + this.user.email);
      this.collapsed = preferencesCollapsedExpandMode ? (preferencesCollapsedExpandMode === 'collapseAll' ? true : false) : this.collapsed;
      this.handleCollapseAll(this.collapsed);
      const savedPreferences = this.personSrv.getPreferencesSnapshot();
      const preferencesDisplayMode = this.cookieSrv.get('displayModeDataView' + this.user.email);
      if (!savedPreferences?.displayMode && preferencesDisplayMode) {
        this.displayMode = preferencesDisplayMode;
        this.configDataSrv.nextDisplayModeAll(this.displayMode);
      }
      const preferencePageSize = this.cookieSrv.get('pageSizeDataView' + this.user.email);
      if ((savedPreferences?.pageSize === undefined || savedPreferences?.pageSize === null) && preferencePageSize) {
        this.selectedPageSize = Number(preferencePageSize);
        this.configDataSrv.nextPageSize(this.selectedPageSize);
      }
    }

  }

  handleCollapseAll(collapseAll: boolean) {
    const mode = collapseAll ? 'collapse' : 'expand';
    this.collapsed = collapseAll;
   
    if (!!this.cookiesPermission) {
      this.setCookiesCollapseExpandMode(collapseAll);
    }
    this.configDataSrv.nextCollapsePanelsStatus(mode);
  }

  handleChangeDisplayMode(displayMode: string) {
    this.displayMode = displayMode;
    if (!!this.cookiesPermission) {
      this.setCookiesDisplayMode(displayMode);
    }
    this.configDataSrv.nextDisplayModeAll(displayMode );
    this.personSrv.nextAndSavePreferences({
      displayMode: displayMode.toUpperCase() as IPreferences['displayMode'],
      pageSize: this.selectedPageSize
    });
  }

  handleChangePageSize() {
    if (!!this.cookiesPermission) {
      this.setCookiesPageSize(this.selectedPageSize);
    }
    this.configDataSrv.nextPageSize(this.selectedPageSize );
    this.personSrv.nextAndSavePreferences({
      pageSize: this.selectedPageSize,
      displayMode: this.displayMode.toUpperCase() as IPreferences['displayMode']
    });
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
