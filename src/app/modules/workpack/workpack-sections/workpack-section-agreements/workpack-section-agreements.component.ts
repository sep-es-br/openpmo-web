import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IAgreements } from 'src/app/shared/interfaces/IAgreements';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { ISection } from 'src/app/shared/interfaces/ISectionWorkpack';
import {
  IWorkpackData,
  IWorkpackParams,
} from 'src/app/shared/interfaces/IWorkpackDataParams';
import { AgreementsService } from 'src/app/shared/services/agreements.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { FilterDataviewService } from 'src/app/shared/services/filter-dataview.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackBreadcrumbStorageService } from 'src/app/shared/services/workpack-breadcrumb-storage.service';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';

@Component({
  selector: 'app-workpack-section-agreements',
  templateUrl: './workpack-section-agreements.component.html',
  styleUrls: ['./workpack-section-agreements.component.scss'],
})
export class WorkpackSectionAgreementsComponent
  implements OnInit, OnDestroy
{
  totalRecordsAgreements: number;

  Agreements: IAgreements[];

  sectionAgreements: ISection;

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
    private AgreementsSrv: AgreementsService,
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

        this.sectionAgreements = this.sectionAgreements && {
          ...this.sectionAgreements,
          cardSection: {
            ...this.sectionAgreements.cardSection,
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

      this.sectionAgreements = {
        cardSection: {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: this.showTabview ? '' : 'agreements',
          collapseble: !this.showTabview,
          initialStateCollapse: this.showTabview
            ? false
            : this.collapsePanelsStatus,
          showFilters: true,
          isLoading: true,
          filters: this.filters?.length ? this.filters : [],
          showCreateNemElementButton: this.workpackSrv.getEditPermission(),

          createNewElementMenuItems: [
            {
              label: this.translateSrv.instant('contract'),
              icon: 'fas fa-file-contract',
              command: () => this.handleCreateNewContract()
            },
            {
              label: this.translateSrv.instant('cooperation'),
              icon: 'fas fa-handshake',
              command: () => this.handleCreateNewCooperation()
            }
          ]
        }
      };

    this.AgreementsSrv.observableResetAgreements
      .pipe(takeUntil(this.$destroy))
      .subscribe((reset) => {
        if (reset) {
          this.loadAgreementsData();
        }
      });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  loadAgreementsData(): void {
    const {
      workpackData,
      workpackParams,
      filters,
      Agreements,
      term,
      idFilterSelected,
      loading,
    } = this.AgreementsSrv.getAgreementsData();

    this.workpackData = workpackData;
    this.workpackParams = workpackParams;
    this.filters = filters;
    this.Agreements = Agreements;
    this.idFilterSelected = idFilterSelected;
    this.term = term;

    this.sectionActive =
      !!this.workpackData?.workpack?.id &&
      !!this.workpackData?.workpackModel &&
      !!this.workpackData.workpackModel.agreementsSessionActive;

    if (!loading) {
      this.loadAgreementsSection();
    }
  }

  getAgreements(): void {
    this.AgreementsSrv.loadAgreements({
      idFilterSelected: this.idFilterSelected,
      term: this.term,
    });
  }

  handleCreateNewContract(): void {
    this.router.navigate(
      ['/workpack/contracts'],
      {
        queryParams: {
          idWorkpack: this.workpackParams.idWorkpack
        }
      }
    );
  }

  handleCreateNewCooperation(): void {
    this.router.navigate(
      ['/workpack/cooperations'],
      {
        queryParams: {
          idWorkpack: this.workpackParams.idWorkpack
        }
      }
    );
  }

  async deleteAgreements(
    Agreements: IAgreements
  ): Promise<void> {
    const result = await this.AgreementsSrv.delete(
      Agreements,
      {
        useConfirm: true,
      }
    );

    if (result.success) {
      this.sectionAgreements.cardItemsSection = Array.from(
        this.sectionAgreements.cardItemsSection.filter(
          (item) => item.itemId !== Agreements.id
        )
      );

      this.AgreementsSrv.deleteAgreementsFromData(
        Agreements.id
      );

      this.totalRecordsAgreements =
        this.sectionAgreements.cardItemsSection?.length || 0;
    }
  }

  handleSelectedFilterAgreements(event): void {
    this.idFilterSelected = event.filter;
    this.getAgreements();
  }

  handleSearchText(event): void {
    this.term = event.term;
    this.getAgreements();
  }

  async loadAgreementsSection(): Promise<void> {
    if (!this.sectionActive) {
      return;
    }

    this.sectionAgreements = {
      ...this.sectionAgreements,
      cardSection: {
        ...this.sectionAgreements.cardSection,
        filters: this.filters?.length ? this.filters : [],
        showCreateNemElementButton: this.workpackSrv.getEditPermission(),
        idFilterSelected: this.idFilterSelected,
        searchTerm: this.term,
        isLoading: false,
      },
      cardItemsSection: await this.loadSectionAgreementsCards(),
    };

    this.totalRecordsAgreements =
      this.sectionAgreements.cardItemsSection?.length || 0;
  }

  async loadSectionAgreementsCards() {
    if (this.Agreements?.length) {
      const cardItems = this.Agreements.map((Agreements) => ({
        typeCardItem: 'listItemAgreements',

        icon: 'file-contract',

        iconSvg: false,

        subtitleCardItem: Agreements.object,

        organizationName: Agreements.organizationName,

        itemId: Agreements.id,

        idAtributeName: 'idAgreements',

        menuItems: [
          {
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: () => this.deleteAgreements(Agreements),
            disabled: !this.workpackSrv.getEditPermission(),
          },
        ] as MenuItem[],

        urlCard: '/workpack/agreements',

        paramsUrlCard: [
          {
            name: 'idWorkpack',
            value: this.workpackParams.idWorkpack,
          },
          {
            name: 'id',
            value: Agreements.id,
          },
        ],
      }));

      if (
        this.workpackSrv.getEditPermission() &&
        !this.workpackData.workpack.canceled
      ) {
        cardItems.push(this.createNewAgreementsCard());
      }

      return cardItems;
    }

    if (
      this.workpackSrv.getEditPermission() &&
      !this.workpackData.workpack.canceled
    ) {
      return [this.createNewAgreementsCard()];
    }

    return [];
  }

  private createNewAgreementsCard(): any {
    return {
      typeCardItem: 'newCardItem',
      icon: IconsEnum.Plus,
      iconSvg: true,

      iconMenuItems: [
        {
          label: this.translateSrv.instant('contract'),
          icon: 'fas fa-file-contract',
          command: () => this.handleCreateNewContract()
        },
        {
          label: this.translateSrv.instant('cooperation'),
          icon: 'fas fa-handshake',
          command: () => this.handleCreateNewCooperation()
        }
      ]
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
