import { IWorkpackData, IWorkpackParams } from '../../../../shared/interfaces/IWorkpackDataParams';
import { IFilterProperty } from '../../../../shared/interfaces/IFilterProperty';
import { FilterDataviewPropertiesEntity } from '../../../../shared/constants/filterDataviewPropertiesEntity';
import { IconsEnum } from '../../../../shared/enums/IconsEnum';
import { StakeholderService } from '../../../../shared/services/stakeholder.service';
import { IStakeholder } from '../../../../shared/interfaces/IStakeholder';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ResponsiveService } from '../../../../shared/services/responsive.service';
import { WorkpackBreadcrumbStorageService } from '../../../../shared/services/workpack-breadcrumb-storage.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { TranslateService } from '@ngx-translate/core';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { Router } from '@angular/router';
import { FilterDataviewService } from '../../../../shared/services/filter-dataview.service';
import { ISection } from '../../../../shared/interfaces/ISectionWorkpack';
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import * as moment from 'moment';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';

@Component({
  selector: 'app-workpack-section-stakeholders',
  templateUrl: './workpack-section-stakeholders.component.html',
  styleUrls: ['./workpack-section-stakeholders.component.scss']
})
export class WorkpackSectionStakeholdersComponent implements OnInit, OnDestroy {

  sectionStakeholder: ISection;
  stakeholders: IStakeholder[];
  stakeholderSectionShowInactives = false;
  totalRecordsStakeholders: number;
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
  activeSection = false;

