import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { IIndicator } from '../../../../shared/interfaces/IIndicator';
import { ISection } from '../../../../shared/interfaces/ISectionWorkpack';
import { IWorkpackData, IWorkpackParams } from '../../../../shared/interfaces/IWorkpackDataParams';
import { WorkpackService } from '../../../../shared/services/workpack.service';
import { ResponsiveService } from '../../../../shared/services/responsive.service';
import { ConfigDataViewService } from '../../../../shared/services/config-dataview.service';
import { IndicatorService } from '../../../../shared/services/indicator.service';
import { WorkpackBreadcrumbStorageService } from '../../../../shared/services/workpack-breadcrumb-storage.service';
import { FilterDataviewPropertiesEntity } from '../../../../shared/constants/filterDataviewPropertiesEntity';
import { IFilterProperty } from '../../../../shared/interfaces/IFilterProperty';
import { FilterDataviewService } from '../../../../shared/services/filter-dataview.service';
import { IconsEnum } from '../../../../shared/enums/IconsEnum';
import { WorkpackShowTabviewService } from '../../../../shared/services/workpack-show-tabview.service';

@Component({
  selector: 'app-workpack-section-indicators',
  templateUrl: './workpack-section-indicators.component.html',
  styleUrls: ['./workpack-section-indicators.component.scss']
})
export class WorkpackSectionIndicatorsComponent implements OnInit {

  totalRecordsIndicators: number;
  indicators: IIndicator[];
  sectionIndicators: ISection;
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  $destroy = new Subject();
  collapsePanelsStatus: boolean;
  displayModeAll: string;
  pageSize: number;
  responsive = false;
  showTabview = false;
  idFilterSelected: number;
  term = '';
  filters;
  sectionActive = false;

