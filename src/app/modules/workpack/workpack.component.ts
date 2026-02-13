import { SaveButtonService } from './../../shared/services/save-button.service';
import { WorkpackBreadcrumbStorageService } from './../../shared/services/workpack-breadcrumb-storage.service';
import { ISectionWorkpacks } from './../../shared/interfaces/ISectionWorkpack';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { MilestoneStatusEnum } from './../../shared/enums/MilestoneStatusEnum';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { finalize, takeUntil } from 'rxjs/operators';
import { IWorkpackCardItem } from './../../shared/interfaces/IWorkpackCardItem';
import { BaselineService } from './../../shared/services/baseline.service';
import { ProcessService } from './../../shared/services/process.service';
import { IndicatorService } from './../../shared/services/indicator.service';
import { IssueService } from './../../shared/services/issue.service';
import { RiskService } from './../../shared/services/risk.service';
import { TypePropertyModelEnum } from './../../shared/enums/TypePropertyModelEnum';
import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { FilterDataviewService } from 'src/app/shared/services/filter-dataview.service';
import { Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService, LazyLoadEvent, MenuItem, MessageService, SelectItem } from 'primeng/api';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackModelService } from 'src/app/shared/services/workpack-model.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IWorkpack, IWorkpackListCard } from 'src/app/shared/interfaces/IWorkpack';
import { IWorkpackModel } from 'src/app/shared/interfaces/IWorkpackModel';
import { IWorkpackProperty } from 'src/app/shared/interfaces/IWorkpackProperty';
import { StakeholderService } from 'src/app/shared/services/stakeholder.service';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IOrganization } from 'src/app/shared/interfaces/IOrganization';
import { IMeasureUnit } from 'src/app/shared/interfaces/IMeasureUnit';
import { PlanService } from 'src/app/shared/services/plan.service';
import { TypeWorkpackEnum } from 'src/app/shared/enums/TypeWorkpackEnum';
import { MeasureUnitService } from 'src/app/shared/services/measure-unit.service';
import { ScheduleService } from 'src/app/shared/services/schedule.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { MenuService } from 'src/app/shared/services/menu.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { ITabViewScrolled } from 'src/app/shared/components/tabview-scrolled/tabview-scrolled.component';
import { CostAccountService } from 'src/app/shared/services/cost-account.service';
import { JournalService } from 'src/app/shared/services/journal.service';
import { WorkpackPropertyService } from 'src/app/shared/services/workpack-property.service';
import { BreakdownStructureService } from 'src/app/shared/services/breakdown-structure.service';
import { PersonService } from 'src/app/shared/services/person.service';
import { IBreadcrumb } from 'src/app/shared/interfaces/IBreadcrumb';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { Location } from '@angular/common';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';
import { TypeWorkpackModelEnum } from 'src/app/shared/enums/TypeWorkpackModelEnum';
import { SetConfigWorkpackService } from 'src/app/shared/services/set-config-workpack.service';
import { PageDef, SearchService } from 'src/app/shared/services/search.service';
import { IUniversalSearch } from 'src/app/shared/interfaces/universal-search.interface';

@Component({
  selector: 'app-workpack',
  templateUrl: './workpack.component.html',
  styleUrls: ['./workpack.component.scss']
})
export class WorkpackComponent implements OnDestroy {
  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

  @ViewChild('searchBar') searchBarRef: ElementRef<HTMLDivElement>;

  responsive: boolean;

  idPlan: number;

  propertiesPlan: IPlan;

  idOffice: number;

  idOfficeOwnerWorkpackLinked: number;

  propertiesOffice: IOffice;

  idWorkpackModel: number;

  idWorkpack: number;

  idWorkpackParent: number;

  idWorkpackModelLinked: number;

  workpackModel: IWorkpackModel;

  typePropertyModel = TypePropertyModelEnum;

  workpack: IWorkpack;

  workpackProperties: IWorkpackProperty[];

  sectionWorkpackModelChildren: boolean;

  organizationsOffice: IOrganization[];

  unitMeasuresOffice: IMeasureUnit[];

  cardsWorkPackModelChildren: ISectionWorkpacks[];

  isUserAdmin: boolean;

  collapsePanelsStatus = true;

  displayModeAll = 'grid';

  pageSize = 5;

  totalRecordsWorkpacks: number[] = [];

  showDialogEndManagement = false;

  showDialogResumeManagement = false;

  endManagementWorkpack: {
    idWorkpackModel?: number;
    idWorkpack: number;
    reason: string;
    endManagementDate: Date;
  };

  calendarFormat = '';

  $destroy = new Subject();

  language: string;

  fullScreenModeDashboard = false;

  changedStatusCompleted = false;

  endManagementResumePermission = false;

  showTabview = false;

  hasWBS = false;

  selectedTab: ITabViewScrolled;

  tabs: ITabViewScrolled[];

  isLoading = false;

  favoriteProcessing = false;

  currentBreadcrumbItems: IBreadcrumb[];

  workpackLoading = true;

  formIsSaving = false;

  workpackChildChanging = false;

  linkEvent = false;

  showAnimationSearch = false;

  searchTerm;

  page = 0;

  result: IUniversalSearch[];

  totalCountResults: number;

  isSearching = false;

