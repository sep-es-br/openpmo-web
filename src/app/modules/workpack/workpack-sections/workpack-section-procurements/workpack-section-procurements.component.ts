import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { IProcurement } from 'src/app/shared/interfaces/IProcurement';
import { ISection } from 'src/app/shared/interfaces/ISectionWorkpack';
import {
  IWorkpackData,
  IWorkpackParams,
} from 'src/app/shared/interfaces/IWorkpackDataParams';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { FilterDataviewService } from 'src/app/shared/services/filter-dataview.service';
import { ProcurementsService } from 'src/app/shared/services/procurements.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackBreadcrumbStorageService } from 'src/app/shared/services/workpack-breadcrumb-storage.service';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { truncateText } from 'src/app/shared/utils/truncateText';

@Component({
  selector: 'app-workpack-section-procurements',
  templateUrl: './workpack-section-procurements.component.html',
  styleUrls: ['./workpack-section-procurements.component.scss'],
})
export class WorkpackSectionProcurementsComponent implements OnInit, OnDestroy {
  totalRecordsProcurements: number;

  procurements: IProcurement[];

  sectionProcurements: ISection;

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
    private procurementsSrv: ProcurementsService,
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

        this.sectionProcurements = this.sectionProcurements && {
          ...this.sectionProcurements,
          cardSection: {
            ...this.sectionProcurements.cardSection,
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

    this.sectionProcurements = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: this.showTabview ? '' : 'procurements',
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

    this.procurementsSrv.observableResetProcurements
      .pipe(takeUntil(this.$destroy))
      .subscribe((reset) => {
        if (reset) {
          this.loadProcurementsData();
        }
      });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  loadProcurementsData(): void {
    const {
      workpackData,
      workpackParams,
      filters,
      procurements,
      term,
      idFilterSelected,
      loading,
    } = this.procurementsSrv.getProcurementsData();

    this.workpackData = workpackData;
    this.workpackParams = workpackParams;
    this.filters = filters;
    this.procurements = procurements;
    this.idFilterSelected = idFilterSelected;
    this.term = term;

    this.sectionActive =
      !!this.workpackData?.workpack?.id &&
      !!this.workpackData?.workpackModel &&
      !!this.workpackData.workpackModel.procurementsSessionActive;

    if (!loading) {
      this.loadProcurementsSection();
    }
  }

  getProcurements(): void {
    this.procurementsSrv.loadProcurements({
      idFilterSelected: this.idFilterSelected,
      term: this.term,
    });
  }

  handleCreateNewProcurement(): void {
    this.router.navigate(['/workpack/procurements'], {
      queryParams: {
        idWorkpack: this.workpackParams.idWorkpack,
      },
    });
  }

  async deleteProcurement(procurement: IProcurement): Promise<void> {
    const result = await this.procurementsSrv.delete(procurement, {
      useConfirm: true,
    });

    if (result.success) {
      this.sectionProcurements.cardItemsSection = Array.from(
        this.sectionProcurements.cardItemsSection.filter(
          (item) => item.itemId !== procurement.id
        )
      );

      this.procurementsSrv.deleteProcurementFromData(procurement.id);

      this.totalRecordsProcurements =
        this.sectionProcurements.cardItemsSection?.length || 0;
    }
  }

  handleSelectedFilterProcurement(event): void {
    this.idFilterSelected = event.filter;
    this.getProcurements();
  }

  handleSearchText(event): void {
    this.term = event.term;
    this.getProcurements();
  }

  async loadProcurementsSection(): Promise<void> {
    if (!this.sectionActive) {
      return;
    }

    this.sectionProcurements = {
      ...this.sectionProcurements,
      cardSection: {
        ...this.sectionProcurements.cardSection,
        filters: this.filters?.length ? this.filters : [],
        showCreateNemElementButton: this.workpackSrv.getEditPermission(),
        idFilterSelected: this.idFilterSelected,
        searchTerm: this.term,
        isLoading: false,
      },
      cardItemsSection: await this.loadSectionProcurementsCards(),
    };

    this.totalRecordsProcurements =
      this.sectionProcurements.cardItemsSection?.length || 0;
  }

  async loadSectionProcurementsCards() {
    if (this.procurements?.length) {
      const cardItems = this.procurements.map((procurement) => ({
        typeCardItem: 'listItemProcurement',

        icon: 'assets/svg/bid.svg',

        iconSvg: true,

        nameCardItem: truncateText(procurement.object?.toUpperCase()),

        fullNameCardItem: procurement.object?.toUpperCase(),

        subtitleCardItem: procurement.processId,

        itemId: procurement.id,

        idAtributeName: 'idProcurement',

        menuItems: [
          {
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: () => this.deleteProcurement(procurement),
            disabled: !this.workpackSrv.getEditPermission(),
          },
        ] as MenuItem[],

        urlCard: '/workpack/procurements',

        paramsUrlCard: [
          {
            name: 'idWorkpack',
            value: this.workpackParams.idWorkpack,
          },
          {
            name: 'id',
            value: procurement.id,
          },
        ],
      }));

      if (
        this.workpackSrv.getEditPermission() &&
        !this.workpackData.workpack.canceled
      ) {
        cardItems.push(this.createNewProcurementCard());
      }

      return cardItems;
    }

    if (
      this.workpackSrv.getEditPermission() &&
      !this.workpackData.workpack.canceled
    ) {
      return [this.createNewProcurementCard()];
    }

    return [];
  }

  private createNewProcurementCard(): any {
    return {
      typeCardItem: 'newCardItem',
      icon: IconsEnum.Plus,
      iconSvg: true,
      nameCardItem: null,
      subtitleCardItem: null,
      organizationName: null,
      itemId: null,
      idAtributeName: 'idProcurement',
      menuItems: null,
      urlCard: '/workpack/procurements',
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
