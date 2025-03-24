import { takeUntil } from 'rxjs/operators';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { IFilterProperty } from './../../../shared/interfaces/IFilterProperty';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { FilterDataviewService } from '../../../shared/services/filter-dataview.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { AuthService } from 'src/app/shared/services/auth.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { ICardItemOffice } from 'src/app/shared/interfaces/ICardItemOffice';
import { CookieService } from 'ngx-cookie';
import * as moment from 'moment';
import { enterLeave } from '../../../shared/animations/enterLeave.animation';
import { Subject } from 'rxjs';
import { StoreKeys } from 'src/app/shared/constants';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';

@Component({
  selector: 'app-office-list',
  templateUrl: './office-list.component.html',
  styleUrls: ['./office-list.component.scss'],
  animations: [
    enterLeave(
      { opacity: 0, pointerEvents: 'none', transform: 'translateY(100%)' },
      { opacity: 1, pointerEvents: 'all', transform: 'translateY(0)' },
      300
    )
  ]
})
export class OfficeListComponent implements OnInit, OnDestroy {

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'offices',
    collapseble: true,
    initialStateCollapse: false,
    showFilters: true
  };
  cardItemsProperties: ICardItemOffice[];
  isUserAdmin: boolean;
  isListEmpty = false;
  collapsePanelsStatus = false;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  filterProperties: IFilterProperty[] = this.filterSrv.get;
  idFilterSelected: number;
  showCookiesPermissionMessage = false;
  responsive = false;
  $destroy = new Subject();
  isLoading = false;
  term = '';

  constructor(
    private officeSvr: OfficeService,
    private router: Router,
    private authSrv: AuthService,
    private filterSrv: FilterDataviewService,
    private breadcrumbSrv: BreadcrumbService,
    private cookieSrv: CookieService,
    private responsiveSrv: ResponsiveService,
    private configDataViewSrv: ConfigDataViewService
  ) {
    this.officeSvr.nextIDOffice(0);
    localStorage.removeItem('@currentPlan');
    localStorage.removeItem('@pmo/propertiesCurrentPlan');
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    localStorage.removeItem('open-pmo:WORKPACK_TABVIEW');
   }

  async ngOnInit() {
    await this.loadFiltersOffices();
    await this.loadPropertiesOffice();
    this.breadcrumbSrv.setMenu([]);
    this.loadCookiesConfigStoraged();
  }

  ngOnDestroy() {
    this.$destroy.next();
    this.$destroy.complete();
  }

  loadCookiesConfigStoraged() {
    const user = this.authSrv.getTokenPayload();
    const cookiesPermission = this.cookieSrv.get('cookiesPermission' + user.email);
    if(!!cookiesPermission) {
      this.showCookiesPermissionMessage = false;
      this.handleSetCookiesPermission();
    } else {
      const cookiesDecline = localStorage.getItem('cookiesDecline' + user.email);
      if (!!cookiesDecline) {
        this.showCookiesPermissionMessage = false;
      } else {
        this.showCookiesPermissionMessage = true;
      }
    }
  }

  handleSetCookiesPermission() {
    const date = moment().add(60, 'days').calendar();
    const user = this.authSrv.getTokenPayload();
    if (user && user.email) {
      this.cookieSrv.put('cookiesPermission' + user.email, 'true', { expires: date });
      const language = localStorage.getItem(StoreKeys.defaultLanguage);
      this.cookieSrv.put('cookiesDefaultLanguateUser' + user.email, language, { expires: date });
    }
    this.showCookiesPermissionMessage = false;
  }

  handleSetCookiesDecline() {
    const user = this.authSrv.getTokenPayload();
    if (user && user.email) {
      localStorage.setItem('cookiesDecline' + user.email, 'true');
    }
    this.showCookiesPermissionMessage = false;
  }

  async loadPropertiesOffice() {
    this.isLoading = true;
    const { success, data } = await this.officeSvr.GetAll({
      idFilter: this.idFilterSelected,
      term: this.term
    });
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    const itemsProperties: ICardItemOffice[] = this.isUserAdmin ? [
      {
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        urlCard: '/offices/office',
      }
    ] : [];
    this.cardProperties.showCreateNemElementButton = this.isUserAdmin ? true : false;
    if (success) {
      this.isListEmpty = !data.length;
      if (this.isListEmpty && !this.isUserAdmin) {
        const personInfo = await this.authSrv.getInfoPerson();
        if (personInfo.isCcbMember) {
          this.router.navigate(['/ccbmember-baselines-view']);
        } else {
          this.authSrv.nextIsLoginDenied(true);
          await this.router.navigate(['/login']);
        }
      }
      itemsProperties.unshift(...data.map(office => {
        const editPermissions = (!this.isUserAdmin && office.permissions) && office.permissions.filter(p => p.level === 'EDIT').length > 0;
        const editPermission = this.isUserAdmin ? true : editPermissions;
        const officeCardItem = {
          typeCardItem: 'listItem',
          iconSvg: true,
          icon: IconsEnum.Offices,
          nameCardItem: office.name,
          fullNameCardItem: office.fullName,
          itemId: office.id,
          menuConfig: true,
          urlMenuConfig: editPermission ? '/configuration-office' : undefined,
          paramsUrlMenuConfig: editPermission ? [{ name: 'idOffice', value: office.id }] : undefined,
          urlCard: 'office',
          editPermission,
          office
        };
        return officeCardItem;
      }));
      this.isLoading = false;
    }

    this.cardItemsProperties = itemsProperties;
    this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;
  }

  async deleteOffice(office: IOffice) {
    const { success } = await this.officeSvr.delete(office);
    if (success) {
      this.cardItemsProperties = Array.from(this.cardItemsProperties.filter(c => c.itemId !== office.id));
      this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;
    }
  }

  navigateToPage(url: string, idOffice: number) {
    this.router.navigate([`${url}`]);
    this.router.navigate([url], { queryParams: { idOffice } });
  }

  handleCreateNewOffice() {
    this.router.navigate(['/offices', 'office']);
  }

  async loadFiltersOffices() {
    const result = await this.filterSrv.getAllFilters('offices');
    if (result.success && result.data.length > 0) {
      const filterDefault = result.data.find(filter => !!filter.favorite);
      this.idFilterSelected = filterDefault ? filterDefault.id : undefined;
      this.cardProperties = {
        ...this.cardProperties,
        filters: result.data
      };
    }
  }

  handleEditFilter(event) {
    const idFilter = event.filter;
    if (idFilter) {
      const filterProperties = this.loadFilterPropertiesList();
      this.filterSrv.setFilterProperties(filterProperties);
      localStorage.removeItem('@pmo/current-breadcrumb');
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          idFilter,
          entityName: 'offices'
        }
      });
    }
  }

  async handleSelectedFilter(event) {
    const idFilter = event.filter;
    this.idFilterSelected = idFilter;
    await this.loadPropertiesOffice();
  }

  async handleSearchText(event) {
    this.term = event.term;
    await this.loadPropertiesOffice();
  }

  handleNewFilter() {
    const filterProperties = this.loadFilterPropertiesList();
    this.filterSrv.setFilterProperties(filterProperties);
    localStorage.removeItem('@pmo/current-breadcrumb');
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: 'offices'
      }
    });
  }

  loadFilterPropertiesList() {
    const listProperties = FilterDataviewPropertiesEntity.offices;
    const filterPropertiesList = listProperties.map(prop => {
      const property: IFilterProperty = {
        type: prop.type,
        label: prop.label,
        name: prop.apiValue,
        active: true,
      };
      return property;
    });
    return filterPropertiesList;
  }


}
