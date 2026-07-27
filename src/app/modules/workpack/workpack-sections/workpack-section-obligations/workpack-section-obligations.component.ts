import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IObligation } from 'src/app/shared/interfaces/IObligation';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { ISection } from 'src/app/shared/interfaces/ISectionWorkpack';
import {
  IWorkpackData,
  IWorkpackParams,
} from 'src/app/shared/interfaces/IWorkpackDataParams';
import { ObligationsService } from 'src/app/shared/services/obligations.service';

import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { FilterDataviewService } from 'src/app/shared/services/filter-dataview.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackBreadcrumbStorageService } from 'src/app/shared/services/workpack-breadcrumb-storage.service';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { truncateText } from 'src/app/shared/utils/truncateText';

@Component({
  selector: 'app-workpack-section-obligations',
  templateUrl: './workpack-section-obligations.component.html',
  styleUrls: ['./workpack-section-obligations.component.scss'],
})
export class WorkpackSectionObligationsComponent implements OnInit, OnDestroy {
  totalRecordsObligations: number;

  obligations: IObligation[];

  sectionObligations: ISection;

  workpackData: IWorkpackData;

  workpackParams: IWorkpackParams;

  $destroy = new Subject<void>();

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
    private obligationsSrv: ObligationsService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService
  ) {
    this.workpackShowTabviewSrv.observable
      .pipe(takeUntil(this.$destroy))
      .subscribe((value) => {
        this.showTabview = value;
      });

    this.responsiveSrv.observable
      .pipe(takeUntil(this.$destroy))
      .subscribe((value) => {
        this.responsive = value;
      });

    this.configDataViewSrv.observableCollapsePanelsStatus
      .pipe(takeUntil(this.$destroy))
      .subscribe((collapsePanelStatus) => {
        this.collapsePanelsStatus = collapsePanelStatus === 'collapse';

        this.sectionObligations = this.sectionObligations && {
          ...this.sectionObligations,
          cardSection: {
            ...this.sectionObligations.cardSection,
            initialStateCollapse: this.showTabview
              ? false
              : this.collapsePanelsStatus,
          },
        };
      });

    this.configDataViewSrv.observableDisplayModeAll
      .pipe(takeUntil(this.$destroy))
      .subscribe((displayMode) => {
        this.displayModeAll = displayMode;
      });

    this.configDataViewSrv.observablePageSize
      .pipe(takeUntil(this.$destroy))
      .subscribe((pageSize) => {
        this.pageSize = pageSize;
      });

    this.sectionObligations = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: this.showTabview ? '' : 'obligations',
        collapseble: !this.showTabview,
        initialStateCollapse: this.showTabview
          ? false
          : this.collapsePanelsStatus,
        showFilters: true,
        isLoading: true,
        filters: this.filters?.length ? this.filters : [],
        showCreateNemElementButton: this.workpackSrv.getEditPermission(),
      },
    };

    this.obligationsSrv.observableResetObligations
      .pipe(takeUntil(this.$destroy))
      .subscribe((reset) => {
        if (reset) {
          this.loadObligationsData();
        }
      });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  loadObligationsData(): void {
    const {
      workpackData,
      workpackParams,
      filters,
      obligations,
      term,
      idFilterSelected,
      loading,
    } = this.obligationsSrv.getObligationsData();

    this.workpackData = workpackData;
    this.workpackParams = workpackParams;
    this.filters = filters;
    this.obligations = obligations;
    this.idFilterSelected = idFilterSelected;
    this.term = term;

    this.sectionActive =
      !!this.workpackData?.workpack?.id &&
      !!this.workpackData?.workpackModel &&
      !!this.workpackData.workpackModel.obligationsSessionActive;

    if (!loading) {
      this.loadObligationsSection();
    }
  }

  getObligations(): void {
    this.obligationsSrv.loadObligations({
      idFilterSelected: this.idFilterSelected,
      term: this.term,
    });
  }

  handleCreateNewObligation(): void {
    this.router.navigate(['/workpack/obligations'], {
      queryParams: {
        idWorkpack: this.workpackParams.idWorkpack,
      },
    });
  }

  async deleteObligation(obligation: IObligation): Promise<void> {
    const result = await this.obligationsSrv.delete(obligation, {
      useConfirm: true,
    });

    if (result.success) {
      this.sectionObligations.cardItemsSection = Array.from(
        this.sectionObligations.cardItemsSection.filter(
          (item) => item.itemId !== obligation.id
        )
      );

      this.obligationsSrv.deleteObligationFromData(obligation.id);

      this.totalRecordsObligations =
        this.sectionObligations.cardItemsSection?.length || 0;
    }
  }

  handleSelectedFilterObligation(event): void {
    this.idFilterSelected = event.filter;
    this.getObligations();
  }

  handleSearchText(event): void {
    this.term = event.term;
    this.getObligations();
  }

  async loadObligationsSection(): Promise<void> {
    if (!this.sectionActive) {
      return;
    }

    this.sectionObligations = {
      ...this.sectionObligations,
      cardSection: {
        ...this.sectionObligations.cardSection,
        filters: this.filters?.length ? this.filters : [],
        showCreateNemElementButton: this.workpackSrv.getEditPermission(),
        idFilterSelected: this.idFilterSelected,
        searchTerm: this.term,
        isLoading: false,
      },
      cardItemsSection: await this.loadSectionObligationsCards(),
    };

    this.totalRecordsObligations =
      this.sectionObligations.cardItemsSection?.length || 0;
  }

  async loadSectionObligationsCards() {
    if (this.obligations?.length) {
      const cardItems = this.obligations.map((obligation) => ({
        typeCardItem: 'listItemObligation',

        icon: 'file-invoice-dollar',

        iconSvg: false,

        nameCardItem: truncateText(obligation.description?.toUpperCase()),

        fullNameCardItem: obligation.description?.toUpperCase(),

        subtitleCardItem: obligation.obligationNumber,

        itemId: obligation.id,

        idAtributeName: 'idObligation',

        menuItems: [
          {
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: () => this.deleteObligation(obligation),
            disabled: !this.workpackSrv.getEditPermission(),
          },
        ] as MenuItem[],

        urlCard: '/workpack/obligations',

        paramsUrlCard: [
          {
            name: 'idWorkpack',
            value: this.workpackParams.idWorkpack,
          },
          {
            name: 'id',
            value: obligation.id,
          },
        ],
      }));

      if (
        this.workpackSrv.getEditPermission() &&
        !this.workpackData.workpack.canceled
      ) {
        cardItems.push(this.createNewObligationCard());
      }

      return cardItems;
    }

    if (
      this.workpackSrv.getEditPermission() &&
      !this.workpackData.workpack.canceled
    ) {
      return [this.createNewObligationCard()];
    }

    return [];
  }

  private createNewObligationCard(): any {
    return {
      typeCardItem: 'newCardItem',
      icon: IconsEnum.Plus,
      iconSvg: true,
      nameCardItem: null,
      subtitleCardItem: null,
      organizationName: null,
      itemId: null,
      idAtributeName: 'idObligation',
      menuItems: null,
      urlCard: '/workpack/obligations',
      paramsUrlCard: [
        {
          name: 'idWorkpack',
          value: this.workpackParams.idWorkpack,
        },
      ],
    };
  }

  async handleEditFilterEntity(event, entityName: string): Promise<void> {
    const idFilter = event.filter;

    if (!idFilter) {
      return;
    }

    const filterProperties = this.loadFilterPropertiesList(entityName);

    this.filterSrv.setFilterProperties(filterProperties);

    await this.workpackBreadcrumbStorageSrv.setBreadcrumbStorage();

    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        idFilter,
        entityName,
        idWorkpackModel: this.workpackData.workpackModel.id,
        idOffice: this.workpackParams.idOffice,
      },
    });
  }

  async handleNewFilterEntity(entityName: string): Promise<void> {
    await this.workpackBreadcrumbStorageSrv.setBreadcrumbStorage();

    const filterProperties = this.loadFilterPropertiesList(entityName);

    this.filterSrv.setFilterProperties(filterProperties);

    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName,
        idWorkpackModel: this.workpackData.workpackModel.id,
        idOffice: this.workpackParams.idOffice,
      },
    });
  }

  loadFilterPropertiesList(entityName: string): IFilterProperty[] {
    const listProperties = FilterDataviewPropertiesEntity[entityName] || [];

    return listProperties.map((prop) => ({
      type: prop.type,
      label: prop.label,
      name: prop.apiValue,
      active: true,
      possibleValues: prop.possibleValues,
    }));
  }
}
