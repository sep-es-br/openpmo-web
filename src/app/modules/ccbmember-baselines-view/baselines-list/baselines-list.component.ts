import { ConfigDataViewService } from './../../../shared/services/config-dataview.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { BaselineService } from 'src/app/shared/services/baseline.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { IBaseline } from '../../../shared/interfaces/IBaseline';
import { FilterDataviewService } from 'src/app/shared/services/filter-dataview.service';
import { Router } from '@angular/router';
import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { BaselinesPanelsEnum } from 'src/app/shared/enums/BaselinesPanelsEnum';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-baselines-list',
  templateUrl: './baselines-list.component.html',
  styleUrls: ['./baselines-list.component.scss']
})
export class BaselinesListComponent implements OnInit, OnDestroy {
  $destroy = new Subject();
  responsive: boolean;
  cardsBaselines: ICard[] = [];

  displayModeAll = 'grid';
  collapsePanelsStatus = true;
  pageSize = 5;
  isLoading = false;
  panelsEnum = BaselinesPanelsEnum;
  filters

  constructor(
    private responsiveSrv: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private baselineSrv: BaselineService,
    private configDataViewSrv: ConfigDataViewService,
    private filterSrv: FilterDataviewService,
    private router: Router,
  ) {
    localStorage.removeItem('@currentPlan');
    localStorage.removeItem('@pmo/propertiesCurrentPlan');
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.cardsBaselines = this.cardsBaselines.map(card => ({
        ...card,
        initialStateCollapse: this.collapsePanelsStatus,
      }));
    });
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
  }

  async ngOnInit(): Promise<void> {
    await this.setBreadcrumb();
    this.setCardsBaselines();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'changeControlBoard',
        routerLink: ['/ccbmember-baselines-view'],
      }
    ]);
  }

  async setCardsBaselines() {
    this.cardsBaselines = [];
    Object
      .keys(BaselinesPanelsEnum)
      .forEach(async (key) => {
        this.cardsBaselines.push({
          toggleable: false,
          initialStateToggle: false,
          collapseble: true,
          initialStateCollapse: false,
          isLoading: true,
          cardTitle: key,
          showFilters: true
        });
      });
    await this.loadFiltersBaselines();
    Object
      .keys(BaselinesPanelsEnum)
      .forEach(async (key) => {
        await this.loadBaselineByStatus(key);
      });
  }

  async loadFiltersBaselines() {
    const result = await this.filterSrv.getAllFilters('baselines');
    if (result.success && result.data.length > 0) {
      const filterDefault = result.data.find(filter => !!filter.favorite);
      this.cardsBaselines.forEach(card => {
        card.filters = result.data;
        card.idFilterSelected = filterDefault ? filterDefault.id : undefined;
      });
    }
  }

  async loadBaselineByStatus(status, term?) {
    const cardIndex = this.cardsBaselines.findIndex(card => card.cardTitle === status);
    const { data, success } = await this.baselineSrv.getBaselinesFromCcbMember({
      status: status,
      idFilter: this.cardsBaselines[cardIndex].idFilterSelected,
      term
    });
    if (success) {
      this.cardsBaselines[cardIndex] = {
        ...this.cardsBaselines[cardIndex],
        isLoading: false,
        searchTerm: term ? term : '',
        cardItems: this.getCardItemsBaseline(data)
      }
    }
  }

  getCardItemsBaseline(baselines: IBaseline[]) {
    const getCardItem = (baselineItem: IBaseline) => ({
      typeCardItem: 'listItem',
      icon: !!baselineItem.cancelation ? 'fas fa-times' : 'baseline',
      iconColor: baselineItem.cancelation && '#FF7F81',
      iconSvg: !baselineItem.cancelation,
      nameCardItem: baselineItem.name,
      baselineStatus: baselineItem.status.toLowerCase(),
      baselineStatusDate: baselineItem.active ? baselineItem.activationDate :
        (['PROPOSED', 'REJECTED'].includes(baselineItem.status) ? baselineItem.proposalDate : (baselineItem.status === 'APPROVED' ? baselineItem.activationDate : 'NONE')),
      baselineActive: baselineItem.active,
      itemId: baselineItem.id,
      urlCard: '/ccbmember-baselines-view/baseline',
      paramsUrlCard: [
        { name: 'id', value: baselineItem.id },
      ]
    });
    return baselines.map(getCardItem);
  }

  handleEditFilter(event) {
    this.setBreadcrumbStorage();
    const idFilter = event.filter;
    if (idFilter) {
      const filterProperties = this.loadFilterPropertiesList();
      this.filterSrv.setFilterProperties(filterProperties);
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName: 'baselines'
        }
      });
    }
  }

  async handleSelectedFilter(event, status) {
    const cardIndex = this.cardsBaselines.findIndex(card => card.cardTitle === status);
    this.cardsBaselines[cardIndex].idFilterSelected = event.filter;
    this.cardsBaselines[cardIndex].isLoading = true;
    await this.loadBaselineByStatus(status);
  }

  handleNewFilter() {
    this.setBreadcrumbStorage();
    const filterProperties = this.loadFilterPropertiesList();
    this.filterSrv.setFilterProperties(filterProperties);
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: 'baselines'
      }
    });
  }

  loadFilterPropertiesList() {
    const listProperties = FilterDataviewPropertiesEntity.baselines;
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

  async handleSearchText(event, status) {
    await this.loadBaselineByStatus(status, event.term);
  }

  setBreadcrumbStorage() {
    this.breadcrumbSrv.setBreadcrumbStorage([
      {
        key: 'changeControlBoard',
        routerLink: ['/ccbmember-baselines-view'],
      },
      {
        key: 'filter',
        routerLink: ['/filter-dataview']
      }]);
  }

}
