import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICommitment } from 'src/app/shared/interfaces/ICommitment';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { ISection } from 'src/app/shared/interfaces/ISectionWorkpack';
import {
  IWorkpackData,
  IWorkpackParams,
} from 'src/app/shared/interfaces/IWorkpackDataParams';
import { CommitmentsService } from 'src/app/shared/services/commitments.service';

import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { FilterDataviewService } from 'src/app/shared/services/filter-dataview.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackBreadcrumbStorageService } from 'src/app/shared/services/workpack-breadcrumb-storage.service';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';

@Component({
  selector: 'app-workpack-section-commitments',
  templateUrl: './workpack-section-commitments.component.html',
  styleUrls: ['./workpack-section-commitments.component.scss'],
})
export class WorkpackSectionCommitmentsComponent implements OnInit, OnDestroy {
  totalRecordsCommitments: number;

  commitments: ICommitment[];

  sectionCommitments: ISection;

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
    private commitmentsSrv: CommitmentsService,
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

        this.sectionCommitments = this.sectionCommitments && {
          ...this.sectionCommitments,
          cardSection: {
            ...this.sectionCommitments.cardSection,
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

    this.sectionCommitments = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: this.showTabview ? '' : 'commitments',
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

    this.commitmentsSrv.observableResetCommitments
      .pipe(takeUntil(this.$destroy))
      .subscribe((reset) => {
        if (reset) {
          this.loadCommitmentsData();
        }
      });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  loadCommitmentsData(): void {
    const {
      workpackData,
      workpackParams,
      filters,
      commitments,
      term,
      idFilterSelected,
      loading,
    } = this.commitmentsSrv.getCommitmentsData();

    this.workpackData = workpackData;
    this.workpackParams = workpackParams;
    this.filters = filters;
    this.commitments = commitments;
    this.idFilterSelected = idFilterSelected;
    this.term = term;

    this.sectionActive =
      !!this.workpackData?.workpack?.id &&
      !!this.workpackData?.workpackModel &&
      !!this.workpackData.workpackModel.commitmentsSessionActive;

    if (!loading) {
      this.loadCommitmentsSection();
    }
  }

  getCommitments(): void {
    this.commitmentsSrv.loadCommitments({
      idFilterSelected: this.idFilterSelected,
      term: this.term,
    });
  }

  handleCreateNewCommitment(): void {
    this.router.navigate(['/workpack/commitments'], {
      queryParams: {
        idWorkpack: this.workpackParams.idWorkpack,
      },
    });
  }

  async deleteCommitment(commitment: ICommitment): Promise<void> {
    const result = await this.commitmentsSrv.delete(commitment, {
      useConfirm: true,
    });

    if (result.success) {
      this.sectionCommitments.cardItemsSection = Array.from(
        this.sectionCommitments.cardItemsSection.filter(
          (item) => item.itemId !== commitment.id
        )
      );

      this.commitmentsSrv.deleteCommitmentFromData(commitment.id);

      this.totalRecordsCommitments =
        this.sectionCommitments.cardItemsSection?.length || 0;
    }
  }

  handleSelectedFilterCommitment(event): void {
    this.idFilterSelected = event.filter;
    this.getCommitments();
  }

  handleSearchText(event): void {
    this.term = event.term;
    this.getCommitments();
  }

  async loadCommitmentsSection(): Promise<void> {
    if (!this.sectionActive) {
      return;
    }

    this.sectionCommitments = {
      ...this.sectionCommitments,
      cardSection: {
        ...this.sectionCommitments.cardSection,
        filters: this.filters?.length ? this.filters : [],
        showCreateNemElementButton: this.workpackSrv.getEditPermission(),
        idFilterSelected: this.idFilterSelected,
        searchTerm: this.term,
        isLoading: false,
      },
      cardItemsSection: await this.loadSectionCommitmentsCards(),
    };

    this.totalRecordsCommitments =
      this.sectionCommitments.cardItemsSection?.length || 0;
  }

  async loadSectionCommitmentsCards() {
    if (this.commitments?.length) {
      const cardItems = this.commitments.map((commitment) => ({
        typeCardItem: 'listItemCommitment',

        icon: 'file-invoice-dollar',

        iconSvg: false,

        nameCardItem: commitment.commitmentNumber,

        subtitleCardItem: commitment.description,

        organizationName: commitment.managementUnitName,

        itemId: commitment.id,

        idAtributeName: 'idCommitment',

        menuItems: [
          {
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: () => this.deleteCommitment(commitment),
            disabled: !this.workpackSrv.getEditPermission(),
          },
        ] as MenuItem[],

        urlCard: '/workpack/commitments',

        paramsUrlCard: [
          {
            name: 'idWorkpack',
            value: this.workpackParams.idWorkpack,
          },
          {
            name: 'id',
            value: commitment.id,
          },
        ],
      }));

      if (
        this.workpackSrv.getEditPermission() &&
        !this.workpackData.workpack.canceled
      ) {
        cardItems.push(this.createNewCommitmentCard());
      }

      return cardItems;
    }

    if (
      this.workpackSrv.getEditPermission() &&
      !this.workpackData.workpack.canceled
    ) {
      return [this.createNewCommitmentCard()];
    }

    return [];
  }

  private createNewCommitmentCard(): any {
    return {
      typeCardItem: 'newCardItem',
      icon: IconsEnum.Plus,
      iconSvg: true,
      nameCardItem: null,
      subtitleCardItem: null,
      organizationName: null,
      itemId: null,
      idAtributeName: 'idCommitment',
      menuItems: null,
      urlCard: '/workpack/commitments',
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
