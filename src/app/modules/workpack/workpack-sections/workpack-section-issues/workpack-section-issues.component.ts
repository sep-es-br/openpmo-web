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
import { Component, OnInit, OnDestroy } from '@angular/core';
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
    this.workpackSrv.observableResetWorkpack.pipe(takeUntil(this.$destroy)).subscribe(reset => {
      if (reset) {
        this.workpackData = this.workpackSrv.getWorkpackData();
        this.workpackParams = this.workpackSrv.getWorkpackParams();
        if (this.workpackData && this.workpackData?.workpack?.id && this.workpackData?.workpackModel &&
          this.workpackData.workpackModel.riskAndIssueManagementSessionActive) {
          if (!this.workpackParams.idWorkpackModelLinked || (this.workpackSrv.getEditPermission() && !!this.workpackParams.idWorkpackModelLinked)) {
            this.loadIssueSection();
          }
        }
      }
    });
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

  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

  async loadIssueSection() {
    const resultFiltersIssues = await this.filterSrv.getAllFilters(`workpackModels/${this.workpackData.workpack.model.id}/issues`);
    const filtersIssues = resultFiltersIssues.success && Array.isArray(resultFiltersIssues.data) ? resultFiltersIssues.data : [];
    const idFilterIssueSelected = filtersIssues.find(defaultFilter => !!defaultFilter.favorite) ?
      filtersIssues.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
    this.sectionIssue = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: !this.showTabview ? 'issues' : '',
        collapseble: this.showTabview ? false : true,
        initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus,
        showFilters: true,
        isLoading: true,
        filters: filtersIssues && filtersIssues.length > 0 ? filtersIssues : [],
        showCreateNemElementButton: this.workpackSrv.getEditPermission() ? true : false,
      }
    };
    this.sectionIssue = {
      ...this.sectionIssue,
      cardSection: {
        ...this.sectionIssue.cardSection,
        isLoading: false,
      },
      cardItemsSection: await this.loadSectionIssuesCards(this.issueSectionShowClosed, idFilterIssueSelected)
    }
    this.totalRecordsIssues = this.sectionIssue.cardItemsSection && this.sectionIssue.cardItemsSection.length;
  }

  async loadSectionIssuesCards(showClosed: boolean, idFilterIssueSelected?: number) {
    const resultIssues = await this.issueSrv.GetAll({ 'id-workpack': this.workpackParams.idWorkpack, idFilter: idFilterIssueSelected });
    this.issues = resultIssues.success ? resultIssues.data : [];
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
    }
  }

  async handleIssueShowClosedToggle() {
    this.sectionIssue.cardItemsSection = await this.loadSectionIssuesCards(this.issueSectionShowClosed);
  }

  async handleSelectedFilterIssue(event) {
    const idFilter = event.filter;
    this.sectionIssue = Object.assign({}, {
      ...this.sectionIssue,
      cardItemsSection: await this.loadSectionIssuesCards(this.issueSectionShowClosed, idFilter)
    });
    this.totalRecordsIssues = this.sectionIssue.cardItemsSection && this.sectionIssue.cardItemsSection.length;
  }

}
