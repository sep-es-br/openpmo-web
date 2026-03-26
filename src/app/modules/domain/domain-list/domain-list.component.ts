import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { PropertyTemplateModel } from './../../../shared/models/PropertyTemplateModel';
import { FilterDataviewPropertiesEntity } from './../../../shared/constants/filterDataviewPropertiesEntity';
import { FilterDataviewService } from './../../../shared/services/filter-dataview.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IDomain } from 'src/app/shared/interfaces/IDomain';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { DomainService } from 'src/app/shared/services/domain.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';

@Component({
  selector: 'app-domain-list',
  templateUrl: './domain-list.component.html',
  styleUrls: ['./domain-list.component.scss']
})
export class DomainListComponent implements OnInit, OnDestroy {

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'domains',
    collapseble: true,
    initialStateCollapse: false
  };
  cardItemsProperties: ICardItem[];
  isUserAdmin: boolean;
  editPermission: boolean;
  $destroy = new Subject();
  responsive: boolean;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  idFilterSelected: number;
  isLoading = false;
  term = '';
  infoPerson;
  showBackToManagement = false;

  constructor(
    private domainSvr: DomainService,
    private translateSvr: TranslateService,
    private activeRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private responsiveSrv: ResponsiveService,
    private filterSrv: FilterDataviewService,
    private router: Router,
    private translateSrv: TranslateService,
    private configDataViewSrv: ConfigDataViewService
  ) {
    localStorage.removeItem('@currentPlan');
    localStorage.removeItem('@pmo/propertiesCurrentPlan');
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  async ngOnInit() {

    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.editPermission = this.isUserAdmin
    if (!this.isUserAdmin && !this.editPermission) {
      this.router.navigate(['/offices']);
    }
    this.isLoading = true;
    await this.loadFiltersDomains();
    await this.loadPropertiesDomains();
    this.breadcrumbSrv.setMenu([
      {
        key: 'administration',
        routerLink: ['/administration'],
      },
      {
        key: 'domains',
        routerLink: ['/domains']
      },
    ]);
    this.checkShowBackToManagement();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  checkShowBackToManagement() {
    this.infoPerson = this.authSrv.getInfoPerson();
    if (this.infoPerson && this.infoPerson.workLocal &&
      (this.infoPerson.workLocal.idOffice || this.infoPerson.workLocal.idPlan || this.infoPerson.workLocal.idWorkpack)) {
      this.showBackToManagement = true;
    }
  }

  async navigateToManagement() {
    const workLocal = this.infoPerson.workLocal;
    if (workLocal.idWorkpackModelLinked && workLocal.idWorkpack && workLocal.idPlan && workLocal.idOffice) {
      this.router.navigate(['workpack'], {
        queryParams: {
          id: Number(workLocal.idWorkpack),
          idPlan: Number(workLocal.idPlan),
          idWorkpackModelLinked: Number(workLocal.idWorkpackModelLinked)
        }
      });
      return;
    }
    if (workLocal.idWorkpack && workLocal.idPlan && workLocal.idOffice) {
      this.router.navigate(['workpack'], {
        queryParams: {
          id: Number(workLocal.idWorkpack),
          idPlan: Number(workLocal.idPlan),
        }
      });
      return;
    }
    if (workLocal.idPlan && workLocal.idOffice) {
      this.router.navigate(['plan'], {
        queryParams: {
          id: Number(workLocal.idPlan),
        }
      });
      return;
    }
    if (workLocal.idOffice) {
      this.router.navigate(['offices/office'], {
        queryParams: {
          id: Number(workLocal.idOffice),
        }
      });
      return;
    }
  }

  async loadPropertiesDomains() {
    this.isLoading = true;
    const { success, data } = await this.domainSvr.GetAll({
      idFilter: this.idFilterSelected,
      term: this.term
    });
    const itemsProperties: ICardItem[] = this.editPermission ? [
      {
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        urlCard: '/domains/detail'
      }
    ] : [];
    this.cardProperties.showCreateNemElementButton = this.editPermission ? true : false;
    if (success) {

      itemsProperties.unshift(...data.map(domain => ({
        typeCardItem: 'listItem',
        iconSvg: true,
        icon: IconsEnum.MapMarked,
        nameCardItem: domain.name,
        fullNameCardItem: domain.fullName,
        itemId: domain.id,
        menuItems: [{
          label: this.translateSvr.instant('delete'), icon: 'fas fa-trash-alt',
          command: () => this.deleteDomain(domain),
          disabled: !this.editPermission
        }] as MenuItem[],
        urlCard: 'domains/detail'
      })));
    }
    this.isLoading = false;
    this.cardItemsProperties = itemsProperties;
    this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;

  }

  async deleteDomain(domain: IDomain) {
    const { success } = await this.domainSvr.delete(domain);
    if (success) {
      this.cardItemsProperties = Array.from(this.cardItemsProperties.filter(element => element.itemId !== domain.id));
      this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;
    }
  };

  async loadFiltersDomains() {
    const result = await this.filterSrv.getAllFilters('domains');
    if (result.success && result.data.length > 0) {
      const filterDefault = result.data.find(filter => !!filter.favorite);
      this.idFilterSelected = filterDefault ? filterDefault.id : undefined;
      this.cardProperties.filters = result.data;
    }
    this.cardProperties.showFilters = true;
  }

  handleEditFilter(event) {
    const idFilter = event.filter;
    if (idFilter) {
      const filterProperties = this.loadFilterPropertiesList();
      this.filterSrv.setFilterProperties(filterProperties);
      this.setBreadcrumbStorage();
      this.router.navigate(['/config/filter-dataview'], {
        queryParams: {
          entityName: 'domains'
        }
      });
    }
  }

  async handleSelectedFilter(event) {
    const idFilter = event.filter;
    this.idFilterSelected = idFilter;
    await this.loadPropertiesDomains();
  }

  async handleSearchText(event) {
    this.term = event.term;
    await this.loadPropertiesDomains();
  }

  handleNewFilter() {
    const filterProperties = this.loadFilterPropertiesList();
    this.filterSrv.setFilterProperties(filterProperties);
    this.setBreadcrumbStorage();
    this.router.navigate(['/config/filter-dataview'], {
      queryParams: {
        entityName: 'domains',
      }
    });
  }

  loadFilterPropertiesList() {
    const listProperties = FilterDataviewPropertiesEntity.domains;
    const filterPropertiesList = listProperties.map(prop => {
      const property: IFilterProperty = {
        type: prop.type,
        label: prop.label,
        name: prop.apiValue,
        active: true,
      }
      return property;
    });
    return filterPropertiesList;
  }

  setBreadcrumbStorage() {
    const breadcrumb = [
      {
        key: 'administration',
        routerLink: ['/administration'],
      },
      {
        key: 'domains',
        routerLink: ['/domains'],
        admin: true
      }
      ];
    this.breadcrumbSrv.setBreadcrumbStorage(breadcrumb);
  }

  createNewDomain() {
    this.router.navigate(['/domains/detail']);
  }

}