  constructor(
    private filterSrv: FilterDataviewService,
    private router: Router,
    private workpackSrv: WorkpackService,
    private translateSrv: TranslateService,
    private configDataViewSrv: ConfigDataViewService,
    private workpackBreadcrumbStorageSrv: WorkpackBreadcrumbStorageService,
    private stakeholderSrv: StakeholderService,
    private responsiveSrv: ResponsiveService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService,
  ) {
    
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(responsive => this.responsive = responsive);
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.sectionStakeholder = this.sectionStakeholder && Object.assign({}, {
        ...this.sectionStakeholder,
        cardSection: {
          ...this.sectionStakeholder.cardSection,
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
    this.sectionStakeholder = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: this.showTabview ? '' : 'stakeholdersAndPermissions',
        collapseble: this.showTabview ? false : true,
        initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus,
        showFilters: true,
        isLoading: true,
        filters: this.filters,
        showCreateNemElementButton: this.workpackSrv.getEditPermission() ? true : false,
        createNewElementMenuItems: [
          {
            label: this.translateSrv.instant('person'),
            icon: 'fas fa-user-circle',
            command: (event) => this.navigateToPageStakeholder('person')
          },
          {
            label: this.translateSrv.instant('organization'),
            icon: 'fas fa-building',
            command: (event) => this.navigateToPageStakeholder('organization')
          }
        ]
      }
    };
    this.stakeholderSrv.observableResetStakeholder.pipe(takeUntil(this.$destroy)).subscribe(reset => {
      if (reset) {
        this.loadStakeholdersData();
      }
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

  loadStakeholdersData() {
    const {
      workpackData,
      workpackParams,
      filters,
      stakeholders,
      term,
      idFilterSelected,
      loading
    } = this.stakeholderSrv.getStakeholdersData();
    this.workpackData = workpackData;
    this.workpackParams = workpackParams;
    this.filters = filters;
    this.stakeholders = stakeholders;
    this.idFilterSelected = idFilterSelected;
    this.term = term;
    this.activeSection = this.workpackData && this.workpackData?.workpack?.id && this.workpackData?.workpackModel
      && this.workpackData.workpackModel.stakeholderSessionActive;
    if (!loading) this.loadStakeholderSection();
  }

  async loadStakeholderSection() {
    if (!this.activeSection) return;
    this.sectionStakeholder = {
      ...this.sectionStakeholder,
      cardSection: {
        ...this.sectionStakeholder.cardSection,
        isLoading: false,
        filters: this.filters,
        idFilterSelected: this.idFilterSelected,
        searchTerm: this.term,
        showCreateNemElementButton: this.workpackSrv.getEditPermission() ? true : false,
      },
      cardItemsSection: await this.loadSectionStakeholderCards(this.stakeholderSectionShowInactives)
    }
    this.totalRecordsStakeholders = this.sectionStakeholder.cardItemsSection && this.sectionStakeholder.cardItemsSection.length;
  }

  async loadSectionStakeholderCards(showInactives: boolean) {
    if (this.stakeholders && this.stakeholders.length > 0) {
      const cardItems = this.stakeholders.filter(stake => {
        if (!showInactives && stake.roles && stake.roles.length > 0) {
          return stake.roles.find(r => r.active && (!r.to || r.to === null || moment(r.to, 'yyyy-MM-DD').isSameOrAfter(moment()))
            && (!r.from || r.from === null || moment(r.from, 'yyyy-MM-DD').isSameOrBefore(moment())));
        } else { return stake; }
      }).map(stakeholder => {
        const editPermission = stakeholder.permissions && stakeholder.permissions.filter(p => p.level === 'EDIT').length > 0;
        const readPermission = stakeholder.permissions && stakeholder.permissions.filter(p => p.level === 'READ').length > 0;
        const samePlan = (!stakeholder.permissions || stakeholder.permissions.length === 0) ||
          (stakeholder.permissions && stakeholder.permissions.filter(p => p.idPlan === this.workpackParams.idPlan).length > 0);
        return {
          typeCardItem: 'listItemStakeholder',
          icon: stakeholder.person ? (editPermission ? IconsEnum.UserEdit :
            (readPermission ? IconsEnum.UserRead : IconsEnum.UserCircle)) : IconsEnum.Building,
          iconSvg: true,
          nameCardItem: stakeholder.person ? stakeholder.person.name : stakeholder.organization.name,
          fullNameCardItem: stakeholder.person ? stakeholder.person.fullName : stakeholder.organization.fullName,
          subtitleCardItem: stakeholder.roles && stakeholder.roles.filter(r => r.active && (!r.to || r.to === null ||
            moment(r.to, 'yyyy-MM-DD').isSameOrAfter(moment()))
            && (!r.from || r.from === null || moment(r.from, 'yyyy-MM-DD').isSameOrBefore(moment())))
            .map(role => this.translateSrv.instant(role.role)).join(', '),
          itemId: stakeholder.person ? stakeholder.person.id : stakeholder.organization.id,
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            disabled: !samePlan || !this.workpackSrv.getEditPermission(),
            command: (event) => this.deleteStakeholder(stakeholder)
          }],
          urlCard: !!samePlan ? (stakeholder.person ? '/stakeholder/person' : '/stakeholder/organization') : undefined,
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
            { name: 'idPlan', value: this.workpackParams.idPlan },
            { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked },
            {
              name: stakeholder.person ? 'idPerson' : 'idOrganization',
              value: stakeholder.person ? stakeholder.person.id : stakeholder.organization.id
            }
          ],
          iconMenuItems: null
        };
      });
      if (this.workpackSrv.getEditPermission() && !this.workpackData.workpack.canceled) {
        cardItems.push({
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconSvg: true,
          nameCardItem: null,
          fullNameCardItem: null,
          subtitleCardItem: null,
          itemId: null,
          menuItems: null,
          urlCard: null,
          paramsUrlCard: null,
          iconMenuItems: [
            {
              label: this.translateSrv.instant('person'),
              icon: 'fas fa-user-circle',
              command: (event) => this.navigateToPageStakeholder('person')
            },
            {
              label: this.translateSrv.instant('organization'),
              icon: 'fas fa-building',
              command: (event) => this.navigateToPageStakeholder('organization')
            }
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
        urlCard: null,
        iconMenuItems: [
          {
            label: this.translateSrv.instant('person'),
            icon: 'fas fa-user-circle',
            command: (event) => this.navigateToPageStakeholder('person')
          },
          {
            label: this.translateSrv.instant('organization'),
            icon: 'fas fa-building',
            command: (event) => this.navigateToPageStakeholder('organization')
          }
        ]
      }] : [];
      return cardItem;
    }
  }

  async handleSelectedFilterStakeholder(event) {
    this.idFilterSelected = event.filter;
    this.stakeholderSrv.loadStakeholders({idFilterSelected: this.idFilterSelected, term: this.term});
  }

  async handleSearchText(event) {
    this.term = event.term;
    this.stakeholderSrv.loadStakeholders({idFilterSelected: this.idFilterSelected, term: this.term});
  }

  async deleteStakeholder(stakeholder: IStakeholder) {
    if (stakeholder.person) {
      const result = await this.stakeholderSrv.deleteStakeholderPerson({
        'id-workpack': stakeholder.idWorkpack,
        'id-person': stakeholder.person.id,
        'id-plan': this.workpackParams.idPlan
      }, { useConfirm: true });
      if (result.success) {
        const stakeholderIndex = this.sectionStakeholder.cardItemsSection.findIndex(stake => stake.itemId === stakeholder.person.id);
        if (stakeholderIndex > -1) {
          this.sectionStakeholder.cardItemsSection.splice(stakeholderIndex, 1);
          this.sectionStakeholder.cardItemsSection = Array.from(this.sectionStakeholder.cardItemsSection);
          this.stakeholderSrv.deleteStakeholderFromData(stakeholder);
        }
      }
    } else {
      const result = await this.stakeholderSrv.deleteStakeholderOrganization({
        'id-workpack': stakeholder.idWorkpack,
        'id-organization': stakeholder.organization.id
      }, { useConfirm: true });
      if (result.success) {
        const stakeholderIndex = this.sectionStakeholder.cardItemsSection.findIndex(stake => stake.itemId === stakeholder.organization.id);
        if (stakeholderIndex > -1) {
          this.sectionStakeholder.cardItemsSection.splice(stakeholderIndex, 1);
          this.sectionStakeholder.cardItemsSection = Array.from(this.sectionStakeholder.cardItemsSection);
          this.stakeholderSrv.deleteStakeholderFromData(stakeholder);
          this.totalRecordsStakeholders = this.sectionStakeholder.cardItemsSection.length;
        }
      }
    }
  }

  async handleStakeholderInactiveToggle() {
    this.sectionStakeholder.cardItemsSection = await this.loadSectionStakeholderCards(this.stakeholderSectionShowInactives);
  }

  navigateToPageStakeholder(url) {
    this.router.navigate(
      [`stakeholder/${url}`],
      {
        queryParams: {
          idWorkpack: this.workpackParams.idWorkpack,
          idPlan: this.workpackParams.idPlan,
          idWorkpackModelLinked: this.workpackParams.idWorkpackModelLinked
        }
      }
    );
  }

  async handleEditFilterEntity(event, entityName: string) {
    const idFilter = event.filter;
    if (idFilter) {
      const filterProperties = this.loadFilterPropertiesList(entityName);
      this.filterSrv.setFilterProperties(filterProperties);
      await this.workpackBreadcrumbStorageSrv.setBreadcrumbStorage();
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName,
          idWorkpackModel: this.workpackData.workpack.model.id,
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
        idWorkpackModel: this.workpackData.workpack.model.id,
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
      if (prop.label === 'role' && entityName === 'stakeholders') {
        property.possibleValues = this.workpackData.workpackModel.personRoles && this.workpackData.workpackModel.personRoles.map(role => ({
          label: role,
          value: role
        }));
        property.possibleValues = this.workpackData.workpackModel.organizationRoles &&
          [...property.possibleValues, ...this.workpackData.workpackModel.organizationRoles
            .filter(r => !property.possibleValues.find(pv => pv.label === r))
            .map(role => ({
              label: role,
              value: role
            }))];
      }
      return property;
    });
    return filterPropertiesList;
  }

}