  constructor(
    private filterSrv: FilterDataviewService,
    private router: Router,
    private workpackSrv: WorkpackService,
    private translateSrv: TranslateService,
    private configDataViewSrv: ConfigDataViewService,
    private workpackBreadcrumbStorageSrv: WorkpackBreadcrumbStorageService,
    private responsiveSrv: ResponsiveService,
    private indicatorSrv: IndicatorService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService
  ) {
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(responsive => this.responsive = responsive);
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.sectionIndicators = this.sectionIndicators && Object.assign({}, {
        ...this.sectionIndicators,
        cardSection: {
          ...this.sectionIndicators.cardSection,
          initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus
        }
      });
    });
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
    this.sectionIndicators = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: this.showTabview ? '' : 'indicators',
        collapseble: this.showTabview ? false : true,
        initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus,
        showFilters: true,
        isLoading: true,
        filters: this.filters && this.filters.length > 0 ? this.filters : [],
        showCreateNemElementButton: this.workpackSrv.getEditPermission() ? true : false,
      }
    };
    this.indicatorSrv.observableResetIndicator.pipe(takeUntil(this.$destroy)).subscribe(reset => {
      if (reset) {
        this.loadIndicatorsData();
      }
    });
  }

  ngOnInit(): void {
    this.loadIndicatorsData();
  }

  loadIndicatorsData() {
    const {
      workpackData,
      workpackParams,
      filters,
      indicators,
      term,
      idFilterSelected,
      loading
    } = this.indicatorSrv.getIndicatorsData();
    this.workpackData = workpackData;
    this.workpackParams = workpackParams;
    this.filters = filters;
    this.indicators = indicators;
    this.idFilterSelected = idFilterSelected;
    this.term = term;
    this.sectionActive = !!(this.workpackData && this.workpackData?.workpack?.id && this.workpackData?.workpackModel);
    if (!loading) this.loadIndicatorSection();
  }

  async getIndicators() {
    this.indicatorSrv.loadIndicators({ idFilterSelected: this.idFilterSelected, term: this.term });
  }

  handleCreateNewIndicator() {
    this.router.navigate(['/workpack/indicators'], {
      queryParams: {
        idWorkpack: this.workpackParams.idWorkpack
      }
    });
  }

  async deleteIndicator(indicator: IIndicator) {
    const result = await this.indicatorSrv.delete(indicator, { useConfirm: true });
    if (result.success) {
      this.sectionIndicators.cardItemsSection = Array.from(this.sectionIndicators.cardItemsSection.filter(i => i.itemId !== indicator.id));
      this.indicatorSrv.deleteIndicatorFromData(indicator.id);
    }
  }

  async handleSelectedFilterIndicator(event) {
    this.idFilterSelected = event.filter;
    this.getIndicators();
  }

  async handleSearchText(event) {
    this.term = event.term;
    this.getIndicators();
  }

  async loadIndicatorSection() {
    if (!this.sectionActive) return;
    this.sectionIndicators = {
      ...this.sectionIndicators,
      cardSection: {
        ...this.sectionIndicators.cardSection,
        filters: this.filters && this.filters.length > 0 ? this.filters : [],
        showCreateNemElementButton: this.workpackSrv.getEditPermission() ? true : false,
        idFilterSelected: this.idFilterSelected,
        searchTerm: this.term,
        isLoading: false
      },
      cardItemsSection: await this.loadSectionIndicatorsCards()
    };
    this.totalRecordsIndicators = this.sectionIndicators.cardItemsSection && this.sectionIndicators.cardItemsSection.length;
  }

  async loadSectionIndicatorsCards() {
    if (this.indicators && this.indicators.length > 0) {
      const cardItems = this.indicators.map(indicator => ({
        typeCardItem: 'listItemIndicator',
        icon: 'process',
        iconSvg: true,
        nameCardItem: indicator.name,
        itemId: indicator.id,
        idAtributeName: 'idIndicator',
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteIndicator(indicator),
          disabled: !this.workpackSrv.getEditPermission()
        }] as MenuItem[],
        urlCard: '/workpack/indicators',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
          { name: 'id', value: indicator.id },
        ]
      }));
      if (this.workpackSrv.getEditPermission() && !this.workpackData.workpack.canceled) {
        cardItems.push({
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconSvg: true,
          nameCardItem: null,
          itemId: null,
          idAtributeName: 'idIndicator',
          menuItems: null,
          urlCard: '/workpack/indicators',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
          ]
        });
      }
      return cardItems;
    } else {
      const cardItem = (this.workpackSrv.getEditPermission() && !this.workpackData.workpack.canceled) ? [{
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        iconSvg: true,
        nameCardItem: null,
        itemId: null,
        menuItems: null,
        urlCard: '/workpack/indicators',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
        ]
      }] : [];
      return cardItem;
    }
  }

  async handleEditFilterEntity(event, entityName: string) {
    const idFilter = event.filter;
    if (idFilter) {
      const filterProperties = this.loadFilterPropertiesList(entityName);
      this.filterSrv.setFilterProperties(filterProperties);
      await this.workpackBreadcrumbStorageSrv.setBreadcrumbStorage();
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          idFilter: idFilter,
          entityName,
          idWorkpackModel: this.workpackData.workpackModel.id,
          idOffice: this.workpackParams.idOffice
        }
      });
    }
  }

  async handleNewFilterEntity(entityName: string) {
    await this.workpackBreadcrumbStorageSrv.setBreadcrumbStorage();
    const filterProperties = this.loadFilterPropertiesList(entityName);
    this.filterSrv.setFilterProperties(filterProperties);
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName,
        idWorkpackModel: this.workpackData.workpackModel.id,
        idOffice: this.workpackParams.idOffice
      }
    });
  }

  loadFilterPropertiesList(entityName: string) {
    const listProperties = FilterDataviewPropertiesEntity[entityName];
    const filterPropertiesList = listProperties.map(prop => {
      const property: IFilterProperty = {
        type: prop.type,
        label: prop.label,
        name: prop.apiValue,
        active: true,
        possibleValues: prop.possibleValues
      };
      return property;
    });
    return filterPropertiesList;
  }
}