  constructor(
    private actRouter: ActivatedRoute,
    private workpackModelSrv: WorkpackModelService,
    public workpackSrv: WorkpackService,
    private responsiveSrv: ResponsiveService,
    public translateSrv: TranslateService,
    private unitMeasureSrv: MeasureUnitService,
    public stakeholderSrv: StakeholderService,
    private planSrv: PlanService,
    public scheduleSrv: ScheduleService,
    private router: Router,
    private officeSrv: OfficeService,
    private authSrv: AuthService,
    private messageSrv: MessageService,
    private menuSrv: MenuService,
    public filterSrv: FilterDataviewService,
    public riskSrv: RiskService,
    public issueSrv: IssueService,
    public processSrv: ProcessService,
    public indicatorSrv: IndicatorService,
    public baselineSrv: BaselineService,
    private confirmationSrv: ConfirmationService,
    private dashboardSrv: DashboardService,
    private saveButtonSrv: SaveButtonService,
    private workpackBreadcrumbStorageSrv: WorkpackBreadcrumbStorageService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService,
    private configDataViewSrv: ConfigDataViewService,
    private costAccountSrv: CostAccountService,
    private journalSrv: JournalService,
    private propertySrv: WorkpackPropertyService,
    private breakdownStructureSrv: BreakdownStructureService,
    private personSrv: PersonService,
    private breadcrumbSrv: BreadcrumbService,
    private location: Location,
    private setConfigWorkpackSrv: SetConfigWorkpackService,
    private searchSrv: SearchService,
    private thisElemRef: ElementRef<HTMLElement>
  ) {
    this.actRouter.queryParams.subscribe(({ id }) => {
        this.idWorkpack = id && +id;
    });
    this.actRouter.queryParams.subscribe(async({
      id,
      idPlan,
      idWorkpackModel,
      idWorkpackParent,
      idWorkpackModelLinked,
      linkEvent
    }) => {
      this.idWorkpack = id && +id;
      this.idPlan = idPlan && +idPlan;
      this.idWorkpackModel = idWorkpackModel && +idWorkpackModel;
      this.idWorkpackParent = idWorkpackParent && +idWorkpackParent;
      this.idWorkpackModelLinked = idWorkpackModelLinked && +idWorkpackModelLinked;
      this.linkEvent = linkEvent;
      this.workpackSrv.setWorkpackParams({
        idWorkpack: id && +id,
        idPlan: idPlan && +idPlan,
        idWorkpackModel: idWorkpackModel && +idWorkpackModel,
        idWorkpackParent: idWorkpackParent && +idWorkpackParent,
        idWorkpackModelLinked: idWorkpackModelLinked && +idWorkpackModelLinked,
      });
      this.selectedTab = null;
      await this.resetWorkpack();
    });
    this.breadcrumbSrv.ready.pipe(takeUntil(this.$destroy)).subscribe(data => {
      this.workpackBreadcrumbStorageSrv.setBreadcrumb();
    });
    this.menuSrv.getRemovedFavorites.pipe(takeUntil(this.$destroy)).subscribe((idRemoved) => {
      if (+this.idWorkpack === +idRemoved) {
        this.workpack.favoritedBy = !this.workpack.favoritedBy;
      }
    });
    this.dashboardSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.fullScreenModeDashboard = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.language = this.translateSrv.currentLang, 200);
    }
    );
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.workpackSrv.observableLoadingWorkpack.pipe(takeUntil(this.$destroy)).subscribe(value => this.workpackLoading = value);
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
      const panelStatus = this.configDataViewSrv.getPanelStatus();
      this.collapsePanelsStatus = this.showTabview ? false : (panelStatus === 'collapse' ? true : false);
      this.handleChangeShowTabview();
      this.handleChangeCollapseExpandPanel();
    });
    this.saveButtonSrv.observableShowSaveButton.pipe(takeUntil(this.$destroy)).subscribe(showButton => {
      if (showButton && this.saveButton) {
        this.saveButton.showButton();
        this.workpackSrv.nextPendingChanges(true);
      } else {
        if (this.saveButton) {
          this.saveButton.hideButton();
          this.workpackSrv.nextPendingChanges(false);
        }
      }
    });
    this.saveButtonSrv.observableShowCancelButton.pipe(takeUntil(this.$destroy)).subscribe(showButton => {
      if (showButton && this.cancelButton) {
        this.cancelButton.showButton();
      } else {
        if (this.cancelButton) {
          this.cancelButton.hideButton();
        }
      }
    });
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = this.showTabview ? false : (collapsePanelStatus === 'collapse' ? true : false);
      this.handleChangeCollapseExpandPanel();
    });
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.handlePageChange({first: 0, rows: pageSize});
      this.pageSize = pageSize;
    });
    this.workpackSrv.observableCheckCompletedChanged.pipe(takeUntil(this.$destroy)).subscribe(checkCompleted => {
      if (this.workpack) {
        this.changedStatusCompleted = true;
        this.workpack.completed = checkCompleted;
      }
      this.handleCloseSearching();
    });

  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  @HostListener('window:click', ['$event'])
  handleClick(evt: MouseEvent) {
    if(!this.searchBarRef) return;
    const path = evt.composedPath();
    const clickedInside = path.includes(this.searchBarRef.nativeElement);

    if (!clickedInside && (!this.isSearching || !path.includes(this.thisElemRef.nativeElement))) {
      this.handleCloseSearching();
    }
  }

  openSearch() {
    this.showAnimationSearch = true;
    (this.searchBarRef.nativeElement.querySelector('.app-input-text') as HTMLInputElement).focus();
  }

  setWorkWorkpack() {
    this.personSrv.setPersonWorkLocal({
      idOffice: this.idOffice,
      idPlan: this.idPlan,
      idWorkpack: this.idWorkpack ? this.idWorkpack : null,
      idWorkpackModelLinked: this.idWorkpackModelLinked ? this.idWorkpackModelLinked : null
    });
  }

  handleCloseSearching() {
    this.isSearching = false;
    this.searchTerm = undefined;
    this.page = 0;
    this.showAnimationSearch = false;
  }

  handlePageChange(evt: LazyLoadEvent) {

    const pageData: PageDef = {
        page: evt.first / evt.rows,
        pageSize: evt.rows
    };

    if (
        this.page !== pageData.page ||
        this.pageSize !== pageData.pageSize
    ) {
        this.page = pageData.page;
        this.workpackLoading = true;
        this.searchSrv.doSimpleSearch(this.searchTerm, this.idWorkpack, pageData)
            .pipe(finalize(() => this.workpackLoading = false))
            .subscribe(_result => {
                if(_result?.success) {
                    this.result = _result.data.data;
                    this.totalCountResults = _result.data.totalRecords;
                } else {
                    this.handleCloseSearching();
                }
            });
    }
  }

  handleChangeCollapseExpandPanel() {
    this.cardsWorkPackModelChildren = this.cardsWorkPackModelChildren && this.cardsWorkPackModelChildren.map(card => (
      Object.assign({}, {
        ...card,
        cardSection: {
          ...card.cardSection,
          collapseble: this.showTabview ? false : true,
          initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus
        }
      })
    ));
  }

  handleChangeShowTabview() {
    this.cardsWorkPackModelChildren = this.cardsWorkPackModelChildren && this.cardsWorkPackModelChildren.map(card => (
      Object.assign({}, {
        ...card,
        cardSection: {
          ...card.cardSection,
          notShowCardTitle: this.showTabview ? true : false
        }
      })
    ));
  }

  handleChangePageSize(event) {
    this.pageSize = event.pageSize;
  }

  async resetWorkpack() {
    this.handleCloseSearching();
    this.workpackSrv.nextPendingChanges(false);
    if (this.saveButton) {
      this.saveButton.hideButton();
    }
    if (this.cancelButton) {
      this.cancelButton.hideButton();
    }
    this.isLoading = true;
    this.hasWBS = false;
    this.workpackModel = undefined;
    this.workpack = undefined;
    this.workpackProperties = [];
    this.sectionWorkpackModelChildren = undefined;
    this.cardsWorkPackModelChildren = [];
    this.changedStatusCompleted = false;
    this.workpackSrv.setEditPermission(false);
    this.workpackSrv.setUnitMeansure(undefined);
    this.workpackSrv.setWorkpackData(undefined, true);
    if(!this.isLoading) await this.resetWorkpackSections();
    await this.loadWorkpackData();
    this.workpackBreadcrumbStorageSrv.setBreadcrumb(this.linkEvent);
    this.calendarFormat = this.translateSrv.instant('dateFormat');
  }

  async resetWorkpackSections() {
    this.propertySrv.resetPropertiesData();
    this.breakdownStructureSrv.resetBreakdownStructureData();
    this.dashboardSrv.resetDashboardData();
    this.costAccountSrv.resetCostAccountsData();
    this.stakeholderSrv.resetStakeholdersData();
    this.riskSrv.resetRisksData();
    this.issueSrv.resetIssuesData();
    this.baselineSrv.resetBaselinesData();
    this.processSrv.resetProcessesData();
    this.journalSrv.resetJournalData();
    this.scheduleSrv.resetScheduleData();
  }

  async loadWorkpackData() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    if (this.isUserAdmin || !this.idWorkpack) {
      this.workpackSrv.setEditPermission(true);
    }
    const params = this.workpackSrv.getWorkpackParams();
    const planProperties = await this.planSrv.getCurrentPlan(this.idPlan);
    this.workpackSrv.setWorkpackParams({
      ...params,
      idPlan: this.idPlan,
      idOffice: planProperties.idOffice
    });
    if (this.idWorkpack) {
      if (!this.idWorkpackModelLinked) {
        await this.loadWorkpack();
      } else {
        await this.loadWorkpackLinked();
      }
    } else {
      await this.loadWorkpackModel(this.idWorkpackModel);
    }
    this.propertySrv.loadProperties();
    if(! this.dashboardSrv.referenceMonth) this.dashboardSrv.calculateReferenceMonth();
    await this.propertySrv.loadProperties();
    const linked = this.idWorkpackModelLinked ? true : false;
    this.dashboardSrv.loadDashboard(linked);
    this.costAccountSrv.loadCostAccounts();
    this.stakeholderSrv.loadStakeholders();
    this.riskSrv.loadRisks();
    this.issueSrv.loadIssues();
    this.baselineSrv.loadBaselines();
    this.processSrv.loadProcesses();
    this.indicatorSrv.loadIndicators();
    this.journalSrv.loadJournal();
    // this.journalSrv.loadScope();
    this.scheduleSrv.loadSchedule();
    this.workpackSrv.nextResetWorkpack(true);
    if (this.idWorkpack && this.workpackModel) {
      await this.loadSectionsWorkpackModel();
    }
  }

  async handleFavorite() {
    if (!this.workpack || !this.idPlan) {
      return;
    }
    this.favoriteProcessing = true;

    const { success } = await this.workpackSrv.patchToggleWorkpackFavorite(this.idWorkpack, this.idPlan);
    if (success) {
      this.favoriteProcessing = false;
      this.workpack.favoritedBy = !this.workpack.favoritedBy;
      this.menuSrv.reloadMenuFavorite();
    }
  }

  async loadWorkpack(reloadOnlyProperties = false) {
    this.workpackSrv.nextLoadingWorkpack(true);
    const result = await this.workpackSrv.GetWorkpackDataById(this.idWorkpack, { 'id-plan': this.idPlan});
    if (result.success && result.data) {
      this.workpack = result.data;
      this.setUnitMeansure();
      if (this.workpack && this.workpack.canceled) {
        this.workpackSrv.setEditPermission(false);
      } else if (!this.isUserAdmin && this.workpack) {
        await this.loadUserPermission();
      }

      if (reloadOnlyProperties) {
        const workpackData = this.workpackSrv.getWorkpackData();
        this.workpackSrv.setWorkpackData({
          ...workpackData,
          workpack: this.workpack
        });
        this.propertySrv.loadProperties();
      }
      if (!reloadOnlyProperties) {
        this.workpackSrv.setWorkpackData({ workpack: this.workpack });
        await this.loadWorkpackModel(this.workpack.idWorkpackModel);
      } else {
        this.workpackSrv.nextLoadingWorkpack(false);
      }
    } else {
      this.workpackSrv.nextLoadingWorkpack(false);
      this.router.navigate(['/plan'], {
        queryParams: {
          id: this.idPlan,
          idOffice: this.idOffice
        }
      });
      return;
    }
  }

  getEditPermission() {
    return this.workpackSrv.getEditPermission();
  }

  async setUnitMeansure() {
    const unitMeasureWorkpack = this.workpack.type === TypeWorkpackEnum.DeliverableModel &&  this.workpack.properties &&
    this.workpack.properties.find(prop => prop.type && prop.type === this.typePropertyModel.UnitSelectionModel);
    if (unitMeasureWorkpack && unitMeasureWorkpack?.selectedValue) {
      const unitMeasure = await this.unitMeasureSrv.GetById(unitMeasureWorkpack?.selectedValue as number);
      if (unitMeasure.success) {
        this.workpackSrv.setUnitMeansure(unitMeasure.data);
      }
    }
  }

  async loadWorkpackLinked(reloadOnlyProperties = false) {
    this.workpackSrv.nextLoadingWorkpack(true);
    const result = await this.workpackSrv.GetWorkpackLinked(this.idWorkpack,
      { 'id-workpack-model': this.idWorkpackModelLinked, 'id-plan': this.idPlan});
    if (result.success && result.data) {
      this.workpack = result.data;
      this.setUnitMeansure();
      const workpackParams = this.workpackSrv.getWorkpackParams();
      workpackParams.idOfficeOwnerWorkpackLinked = this.workpack.planOrigin.idOffice;
      this.workpackSrv.setWorkpackParams({ ...workpackParams });
      if (!this.isUserAdmin && this.workpack) {
        const editPermission = !!this.workpack.permissions?.find(p => p.level === 'EDIT');
        this.workpackSrv.setEditPermission(editPermission);
        const permission = this.workpack.permissions.find(p => p.level);
        this.workpackSrv.setPermissionLevel(permission?.level);
      }
      if (reloadOnlyProperties) {
        const workpackData = this.workpackSrv.getWorkpackData();
        this.workpackSrv.setWorkpackData({
          ...workpackData,
          workpack: this.workpack
        });
        this.workpackSrv.nextReloadProperties(true);
      }
      if (!reloadOnlyProperties) {
        this.workpackSrv.setWorkpackData({ workpack: this.workpack });
        await this.loadWorkpackModel(this.workpack.modelLinked.id);
      } else {
        this.workpackSrv.nextLoadingWorkpack(false);
      }
    } else {
      this.router.navigate(['/plan'], {
        queryParams: {
          id: this.idPlan
        }
      });
      return;
    }
  }

  async loadUserPermission() {
    let editPermission = !!this.workpack.permissions?.find(p => p.level === 'EDIT');
    const permission = this.workpack.permissions.find(p => p.level);
    this.workpackSrv.setPermissionLevel(permission?.level);
    if (this.workpack.endManagementDate !== null) {
      if (this.workpackSrv.getEditPermission()) {
        this.endManagementResumePermission = true;
      }
      editPermission = false;
    }
    this.workpackSrv.setEditPermission(editPermission);
  }

  async loadWorkpackModel(idWorkpackModel) {
    this.workpackSrv.nextLoadingWorkpack(true);
    const result = await this.workpackModelSrv.GetById(idWorkpackModel);
    if (result.success) {
      this.workpackModel = result.data;
      const workpackData = this.workpackSrv.getWorkpackData();
      this.workpackSrv.setWorkpackData({
        ...workpackData,
        workpackModel: this.workpackModel
      });
    }
    if (this.showTabview) {
      if (this.idWorkpack) {
        await this.checkWorkpackHasEap();
      }
      this.loadWorkpackTabs();
    } else {
      this.isLoading = false;
    }
    const workpackParams = this.workpackSrv.getWorkpackParams();
    setTimeout(() => { this.workpackSrv.nextLoadingWorkpack(false); }, 300);
    this.propertiesPlan = await this.planSrv.getCurrentPlan(workpackParams.idPlan);
    if (this.propertiesPlan.id) {this.planSrv.nextIDPlan(this.propertiesPlan.id);}
    if (this.propertiesPlan) {
      this.propertiesOffice = await this.officeSrv.getCurrentOffice(this.propertiesPlan.idOffice);
      this.idOffice = this.propertiesOffice.id;
      this.workpackSrv.setWorkpackParams({
        ...workpackParams,
        propertiesPlan: this.propertiesPlan,
        idOffice: this.propertiesPlan.idOffice,
        propertiesOffice: this.propertiesOffice
      });
      this.officeSrv.nextIDOffice(this.propertiesPlan.idOffice);
      this.setWorkWorkpack();
    }
  }

  async checkWorkpackHasEap() {
    this.isLoading = true;
    this.hasWBS = (!!this.isUserAdmin || (!!this.workpack.permissions
      && this.workpack.permissions.filter( p => p.level !== 'BASIC_READ').length > 0)) && this.workpack.hasChildren;
    this.workpack.hasWBS = this.hasWBS;
    if (this.hasWBS) {
      this.breakdownStructureSrv.loadBreakdownStructure(true, this.idWorkpack);
    }
    const workpackData = this.workpackSrv.getWorkpackData();
    this.workpackSrv.setWorkpackData({
      ...workpackData,
      workpack: this.workpack
    });
  }

  async loadSectionsWorkpackModel() {
    if (this.workpackModel.journalManagementSessionActive) {

    }
    if (this.workpackModel.childWorkpackModelSessionActive && this.workpackModel?.children) {
      this.sectionWorkpackModelChildren = true;
      if (!this.idWorkpackModelLinked) {
        await this.loadSectionsWorkpackChildren();
      } else {
        await this.loadSectionsWorkpackChildrenLinked();
      }
    }
  }

  async loadSectionsWorkpackChildren() {
    this.cardsWorkPackModelChildren = this.workpackModel?.children ? this.workpackModel?.children?.map(workpackModel => {
      const propertiesCard: ICard = {
        toggleable: false,
        initialStateToggle: false,
        notShowCardTitle: this.showTabview ? true : false,
        cardTitle: workpackModel.modelNameInPlural,
        tabTitle: workpackModel.modelNameInPlural,
        collapseble: this.showTabview ? false : true,
        initialStateCollapse: this.collapsePanelsStatus,
        showFilters: true,
        hideTextFilter: true,
        showCreateNemElementButtonWorkpack: this.workpackSrv.getEditPermission() ? true : false,
        createNewElementMenuItemsWorkpack: [],
        filters: []
      };
      return {
        idWorkpackModel: workpackModel.id,
        cardSection: propertiesCard,
        workpackShowCancelleds: this.workpack && this.workpack.canceled ? true : false
      };
    }) : [];
    if (this.workpackModel?.children && this.cardsWorkPackModelChildren && this.cardsWorkPackModelChildren.length > 0) {
      this.workpackModel?.children?.forEach(async(workpackModel, index) => {
        if (this.cardsWorkPackModelChildren[index].cardSection) {
          this.cardsWorkPackModelChildren[index].cardSection.isLoading = true;
          const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${workpackModel.id}/workpacks`);
          if (resultFilters.success && resultFilters.data) {
            this.cardsWorkPackModelChildren[index].cardSection.filters = resultFilters.data;
          }
          const idFilterSelected = resultFilters.data.find(defaultFilter => !!defaultFilter.favorite) ?
            resultFilters.data.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
          const resultItemsList =
            await this.loadWorkpacksFromWorkpackModel(this.workpack.plan.id, workpackModel.id, idFilterSelected, '', false);
          if (!this.cardsWorkPackModelChildren[index]?.cardSection?.createNewElementMenuItemsWorkpack) {
            return;
          }
          this.cardsWorkPackModelChildren[index].cardSection.showCreateNemElementButtonWorkpack = this.workpackSrv.getEditPermission();
          this.cardsWorkPackModelChildren[index].cardSection.onNewItem =
            () => this.loadNewItemMenu(this.workpack.plan.id, workpackModel.id);
          this.cardsWorkPackModelChildren[index].cardItemsSection = resultItemsList && resultItemsList.workpackItemCardList;
          this.cardsWorkPackModelChildren[index].cardSection.isLoading = false;
        }
      });
    }
    if (this.cardsWorkPackModelChildren) {
      this.cardsWorkPackModelChildren.forEach((workpackModel, i) => {
        this.totalRecordsWorkpacks[i] = workpackModel.cardItemsSection ? workpackModel.cardItemsSection.length + 1 : 1;
      });
    }

  }

  getShowStakeHolderSection() {
    return this.idWorkpack && this.workpackModel && this.workpackModel.stakeholderSessionActive &&
      !this.idWorkpackModelLinked || (this.workpackSrv.getEditPermission()
      && !!this.idWorkpackModelLinked && this.workpackModel.stakeholderSessionActive);
  }

  getShowBaselineSection() {
    return this.idWorkpack && this.workpack && this.workpack.type === TypeWorkpackEnum.ProjectModel;
  }

  async loadWorkpacksFromWorkpackModel(
    idPlan: number,
    idWorkpackModel: number,
    idFilterSelected: number,
    term,
    showCancelled?: boolean,
    idWorkpackModelLinked?: number) {
    const result = await this.workpackSrv.GetWorkpacksByParent({
      'id-plan': idPlan,
      'id-workpack-model': idWorkpackModel,
      'id-workpack-parent': this.idWorkpack,
      workpackLinked: idWorkpackModelLinked ? true : false,
      idFilter: idFilterSelected,
      term: term ? term : ''
    });
    let workpacks = result.success && result.data;
    if (!showCancelled && workpacks && !this.workpack?.canceled) {
      workpacks = workpacks.filter(wp => wp.type === 'Milestone' && !wp.deleted && !wp.canceled);
    }
    if (workpacks && workpacks.length > 0) {
      const workpackItemCardList: IWorkpackCardItem[] = workpacks.map(workpack => {
        const propertyNameWorkpack = workpack.name;
        const propertyFullnameWorkpack = workpack.fullName;
        const menuItems: MenuItem[] = [];
        workpack.idPlan = idPlan;
        workpack.idWorkpackModel = idWorkpackModel;
        workpack.idParent = this.idWorkpack;
        if (((workpack.canceled || workpack.deleted) && workpack.type !== 'Project' && workpack.type !== 'Deliverable')) {
          menuItems.push({
            label: this.translateSrv.instant('restore'),
            icon: 'fas fa-redo-alt',
            command: (event) => this.handleRestoreWorkpack(workpack.id),
          });
        } else {
          if (
            workpack.type !== 'Project' &&
            !!workpack.canDeleted &&
            !workpack.canceled &&
            !workpack.linked &&
            !(workpack.type === 'Deliverable' && workpack.hasActiveBaseline)
          ) {
            menuItems.push({
              label: this.translateSrv.instant('delete'),
              icon: 'fas fa-trash-alt',
              command: (event) => this.deleteWorkpackChildren(workpack),
              disabled: !this.workpackSrv.getEditPermission()
            });
          }
          if (!workpack.canceled && workpack.type === 'Deliverable' &&
            (!workpack.endManagementDate || workpack.endManagementDate === null)) {
            menuItems.push({
              label: this.translateSrv.instant('endManagement'),
              icon: 'far fa-stop-circle',
              command: (event) => this.endManagementOfDeliverable(workpack, idWorkpackModel),
              disabled: !this.workpackSrv.getEditPermission()
            });
          }
          if (!workpack.canceled && workpack.type === 'Deliverable' &&
            (!!workpack.endManagementDate && workpack.endManagementDate !== null)) {
            menuItems.push({
              label: this.translateSrv.instant('resumeManagement'),
              icon: 'far fa-play-circle',
              command: (event) => this.resumeManagementOfDeliverable(workpack, idWorkpackModel),
              disabled: !this.endManagementResumePermission && !this.workpackSrv.getEditPermission()
            });
          }
          if (workpack.cancelable && this.workpackSrv.getEditPermission() && !workpack.linked) {
            // menuItems.push({
            //   label: this.translateSrv.instant('cancel'),
            //   icon: 'fas fa-times',
            //   command: (event) => this.handleCancelWorkpack(workpack.id),
            // });
          }
          if (workpack.type === 'Project' && this.workpackSrv.getEditPermission()) {
            menuItems.push({
              label: this.translateSrv.instant('changeControlBoard'),
              icon: 'app-icon ccb-member',
              command: async(event) =>  await this.navigateToConfigCCB(workpack.id),
            });
            if (!workpack.pendingBaseline && !workpack.cancelPropose && !!workpack.hasActiveBaseline && !workpack.linked) {
              menuItems.push({
                label: this.translateSrv.instant('cancel'),
                icon: 'fas fa-times',
                command: (event) => this.navigateToCancelProject(workpack.id, propertyNameWorkpack as string),
              });
            }
            if (!workpack.pendingBaseline && !workpack.cancelPropose && !workpack.hasActiveBaseline && !workpack.linked) {
              menuItems.push({
                label: this.translateSrv.instant('delete'),
                icon: 'fas fa-trash-alt',
                command: (event) => this.deleteWorkpackChildren(workpack),
                disabled: !this.workpackSrv.getEditPermission()
              });
            }
          }
          if (
            this.workpackSrv.getEditPermission() &&
            !workpack.canceled &&
            !workpack.linked &&
            workpack.type === TypeWorkpackEnum.ProjectModel
          ) {
            menuItems.push({
              label: this.translateSrv.instant('cut'),
              icon: 'fas fa-cut',
              command: (event) => this.handleCutWorkpack(workpack),
            });
          }
          if (
            workpack.type !== TypeWorkpackEnum.DeliverableModel &&
            !workpack.canceled &&
            workpack.idWorkpackModel === idWorkpackModel &&
            this.workpackSrv.getEditPermission() &&
            !idWorkpackModelLinked && !workpack.linked
          ) {
            menuItems.push({
              label: this.translateSrv.instant('sharing'),
              icon: 'app-icon share',
              command: (event) => this.handleSharing(workpack.id),
            });
          }
          if (!!workpack.linked) {
            menuItems.push({
              label: this.translateSrv.instant('unlink'),
              icon: 'app-icon unlink',
              command: (event) => this.unlinkedWorkpack(workpack.id, idWorkpackModel),
            });
          }
        }
        let actualInformation;
        if (workpack.journalInformation) {
          const today = moment();
          const informationDate = moment(workpack.journalInformation.date, 'yyyy-MM-DD');
          const diff = today.diff(informationDate, 'days');
          actualInformation = diff <= 30;
        }
        return {
          typeCardItem: workpack.type,
          icon: workpack.fontIcon,
          iconSvg: false,
          nameCardItem: propertyNameWorkpack,
          fullNameCardItem: propertyFullnameWorkpack,
          itemId: workpack.id,
          menuItems,
          urlCard: '/workpack',
          paramsUrlCard: workpack.idWorkpackModel !== idWorkpackModel || !!workpack.linked ? [
            { name: 'idWorkpackModelLinked', value: idWorkpackModel },
            { name: 'idPlan', value: this.idPlan }
          ] : (idWorkpackModelLinked ?
            [
              { name: 'idWorkpackModelLinked', value: idWorkpackModelLinked },
              { name: 'idPlan', value: this.idPlan }
            ] : [
              { name: 'idPlan', value: this.idPlan },
            ]),
          linked: !!idWorkpackModelLinked ? true : (!!workpack.linked ? true : false),
          shared: workpack.sharedWith,
          canceled: workpack.type === 'Milestone' && workpack.deleted || workpack.canceled,
          completed: workpack.completed,
          endManagementDate: workpack.endManagementDate,
          dashboardData: this.loadDashboardData(workpack.dashboard, workpack.milestone, workpack.risk),
          hasBaseline: workpack.hasActiveBaseline,
          baselineName: workpack.activeBaselineName,
          subtitleCardItem: workpack.type === 'Milestone' ? (workpack.date ? workpack.date.split('T')[0] : null) : '',
          statusItem: workpack.type === 'Milestone' ? MilestoneStatusEnum[workpack.milestoneStatus] : '',
          editPermission: workpack.completed && workpack.type === 'Milestone' ? false : this.getEditPermission(),
          journalInformation: {
            ...workpack?.journalInformation,
            actual: actualInformation
          },
          statusProperty: workpack?.statusProperty || undefined,
        };
      });
      if (this.workpackSrv.getEditPermission() && !idWorkpackModelLinked) {
        workpackItemCardList.push(
          {
            typeCardItem: 'newCardItem',
            icon: IconsEnum.Plus,
            iconSvg: true,
            onNewItem: () => this.loadNewItemMenu(idPlan, idWorkpackModel)
          }
        );
      }
      const resultItemsList = { workpackItemCardList };
      return resultItemsList;
    }
    if ((!workpacks || workpacks.length === 0) && this.workpackSrv.getEditPermission() && !idWorkpackModelLinked) {
      const workpackItemCardList = [
        {
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconSvg: true,
          onNewItem: () => this.loadNewItemMenu(idPlan, idWorkpackModel)
        }
      ];
      const resultItemsList = { workpackItemCardList };
      return resultItemsList;
    }
  }

  async loadNewItemMenu(idPlan, idWorkpackModel) {
    const sharedWorkpackList = await this.loadSharedWorkpackList(idWorkpackModel, idPlan);
    const iconMenuItems: MenuItem[] = [
      {
        label: this.translateSrv.instant('new'),
        command: () => this.handleNewWorkpack(idPlan, idWorkpackModel, this.idWorkpack)
      }
    ];
    if (sharedWorkpackList && sharedWorkpackList.length > 0) {
      iconMenuItems.push({
        label: this.translateSrv.instant('linkTo'),
        items: sharedWorkpackList.map(wp => ({
          label: wp.name,
          icon: `app-icon ${wp.icon}`,
          command: () => this.handleLinkToWorkpack(wp.id, idWorkpackModel)
        }))
      });
    }
    const workpackCuted = this.workpackSrv.getWorkpackCuted();
    if (workpackCuted) {
      const { canPaste, incompatiblesProperties } = await this.checkPasteWorkpack(workpackCuted, idWorkpackModel);
      const validPasteOutherOffice = workpackCuted.plan.idOffice === this.idOffice ? true : this.isUserAdmin;
      if (canPaste && validPasteOutherOffice) {
        iconMenuItems.push({
          label: `${this.translateSrv.instant('paste')} ${workpackCuted.name}`,
          icon: 'fas fa-paste',
          command: (event) => this.handlePasteWorkpack(idPlan, idWorkpackModel, this.idWorkpack, incompatiblesProperties)
        });
      }
    }
    const workpackModelCardIndex = this.cardsWorkPackModelChildren.findIndex(card => card.idWorkpackModel === idWorkpackModel);
    if (workpackModelCardIndex > -1) {
      this.cardsWorkPackModelChildren[workpackModelCardIndex].cardSection.createNewElementMenuItemsWorkpack = iconMenuItems;
      const newWorkpackCardIndex =
      this.cardsWorkPackModelChildren[workpackModelCardIndex].cardItemsSection.findIndex( card => card.typeCardItem === 'newCardItem' );
      if (newWorkpackCardIndex > -1) {
        this.cardsWorkPackModelChildren[workpackModelCardIndex].cardItemsSection[newWorkpackCardIndex].iconMenuItems = iconMenuItems;
      }
    }

  }

  loadDashboardData(dashboard?, milestone?, risk?) {
    if (!dashboard) {
      return {
        risk,
        milestone
      };
    }
    const dashboardData = {
      tripleConstraint: dashboard && dashboard.tripleConstraint && {
        idBaseline: dashboard.tripleConstraint.idBaseline,
        cost: {
          actualValue: dashboard.tripleConstraint.costActualValue,
          foreseenValue: dashboard.tripleConstraint.costForeseenValue,
          plannedValue: dashboard.tripleConstraint.costPlannedValue,
          variation: dashboard.tripleConstraint.costVariation,
        },
        schedule: {
          actualEndDate: dashboard.tripleConstraint.scheduleActualEndDate,
          actualStartDate: dashboard.tripleConstraint.scheduleActualStartDate,
          actualValue: dashboard.tripleConstraint.scheduleActualValue,
          foreseenEndDate: dashboard.tripleConstraint.scheduleForeseenEndDate,
          foreseenStartDate: dashboard.tripleConstraint.scheduleForeseenStartDate,
          foreseenValue: dashboard.tripleConstraint.scheduleForeseenValue,
          plannedEndDate: dashboard.tripleConstraint.schedulePlannedEndDate,
          plannedStartDate: dashboard.tripleConstraint.schedulePlannedStartDate,
          plannedValue: dashboard.tripleConstraint.schedulePlannedValue,
          variation: dashboard.tripleConstraint.scheduleVariation
        },
        scope: {
          actualVariationPercent: dashboard.tripleConstraint.scopeActualVariationPercent,
          foreseenVariationPercent: dashboard.tripleConstraint.scopeForeseenVariationPercent,
          plannedVariationPercent: dashboard.tripleConstraint.scopePlannedVariationPercent,
          foreseenValue: dashboard.tripleConstraint.scopeForeseenValue,
          actualValue: dashboard.tripleConstraint.scopeActualValue,
          plannedValue: dashboard.tripleConstraint.scopePlannedValue,
          variation: dashboard.tripleConstraint.scopeVariation,
          foreseenWorkRefMonth: dashboard.tripleConstraint.scopeForeseenWorkRefMonth
        }
      },
      earnedValue: dashboard && dashboard.performanceIndex && dashboard.performanceIndex.earnedValue,
      costPerformanceIndex: dashboard && dashboard.performanceIndex && dashboard.performanceIndex.costPerformanceIndexValue ? {
        costVariation: dashboard.performanceIndex.costPerformanceIndexVariation,
        indexValue: dashboard.performanceIndex.costPerformanceIndexValue
      } : null,
      schedulePerformanceIndex: dashboard && dashboard.performanceIndex && dashboard.performanceIndex.schedulePerformanceIndexValue ? {
        indexValue: dashboard.performanceIndex.schedulePerformanceIndexValue,
        scheduleVariation: dashboard.performanceIndex.schedulePerformanceIndexVariation
      } : null,
      risk,
      milestone
    };

    return dashboardData;
  }

  async unlinkedWorkpack(idWorkpackLinked, idWorkpackModel) {
    this.workpackChildChanging = true;
    const result = await this.workpackSrv.unlinkWorkpack(idWorkpackLinked, idWorkpackModel,
      { 'id-workpack-parent': this.idWorkpack, 'id-plan': this.idPlan });
    this.workpackChildChanging = false;
    if (result.success) {
      const workpackModelIndex = this.cardsWorkPackModelChildren
        .findIndex(workpackModel => workpackModel.idWorkpackModel === idWorkpackModel);
      if (workpackModelIndex > -1) {
        const workpackIndex = this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection
          .findIndex(w => w.itemId === idWorkpackLinked);
        if (workpackIndex > -1) {
          this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection.splice(workpackIndex, 1);
          this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection =
            Array.from(this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection);
          this.totalRecordsWorkpacks[workpackModelIndex] = this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection.length;
        }
      }
      this.menuSrv.reloadMenuPortfolio();
      this.dashboardSrv.loadDashboard();
    }
  }

  endManagementOfDeliverable(workpack: IWorkpackListCard, idWorkpackModel) {
    this.showDialogEndManagement = true;
    this.endManagementWorkpack = {
      idWorkpackModel,
      idWorkpack: workpack.id,
      reason: '',
      endManagementDate: null
    };
  }

  async handleEndManagementDeliverable() {
    if (this.endManagementWorkpack && this.endManagementWorkpack.reason.length > 0
      && this.endManagementWorkpack.endManagementDate !== null) {
      this.workpackChildChanging = true;
      const result = await this.workpackSrv.endManagementDeliverable({
        idWorkpack: this.endManagementWorkpack.idWorkpack,
        endManagementDate: moment(this.endManagementWorkpack.endManagementDate).format('yyyy-MM-DD'),
        reason: this.endManagementWorkpack.reason
      });
      this.workpackChildChanging = false;
      if (result.success) {
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('messages.endManagementSuccess'),
          detail: this.translateSrv.instant('messages.endManagementSuccess'),
          life: 3000
        });
        this.handleCancelEndManagement();
        if (!this.idWorkpackModelLinked) {
          await this.loadSectionsWorkpackChildren();
        } else {
          await this.loadSectionsWorkpackChildrenLinked();
        }
      }
    } else {
      this.messageSrv.add({
        severity: 'warn',
        summary: this.translateSrv.instant('messages.invalidForm'),
        detail: this.translateSrv.instant('messages.endManagementInputAlert'),
        life: 3000
      });
    }
  }

  handleCancelEndManagement() {
    this.showDialogEndManagement = false;
    this.endManagementWorkpack = undefined;
  }

  resumeManagementOfDeliverable(workpack: IWorkpackListCard, idWorkpackModel) {
    this.showDialogResumeManagement = true;
    this.endManagementWorkpack = {
      idWorkpackModel,
      idWorkpack: workpack.id,
      reason: workpack.reason,
      endManagementDate: moment(workpack.endManagementDate, 'DD-MM-yyyy').toDate()
    };
  }

  handleCancelResumeManagement() {
    this.showDialogResumeManagement = false;
    this.endManagementWorkpack = undefined;
  }

  handleOnHasWBS(event) {
    this.hasWBS = event;
    if (this.showTabview && !this.hasWBS) {
      this.tabs = this.tabs.filter(tab => tab.key !== 'WBS');
    }
  }

  async handleResumeManagementDeliverable() {
    this.workpackChildChanging = true;
    const result = await this.workpackSrv.endManagementDeliverable({
      endManagementDate: null,
      reason: this.endManagementWorkpack.reason,
      idWorkpack: this.endManagementWorkpack.idWorkpack
    });
    this.workpackChildChanging = false;
    if (result.success) {
      this.handleCancelResumeManagement();
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('messages.endManagementSuccess'),
        detail: this.translateSrv.instant('messages.endManagementSuccess'),
        life: 3000
      });
      if (!this.idWorkpackModelLinked) {
        await this.loadSectionsWorkpackChildren();
      } else {
        await this.loadSectionsWorkpackChildrenLinked();
      }
    }
  }

  async navigateToConfigCCB(idProject: number) {
    await this.setConfigWorkpackSrv.setWorkpackConfig(this.idPlan, idProject);
    this.router.navigate(
      ['/workpack/change-control-board'],
      {
        queryParams: {
          idProject,
          idParent: this.idWorkpack,
          idOffice: this.idOffice
        }
      });
  }

  navigateToCancelProject(idProject: number, projectName: string) {
    this.router.navigate(
      ['/workpack/baseline-cancelling'],
      this.idWorkpackModelLinked ?
        {
          queryParams: {
            idProject,
            idWorkpackModelLinked: this.idWorkpackModelLinked ? this.idWorkpackModelLinked as number : null,
            projectName
          }
        } : {
          queryParams: {
            idProject,
            projectName
          }
        });
  }

  async handleCancelWorkpack(idWorkpack: number) {
    this.workpackChildChanging = true;
    const result = await this.workpackSrv.cancelWorkpack(idWorkpack);
    this.workpackChildChanging = false;
    if (result.success) {
      await this.reloadSectionsWorkpackChildren();
    }
  }

  async handleRestoreWorkpack(idWorkpack: number) {
    this.workpackChildChanging = true;
    const result = await this.workpackSrv.restoreWorkpack(idWorkpack);
    this.workpackChildChanging = false;
    if (result.success) {
      await this.reloadSectionsWorkpackChildren();
    }
  }

  async handleCutWorkpack(workpack: IWorkpackListCard) {
    this.workpackSrv.setWorkpackCuted({ ...workpack, idParent: this.idWorkpack });
    const workpackModelIndex = this.cardsWorkPackModelChildren
      .findIndex(workpackModel => workpackModel.idWorkpackModel === workpack.idWorkpackModel);
    if (workpackModelIndex > -1) {
      const workpackIndex = this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection
        .findIndex(w => w.itemId === workpack.id);
      if (workpackIndex > -1) {
        this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection.splice(workpackIndex, 1);
        this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection =
          Array.from(this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection);
        this.totalRecordsWorkpacks[workpackModelIndex] = this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection.length;
      }
    }
  }

  async checkPasteWorkpack(workpackCuted: IWorkpackListCard, idWorkpackModelTo: number) {
    if (idWorkpackModelTo === workpackCuted.idWorkpackModel) {
      return { canPaste: true, incompatiblesProperties: false };
    }
    return { canPaste: false, incompatiblesProperties: true };
  }

  async handlePasteWorkpack(idPlanTo: number, idWorkpackModelTo: number, idParentTo: number, incompatiblesProperties: boolean) {
    const workpackCuted = this.workpackSrv.getWorkpackCuted();
    if (workpackCuted) {
      if (incompatiblesProperties) {
        this.confirmationSrv.confirm({
          message: this.translateSrv.instant('messages.confirmPaste'),
          key: 'pasteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async() => {
            await this.pasteWorkpack(workpackCuted, idWorkpackModelTo, idPlanTo, idParentTo);
          },
          reject: () => {
          }
        });
      } else {
        await this.pasteWorkpack(workpackCuted, idWorkpackModelTo, idPlanTo, idParentTo);
      }
    }
  }

  async pasteWorkpack(workpackCuted: IWorkpackListCard, idWorkpackModelTo: number, idPlanTo: number, idParentTo: number) {
    this.workpackChildChanging = true;
    const result = await this.workpackSrv.pasteWorkpack(workpackCuted.id, idWorkpackModelTo, {
      idPlanFrom: workpackCuted.idPlan,
      idParentFrom: workpackCuted.idParent,
      idPlanTo,
      idParentTo,
      idWorkpackModelFrom: workpackCuted.idWorkpackModel
    });
    this.workpackChildChanging = false;
    if (result.success) {
      this.workpackSrv.removeWorkpackCuted();
      await this.reloadSectionsWorkpackChildren();
      this.menuSrv.reloadMenuPortfolio();
    }
  }

  async loadSectionsWorkpackChildrenLinked() {
    this.cardsWorkPackModelChildren = this.workpack.modelLinked?.children?.map((workpackModel) => {
      const propertiesCard: ICard = {
        toggleable: false,
        initialStateToggle: false,
        notShowCardTitle: this.showTabview ? true : false,
        cardTitle: workpackModel.nameInPluralWorkpackModelLinked,
        tabTitle: workpackModel.nameInPluralWorkpackModelLinked,
        collapseble: this.showTabview ? false : true,
        initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus,
        showFilters: true,
        showCreateNemElementButtonWorkpack: false
      };
      return {
        idWorkpackModel: workpackModel.idWorkpackModelLinked,
        cardSection: propertiesCard,
        workpackShowCancelleds: this.workpack.canceled ? true : false
      };
    });
    this.workpack.modelLinked?.children.forEach(async(workpackModel, index) => {
      this.cardsWorkPackModelChildren[index].cardSection.isLoading = true;
      const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${workpackModel.idWorkpackModelLinked}/workpacks`);
      if (resultFilters.success && resultFilters.data) {
        this.cardsWorkPackModelChildren[index].cardSection.filters = resultFilters.data;
      }
      const idFilterSelected = this.cardsWorkPackModelChildren[index].cardSection.filters.find(defaultFilter => !!defaultFilter.favorite) ?
        this.cardsWorkPackModelChildren[index].cardSection.filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
      const resultItemsList = await this.loadWorkpacksFromWorkpackModel
        (this.idPlan, workpackModel.idWorkpackModelLinked, idFilterSelected, '', false, workpackModel.idWorkpackModelLinked);
      this.cardsWorkPackModelChildren[index].cardItemsSection = resultItemsList && resultItemsList.workpackItemCardList;
      this.cardsWorkPackModelChildren[index].cardSection.isLoading = false;
    });
    this.cardsWorkPackModelChildren.forEach((workpackModel, i) => {
      this.totalRecordsWorkpacks[i] = workpackModel.cardItemsSection ? workpackModel.cardItemsSection.length + 1 : 1;
    });

  }

  async reloadSectionsWorkpackChildren() {
    if (!this.idWorkpackModelLinked) {
      await this.loadSectionsWorkpackChildren();
    } else {
      await this.loadSectionsWorkpackChildrenLinked();
    }
  }

  handleNewWorkpack(idPlan, idWorkpackModel, idWorkpackParent) {
    this.router.navigate(['workpack'], {
      queryParams: {
        idPlan,
        idWorkpackModel,
        idWorkpackParent
      }
    });
  }

  async loadSharedWorkpackList(idWorkpackModel: number, idPlan: number) {
    const result = await this.workpackSrv.GetSharedWorkpacks({
      'id-workpack-model': idWorkpackModel,
      'id-plan': idPlan
    });
    if (result.success) {
      return result.data;
    }
    return [];
  }

  async handleLinkToWorkpack(idWorkpack: number, idWorkpackModel: number) {
    this.workpackChildChanging = true;
    const result = await this.workpackSrv.linkWorkpack(idWorkpack, idWorkpackModel,
      { 'id-parent': this.idWorkpack, 'id-plan': this.idPlan });
    this.workpackChildChanging = false;
    if (result.success) {
      this.menuSrv.reloadMenuPortfolio();
      this.router.navigate(['/workpack'], {
        queryParams: {
          id: idWorkpack,
          idWorkpackModelLinked: idWorkpackModel,
          idPlan: this.idPlan,
          linkEvent: true
        }
      });
    }
  }

  handleSharing(idWorkpack: number) {
    this.router.navigate(['/workpack/sharing'], {
      queryParams: {
        idWorkpack,
        idWorkpackParent: this.idWorkpack,
        idPlan: this.propertiesPlan.id
      }
    });
  }

  handleCreateNewWorkpack(idWorkpackModel: number) {
    this.router.navigate(['/workpack'], {
      queryParams: {
        idPlan: this.idPlan,
        idWorkpackModel,
        idWorkpackParent: this.idWorkpack
      }
    });
  }

  async deleteWorkpackChildren(workpack) {
    const workpackModelIndex = this.cardsWorkPackModelChildren
        .findIndex(workpackModel => workpackModel.idWorkpackModel === workpack.idWorkpackModel);
    this.cardsWorkPackModelChildren[workpackModelIndex].cardSection.isLoading = true;
    const result = await this.workpackSrv.delete(workpack);
    this.cardsWorkPackModelChildren[workpackModelIndex].cardSection.isLoading = false;
    if (result.success) {
      if (workpackModelIndex > -1) {
        const workpackIndex = this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection
          .findIndex(w => w.itemId === workpack.id);
        if (workpackIndex > -1) {
          this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection.splice(workpackIndex, 1);
          this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection =
            Array.from(this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection);
          this.totalRecordsWorkpacks[workpackModelIndex] = this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection.length;
        }
      }
      this.menuSrv.reloadMenuPortfolio();
      this.dashboardSrv.loadDashboard();
    }
  }

  async handleWorkpackCancelledToggle(workpackModelIndex: number, event) {
    const idWorkpackModel = this.cardsWorkPackModelChildren[workpackModelIndex].idWorkpackModel;
    const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${idWorkpackModel}/workpacks`);
    const filters = resultFilters.success && resultFilters.data;
    const idFilterSelected = filters.find(defaultFilter => !!defaultFilter.favorite) ?
      filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
    const term = this.cardsWorkPackModelChildren[workpackModelIndex].cardSection.searchTerm;
    const resultItemsList = await
      this.loadWorkpacksFromWorkpackModel(this.workpack.plan.id, idWorkpackModel, idFilterSelected, term, event.checked);
    this.cardsWorkPackModelChildren[workpackModelIndex].cardItemsSection = resultItemsList && resultItemsList.workpackItemCardList;
    this.cardsWorkPackModelChildren[workpackModelIndex].workpackShowCancelleds = event.checked;
  }

  scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSaveButtonClicked() {
    this.cancelButton.hideButton();
    this.workpackSrv.nextPendingChanges(false);
    this.saveButtonSrv.nextSaveButtonClicked(true);
  }

  get checkHasPermission() {
    return this.isUserAdmin ||
    (this.workpack && this.workpack.permissions && this.workpack.permissions.filter( p => p.level !== 'BASIC_READ').length > 0);
  }

  async saveWorkpack(event) {
    const properties = event.properties;
    let updateSuccess = true;
    if (!!this.changedStatusCompleted) {
      if (this.workpack.type === TypeWorkpackEnum.MilestoneModel) {
        const dateProperty = properties.find(p => p.type === TypePropertyModelEnum.DateModel);
        if (dateProperty) {
          const date = dateProperty.value ? moment(dateProperty.value).format('yyyy-MM-DD') : null;
          try {
            const result = await this.workpackSrv.completeDeliverable(this.idWorkpack, this.workpack?.completed, date);
            updateSuccess = result.success;
          } catch (error) {
            return;
          }
        }
      } else {
        try {
          const result = await this.workpackSrv.completeDeliverable(this.idWorkpack, this.workpack?.completed);
          updateSuccess = result.success;
        } catch (error) {
          return;
        }
      }
    }
    if (!updateSuccess) {
      return;
    }
    this.changedStatusCompleted = false;
    this.workpackProperties = properties.map(p => {
      if (p.type === TypePropertyModelEnum.GroupModel) {
        const groupedProperties = p.groupedProperties.map(groupProp => groupProp.getValues());
        return { ...p.getValues(), groupedProperties };
      }
      return p.getValues();
    });
    if (properties.filter(p => p.invalid).length > 0) {
      this.messageSrv.add({
        severity: 'warn',
        summary: this.translateSrv.instant('messages.invalidField'),
        detail: this.translateSrv.instant('messages.invalidField'),
        life: 3000
      });
      this.scrollTop();
      return;
    }
    const workpackName = (this.workpackProperties.find(prop => prop.name === 'name')).value as string;
    const workpackFullName = (this.workpackProperties.find(prop => prop.name === 'fullName')).value as string;
    let milestoneDate;
    let milestoneChangeDateReason;
    if (this.workpackModel.type === TypeWorkpackModelEnum.MilestoneModel) {
      const propertyDate = this.workpackProperties.find(prop => prop.name === 'date');
      milestoneDate = propertyDate.value;
      milestoneChangeDateReason = propertyDate.reason;
    }
    this.workpackProperties = this.workpackProperties.filter(prop => !['name', 'fullName', 'date'].includes(prop.name));
    const isPut = !!this.idWorkpack;
    const workpack = isPut
      ? {
        id: this.idWorkpack,
        idParent: this.workpack.idParent,
        idPlan: this.workpack.plan.id,
        idWorkpackModel: this.workpack.idWorkpackModel,
        type: this.workpack.type,
        name: workpackName,
        fullName: workpackFullName,
        date: milestoneDate,
        reason: milestoneChangeDateReason,
        properties: this.workpackProperties,
      }
      : {
        idPlan: this.idPlan,
        idWorkpackModel: this.idWorkpackModel,
        idParent: this.idWorkpackParent,
        type: TypeWorkpackEnum[this.workpackModel.type],
        name: workpackName,
        fullName: workpackFullName,
        date: milestoneDate,
        properties: this.workpackProperties,
      };
    this.formIsSaving = true;
    const { success, data } = isPut
      ? await this.workpackSrv.put(workpack)
      : await this.workpackSrv.post(workpack);

    if (success) {
      if (!isPut) {
        this.personSrv.setPersonWorkLocal({
          idOffice: this.idOffice,
          idPlan: this.idPlan,
          idWorkpack: data.id,
          idWorkpackModelLinked: null
        });
        if ((this.workpack && this.workpack.type !== TypeWorkpackEnum.MilestoneModel)
          || (this.workpackModel && TypeWorkpackEnum[this.workpackModel.type] !== TypeWorkpackEnum.MilestoneModel)) {
            const workpackParams = this.workpackSrv.getWorkpackParams();
            this.workpackSrv.setWorkpackParams({
              ...workpackParams,
              idWorkpack: data.id
            });
            this.idWorkpack = data.id;
            this.resetWorkpack();
        } else {
          this.navigateToBack();
        }
      } else {
        if ((this.workpack && this.workpack.type === TypeWorkpackEnum.MilestoneModel)
          || (this.workpackModel && TypeWorkpackEnum[this.workpackModel.type] === TypeWorkpackEnum.MilestoneModel)) {
        this.navigateToBack();
        }
      }
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.formIsSaving = false;
      setTimeout( () => {
        this.menuSrv.reloadMenuPortfolio(!isPut ? this.idWorkpack : undefined);
      },5000);
    }
  }

  navigateToBack() {
    this.router.navigate(['/workpack'], {
      queryParams: {
        id: this.workpack && this.workpack.idParent ? this.workpack.idParent : this.idWorkpackParent,
        idPlan: this.idPlan
      }
    });
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    this.saveButtonSrv.nextCancelButtonClicked(true);
    this.workpackSrv.nextPendingChanges(false);
  }

  async handleEditFilterWorkpackModel(event, idWorkpackModel: number) {
    const idFilter = event.filter;
    if (idFilter) {
      await this.workpackBreadcrumbStorageSrv.setBreadcrumbStorage();
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          idFilter,
          entityName: `workpacks`,
          idWorkpackModel,
          idOffice: this.idOffice
        }
      });
    }
  }

  async handleSelectedFilterWorkpackModel(event, idWorkpackModel: number) {
    const idFilter = event.filter;
    const workpackModelCardIndex = this.cardsWorkPackModelChildren.findIndex(card => card.idWorkpackModel === idWorkpackModel);
    this.cardsWorkPackModelChildren[workpackModelCardIndex].cardSection.idFilterSelected = idFilter;
    this.cardsWorkPackModelChildren[workpackModelCardIndex].cardSection.isLoading = true;
    await this.reloadWorkpacksOfWorkpackModelSelectedFilter(idWorkpackModel);
    this.cardsWorkPackModelChildren[workpackModelCardIndex].cardSection.isLoading = false;
  }

  handleSearchText() {
    if (this.searchTerm?.trim().length < this.searchSrv.minLength) return;

    if (this.searchTerm !== this.searchSrv.searchTerm$.value) {

        this.page = 0;
        const pageData = {
            page: this.page,
            pageSize: this.pageSize
        } as PageDef;

        this.workpackLoading = true;
        this.searchSrv.doSimpleSearch(this.searchTerm, this.idWorkpack, pageData)
            .pipe(finalize(() => this.workpackLoading = false))
            .subscribe(_result => {
                if(_result?.success) {
                    this.isSearching = true;
                    this.result = _result.data.data;
                    this.totalCountResults = _result.data.totalRecords;
                } else {
                    this.result = [];
                    this.totalCountResults = undefined;
                }
            });
    }
  }

  async handleSearchTextWorkpackModel(event, idWorkpackModel: number) {
    const term = event.term ? event.term : '';
    const workpackModelCardIndex = this.cardsWorkPackModelChildren.findIndex(card => card.idWorkpackModel === idWorkpackModel);
    this.cardsWorkPackModelChildren[workpackModelCardIndex].cardSection.searchTerm = term;
    await this.reloadWorkpacksOfWorkpackModelSelectedFilter(idWorkpackModel);
  }

  async handleNewFilterWorkpackModel(idWorkpackModel: number) {
    await this.workpackBreadcrumbStorageSrv.setBreadcrumbStorage();
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: `workpacks`,
        idWorkpackModel,
        idOffice: this.idOffice
      }
    });
  }

  async reloadWorkpacksOfWorkpackModelSelectedFilter(idWorkpackModel: number) {
    const workpackModelCardIndex = this.cardsWorkPackModelChildren.findIndex(card => card.idWorkpackModel === idWorkpackModel);
    const idFilter = this.cardsWorkPackModelChildren[workpackModelCardIndex].cardSection.idFilterSelected;
    const term = this.cardsWorkPackModelChildren[workpackModelCardIndex].cardSection.searchTerm;
    if (workpackModelCardIndex > -1) {
      const resultItemsList = await this.loadWorkpacksFromWorkpackModel(this.workpack.plan.id, idWorkpackModel, idFilter, term, false);
      const workpacksByFilter = resultItemsList && resultItemsList.workpackItemCardList;
      this.cardsWorkPackModelChildren[workpackModelCardIndex].cardItemsSection = workpacksByFilter;
      this.totalRecordsWorkpacks[workpackModelCardIndex] = workpacksByFilter && workpacksByFilter.length;
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
          idFilter,
          entityName,
          idWorkpackModel: this.workpack.idWorkpackModel,
          idOffice: this.idOffice
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
        idWorkpackModel: this.workpack.idWorkpackModel,
        idOffice: this.idOffice
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
        property.possibleValues = this.workpackModel.personRoles && this.workpackModel.personRoles.map(role => ({
          label: role,
          value: role
        }));
        property.possibleValues = this.workpackModel.organizationRoles &&
          [...property.possibleValues, ...this.workpackModel.organizationRoles
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

  changeTab(event: { tabs: ITabViewScrolled }) {
    this.selectedTab = event.tabs;
  }

  loadWorkpackTabs() {
    this.tabs = [];
    if (this.idWorkpack) {
      if (!!this.idWorkpack && !!this.workpack &&
        !this.workpack.canceled && !!this.workpackModel &&
        !!this.workpackModel.dashboardSessionActive) {
        this.tabs.push({
          menu: 'dashboard',
          key: 'dashboard'
        });
      }
      if (this.hasWBS) {
        this.tabs.push({
          menu: 'WBS',
          key: 'WBS'
        });
      }
      this.tabs.push({
        menu: 'properties',
        key: 'properties'
      });
      if (this.idWorkpack && this.workpackModel && this.workpackModel.scheduleSessionActive) {
        this.tabs.push({
          menu: 'schedule',
          key: 'schedule'
        });
      }
      if (this.idWorkpack && this.workpackModel && this.workpackModel.childWorkpackModelSessionActive && this.workpackModel?.children) {
        this.tabs.push(
          ...this.workpackModel?.children?.map(workpackModel => ({
            menu: workpackModel.modelNameInPlural,
            key: workpackModel.modelNameInPlural
          }))
        );
      }
      if (this.getShowStakeHolderSection()) {
        this.tabs.push({
          menu: 'stakeholdersAndPermissions',
          key: 'stakeholdersAndPermissions'
        });
      }
      if (this.idWorkpack && this.workpackModel && this.workpackModel.costSessionActive) {
        this.tabs.push({
          menu: 'costAccounts',
          key: 'costAccounts'
        });
      }
      if (this.idWorkpack && this.workpackModel && this.workpack.type === TypeWorkpackEnum.ProjectModel) {
        this.tabs.push({
          menu: 'indicators',
          key: 'indicators'
        });
      }
      if (this.getShowBaselineSection()) {
        this.tabs.push({
          menu: 'baselines',
          key: 'baselines'
        });
      }
      if (this.idWorkpack && this.workpackModel && this.workpackModel.riskAndIssueManagementSessionActive) {
        this.tabs.push({
          menu: 'risks',
          key: 'risks'
        });
      }
      if (this.idWorkpack && this.workpackModel && this.workpackModel.riskAndIssueManagementSessionActive) {
        this.tabs.push({
          menu: 'issues',
          key: 'issues'
        });
      }
      if (this.idWorkpack && this.workpackModel && this.workpackModel.processesManagementSessionActive) {
        this.tabs.push({
          menu: 'processes',
          key: 'processes'
        });
      }
      if (this.idWorkpack && this.workpackModel && this.workpackModel.journalManagementSessionActive) {
        this.tabs.push({
          menu: 'journal',
          key: 'journal'
        });
      }
    }
    if (!this.idWorkpack) {
      this.tabs.push({
        menu: 'properties',
        key: 'properties'
      });
    }
    this.isLoading = false;
  }

  showWorkpackId() {
    setTimeout(() => {
      const show = this.idWorkpack  && !this.workpackLoading && this.workpackModel && !this.isSearching &&
      (!this.showTabview || (!!this.showTabview && (!this.selectedTab || this.selectedTab.key !== 'schedule')));
      return show;
    });
  }
}
