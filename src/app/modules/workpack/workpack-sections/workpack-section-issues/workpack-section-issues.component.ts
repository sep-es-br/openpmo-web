import { IFilterProperty } from '../../../../shared/interfaces/IFilterProperty';
import { FilterDataviewPropertiesEntity } from '../../../../shared/constants/filterDataviewPropertiesEntity';
import { IconsEnum } from '../../../../shared/enums/IconsEnum';
import { MenuItem } from 'primeng/api';
import { IssuesPropertiesOptions } from '../../../../shared/constants/issuesPropertiesOptions';
import { IssueService } from '../../../../shared/services/issue.service';
import { IIssue } from '../../../../shared/interfaces/IIssue';
import { ISection } from '../../../../shared/interfaces/ISectionWorkpack';
import { takeUntil } from 'rxjs/operators';
import { ResponsiveService } from '../../../../shared/services/responsive.service';
import { WorkpackBreadcrumbStorageService } from '../../../../shared/services/workpack-breadcrumb-storage.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { TranslateService } from '@ngx-translate/core';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { Router } from '@angular/router';
import { FilterDataviewService } from '../../../../shared/services/filter-dataview.service';
import { Subject } from 'rxjs';
import { IWorkpackData, IWorkpackParams } from '../../../../shared/interfaces/IWorkpackDataParams';
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';

@Component({
  selector: 'app-workpack-section-issues',
  templateUrl: './workpack-section-issues.component.html',
  styleUrls: ['./workpack-section-issues.component.scss']
})
export class WorkpackSectionIssuesComponent implements OnInit, OnDestroy {

  issueSectionShowClosed = false;
  sectionIssue: ISection;
  totalRecordsIssues: number;
  issues: IIssue[];
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

  constructor(
    private filterSrv: FilterDataviewService,
    private router: Router,
    private workpackSrv: WorkpackService,
    private translateSrv: TranslateService,
    private configDataViewSrv: ConfigDataViewService,
    private workpackBreadcrumbStorageSrv: WorkpackBreadcrumbStorageService,
    private responsiveSrv: ResponsiveService,
    private issueSrv: IssueService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService
  ) {
    
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(responsive => this.responsive = responsive);
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.sectionIssue = this.sectionIssue && Object.assign({}, {
        ...this.sectionIssue,
        cardSection: {
          ...this.sectionIssue.cardSection,
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
    this.sectionIssue = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: !this.showTabview ? 'issues' : '',
        collapseble: this.showTabview ? false : true,
        initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus,
        showFilters: true,
        isLoading: true,
        filters: this.filters && this.filters.length > 0 ? this.filters : [],
        showCreateNemElementButton: this.workpackSrv.getEditPermission() ? true : false,
      }
    };
    this.issueSrv.observableResetIssue.pipe(takeUntil(this.$destroy)).subscribe(reset => {
      if (reset) {
        this.loadIssueData();
      }
    });

  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }


  loadIssueData() {
    const {
      workpackData,
      workpackParams,
      filters,
      term,
      issues,
      idFilterSelected,
      loading
    } = this.issueSrv.getIssuesData();
    this.workpackData = workpackData;
    this.workpackParams = workpackParams;
    this.filters = filters;
    this.issues = issues;
    this.idFilterSelected = idFilterSelected;
    this.term = term;
    if (!loading) this.loadIssueSection();
  }

  async getIssues() {
    this.issueSrv.loadIssues({idFilterSelected: this.idFilterSelected, term: this.term})
  }

  async loadIssueSection() {
    this.sectionIssue = {
      ...this.sectionIssue,
      cardSection: {
        ...this.sectionIssue.cardSection,
        isLoading: false,
        filters: this.filters && this.filters.length > 0 ? this.filters : [],
        idFilterSelected: this.idFilterSelected,
        searchTerm: this.term,
        showCreateNemElementButton: this.workpackSrv.getEditPermission() ? true : false,
      },
      cardItemsSection: await this.loadSectionIssuesCards(this.issueSectionShowClosed)
    }
    this.totalRecordsIssues = this.sectionIssue.cardItemsSection && this.sectionIssue.cardItemsSection.length;
  }

  async loadSectionIssuesCards(showClosed: boolean) {
    if (this.issues && this.issues.length > 0) {
      const cardItems = !showClosed ? this.issues.filter(r => IssuesPropertiesOptions.status[r.status].value === 'OPEN').map(issue => ({
        typeCardItem: 'listItem',
        icon: 'Issue',
        iconColor: IssuesPropertiesOptions.importance[issue.importance].label,
        iconSvg: true,
        nameCardItem: issue.name,
        itemId: issue.id,
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteIssue(issue),
          disabled: !this.workpackSrv.getEditPermission()
        }] as MenuItem[],
        urlCard: '/workpack/issues',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
          { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked },
          { name: 'id', value: issue.id },
        ]
      })) :
        this.issues.map(issue => ({
          typeCardItem: 'listItem',
          icon: 'Issue',
          iconColor: IssuesPropertiesOptions.importance[issue.importance].label,
          iconSvg: true,
          nameCardItem: issue.name,
          itemId: issue.id,
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteIssue(issue),
            disabled: !this.workpackSrv.getEditPermission()
          }] as MenuItem[],
          urlCard: '/workpack/issues',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked },
            { name: 'id', value: issue.id },
          ]
        }));
      if (this.workpackSrv.getEditPermission() && !this.workpackData.workpack.canceled) {
        cardItems.push({
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconColor: null,
          iconSvg: true,
          nameCardItem: null,
          itemId: null,
          menuItems: null,
          urlCard: '/workpack/issues',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked },
          ]
        });
      }
      return cardItems;
    } else {
      const cardItem = this.workpackSrv.getEditPermission() && !this.workpackData.workpack.canceled ? [{
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        iconSvg: true,
        nameCardItem: null,
        itemId: null,
        menuItems: null,
        urlCard: '/workpack/issues',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
          { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked },
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
        possibleValues: prop.possibleValues && prop.possibleValues.map( option => ({
          ...option,
          label: this.translateSrv.instant(option.label)
        }))
      };
      return property;
    });
    return filterPropertiesList;
  }

  handleCreateNewIssue() {
    this.router.navigate(['/workpack/issues'], {
      queryParams: {
        idWorkpack: this.workpackParams.idWorkpack,
        edit: this.workpackSrv.getEditPermission(),
      }
    });
  }

  async deleteIssue(issue: IIssue) {
    const result = await this.issueSrv.delete(issue, { useConfirm: true });
    if (result.success) {
      this.sectionIssue.cardItemsSection = Array.from(this.sectionIssue.cardItemsSection.filter(i => i.itemId !== issue.id));
      this.issueSrv.deleteIssueFromData(issue.id);
    }
  }

  async handleIssueShowClosedToggle() {
    this.sectionIssue.cardItemsSection = await this.loadSectionIssuesCards(this.issueSectionShowClosed);
  }

  async handleSelectedFilterIssue(event) {
    this.idFilterSelected = event.filter;
    await this.getIssues();
  }

  async handleSearchText(event) {
    this.term = event.term;
    await this.getIssues();
  }

}
