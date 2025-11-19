import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { takeUntil } from 'rxjs/operators';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartData } from 'chart.js';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IDashboardData } from 'src/app/shared/interfaces/IDashboard';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { Calendar } from 'primeng/calendar';
import { Subject } from 'rxjs';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';
import { IconsTypeWorkpackEnum } from 'src/app/shared/enums/IconsTypeWorkpackModelEnum';
import { IBaseline } from 'src/app/shared/interfaces/IBaseline';
import { Router } from '@angular/router';
import { IWorkpackData, IWorkpackParams } from 'src/app/shared/interfaces/IWorkpackDataParams';
import { WorkpackBreadcrumbStorageService } from 'src/app/shared/services/workpack-breadcrumb-storage.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';

@Component({
  selector: 'app-workpack-section-dashboard',
  templateUrl: './workpack-section-dashboard.component.html',
  styleUrls: ['./workpack-section-dashboard.component.scss']
})
export class WorkpackSectionDashboardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() idWorkpack: number;

  @Input() dashboardShowStakeholders: string[];

  @Input() dashboardShowRisks: boolean;

  @Input() dashboardShowMilestones: boolean;

  @Input() dashboardShowEva: boolean;

  @Input() dashboardShowDeliveryStatus: boolean;

  @Input() workpackFullName: string;

  @Input() workpackType: string;

  @Input() collapsePanelsStatus: boolean;

  @ViewChild(Calendar) calendarComponent: Calendar;

  dashboard: IDashboardData;

  cardDashboardProperties: ICard;

  dashboardMilestonesData: ChartData = {
    labels: [],
    datasets: []
  };

  dashboardRisksData: ChartData = {
    labels: [],
    datasets: []
  };

  iconsEnum = IconsTypeWorkpackEnum;

  referenceMonth: Date;

  selectedBaseline: number;

  yearRange: string;

  $destroy = new Subject();

  calendarFormat: string;

  baselines: IBaseline[];

  responsive = false;

  startDate: Date;

  endDate: Date;

  midleTextMilestones: string;

  midleTextRisks: string;

  midleTextDelivable: string;

  showTabview = false;

  isLoading = false;

  mediaScreen1700: boolean;

  scheduleInterval;

  workpackParams: IWorkpackParams;

  workpackData: IWorkpackData;

  sectionActive = false;

  idMenuLoading: number;

  dashboardStatusData: ChartData = {
    labels: [],
    datasets: []
  };

  isBeingBuild = false;

  windowProperties = {
    isMenuPanelOpen: false,
    currentWindowSize: window.innerWidth,
  };

  constructor(
    private dashboardSrv: DashboardService,
    private translateSrv: TranslateService,
    private responsiveSrv: ResponsiveService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService,
    private route: Router,
    private workpackBreadcrumbStorageSrv: WorkpackBreadcrumbStorageService,
    private breadcrumbSrv: BreadcrumbService,
  ) {
    this.isLoading = true;
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
    });

    this.responsiveSrv.resizeEvent.subscribe((currentValue) => {
      this.mediaScreen1700 = currentValue.width <= 1700;
      this.windowProperties = {
        isMenuPanelOpen: currentValue.width <= this.windowProperties.currentWindowSize,
        currentWindowSize: currentValue.width,
      };
    });

    this.cardDashboardProperties = {
      toggleable: false,
      initialStateToggle: false,
      collapseble: this.showTabview ? false : true,
      initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus,
      cardTitle: this.showTabview ? '' : 'dashboard',
      showFullScreen: true,
      fullScreen: false
    };

    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      setTimeout(() => {
        if (this.calendarComponent) {
          this.calendarComponent?.ngOnInit();
          this.calendarComponent.dateFormat = this.translateSrv.instant('dateFormatMonthYear');
          this.calendarComponent.updateInputfield();
        }
        this.midleTextMilestones = this.translateSrv.instant('milestonesLabelChart');
        this.midleTextRisks = this.translateSrv.instant('risksLabelChart');
        this.midleTextDelivable = this.translateSrv.instant('DeliverableLabelChart');
        this.setDashboardMilestonesData();
        this.setDashboardRisksData();
      }, 150)
    );

    this.dashboardSrv.observableResetDashboard.pipe(takeUntil(this.$destroy)).subscribe(reset => {
      if (reset) {
        this.loadDashboardData();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.calendarFormat = this.translateSrv.instant('dateFormatMonthYear');
    this.midleTextMilestones = this.translateSrv.instant('milestonesLabelChart');
    this.midleTextRisks = this.translateSrv.instant('risksLabelChart');
    this.midleTextDelivable = this.translateSrv.instant('DeliverableLabelChart');
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes.collapsePanelsStatus
    ) {
      this.cardDashboardProperties = Object.assign({
        ...this.cardDashboardProperties,
        initialStateCollapse: this.collapsePanelsStatus
      });
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  loadDashboardData() {
    const {
      workpackData,
      workpackParams,
      scheduleInterval,
      referenceMonth,
      baselines,
      selectedBaseline,
      dashboard,
      yearRange,
      startDate,
      endDate,
      loading,
      isBeingBuild
    } = this.dashboardSrv.getDashboardData();
    this.workpackParams = workpackParams;
    this.workpackData = workpackData;

    this.scheduleInterval = scheduleInterval;
    this.referenceMonth = referenceMonth;
    this.baselines = baselines;
    this.selectedBaseline = selectedBaseline;
    this.dashboard = dashboard;
    this.isBeingBuild = isBeingBuild;

    if (dashboard?.dashboardStatusData) {
      this.dashboardStatusData = {
        labels: ['Concluída', 'Execução', 'Paralisada', 'Planejamento', 'A Cancelar'],
        datasets: [
          {
            data: [
              dashboard.dashboardStatusData.statusConcluida,
              dashboard.dashboardStatusData.statusEmExec,
              dashboard.dashboardStatusData.statusParalisada,
              dashboard.dashboardStatusData.statusPlanejamento,
              dashboard.dashboardStatusData.statusCancelar
            ],
            backgroundColor: [
              '#118DFF',
              '#55B95E',
              '#EA9D42',
              '#EC78EA',
              '#CC2C52'
            ],
          },
        ],
      };
    }

    if (this.dashboard && this.dashboard.workpacksByModel) {
      const cards = Array.from(this.dashboard.workpacksByModel);
      cards.forEach( (card) => {
        const cardModelIndex = this.dashboard.workpacksByModel.findIndex(c =>
          c.idWorkpackModel === card.idWorkpackModel &&
          c.level < card.level
        );
        if (cardModelIndex > -1) {
          this.dashboard.workpacksByModel[cardModelIndex].quantity = (
            this.dashboard.workpacksByModel[cardModelIndex].quantity +
            card.quantity
          );

          const cardIndex = this.dashboard.workpacksByModel.findIndex( c => c === card);
          this.dashboard.workpacksByModel.splice(cardIndex, 1);
        }
      });

      this.dashboard.workpacksByModel = this.dashboard.workpacksByModel;
      this.dashboard.workpacksByModel.sort( (a, b) => a.level - b.level);
    }

    this.yearRange = yearRange;
    this.startDate = startDate;
    this.endDate = endDate;
    this.dashboardMilestonesData = undefined;
    this.dashboardRisksData = undefined;
    this.sectionActive = (
      !!workpackData.workpack &&
      !!workpackData.workpack.id &&
      !workpackData.workpack.canceled &&
      !!workpackData.workpackModel &&
      !!workpackData.workpackModel.dashboardSessionActive
    );

    if (this.dashboard && !loading && this.sectionActive) {
      this.setDashboardMilestonesData();
      this.setDashboardRisksData();
    }
    this.isLoading = loading;
  }

  async getDashboard() {
    this.isLoading = true;
    this.dashboardSrv.getDashboard({referenceMonth: this.referenceMonth, selectedBaseline: this.selectedBaseline});
  }

  async loadWorkpackModelMenu(idWorkpackModel, level, index, event) {
    if (this.dashboard.workpacksByModel[index].menuItems) {
      return;
    }
    this.idMenuLoading = idWorkpackModel;
    const result = await this.dashboardSrv.GetMenuItemsByWorkpackModel({
      idWorkpackActual: this.workpackParams.idWorkpack,
      idWorkpackModel,
      menuLevel: level
    });
    if (result.success) {
      this.dashboard.workpacksByModel[index].menuItems = result.data && result.data.length > 0 ? result.data.map( wp => ({
        label: wp.name,
        icon: wp.icon,
        command: (e) => {
          const classList = Array.from(e.originalEvent?.target?.classList) || [];
          if (classList.some((className: string) => ['p-menuitem-text', 'fas'].includes(className))) {
            e.item.expanded = false;
            this.navigateToWorkpackItem(wp, this.workpackParams.idPlan);
          }
        },
        items: wp.workpacks && wp.workpacks.length > 0 ? wp.workpacks.map( child => ({
          label: child.name,
          icon: child.icon,
          command: () => this.navigateToWorkpackItem(child, this.workpackParams.idPlan)
        })) : undefined
      })) : undefined;
      this.idMenuLoading = undefined;
    }
  }

  closeItemsMenu(index) {
    this.dashboard.workpacksByModel[index].menuItems = this.dashboard.workpacksByModel[index].menuItems &&
      this.dashboard.workpacksByModel[index].menuItems.map( item => ({...item, expanded: false}));
  }

  navigateToWorkpackItem(wp, idPlan) {
    this.setWorkpackBreadcrumbStorage(wp.id, idPlan);
    if (wp.linked) {
      this.route.navigate(['workpack'], {
        queryParams: {
          id: wp.id,
          idWorkpackModelLinked: wp.idWorkpackModel,
          idPlan
        }
      });
    } else {
      this.route.navigate(['workpack'], {
        queryParams: {
          id: wp.id,
          idPlan
        }
      });
    }
  }

  async setWorkpackBreadcrumbStorage(idWorkpack, idPlan) {
    const breadcrumbItems = await this.workpackBreadcrumbStorageSrv.getBreadcrumbs(idWorkpack, idPlan);
    this.breadcrumbSrv.setBreadcrumbStorage(breadcrumbItems);
  }

  setDashboardMilestonesData() {
    const milestone = this.dashboard && this.dashboard.milestone;
    const data = milestone && [milestone.onTime, milestone.late, milestone.concluded, milestone.lateConcluded];
    if (data && data.filter(item => item > 0).length > 0) {
      this.dashboardMilestonesData = {
        labels: [
          this.translateSrv.instant('ontime'),
          this.translateSrv.instant('late'),
          this.translateSrv.instant('concluded'),
          this.translateSrv.instant('lateConcluded'),
        ],
        datasets: [
          {
            data: [milestone.onTime, milestone.late, milestone.concluded, milestone.lateConcluded],
            backgroundColor: [
              '#00b89c',
              '#fa4c4f',
              '#0081c1',
              '#7C75B9',
            ],
          }]
      };
    } else {
      this.dashboardShowMilestones = false;
    }
  }

  setDashboardRisksData() {
    const risk = this.dashboard && this.dashboard.risk;
    const data = risk && [risk.high, risk.medium, risk.low];
    if (data && data.filter(item => item > 0).length > 0) {
      this.dashboardRisksData = {
        labels: [
          this.translateSrv.instant('high'),
          this.translateSrv.instant('medium'),
          this.translateSrv.instant('low'),
        ],
        datasets: [
          {
            data: [risk.high, risk.medium, risk.low],
            backgroundColor: [
              '#ce4543',
              '#fb7800',
              '#ffc300',
            ],
          }]
      };
    } else {
      this.dashboardShowRisks = false;
    }
  }

  async handleSelectedReferenceMonth() {
    await this.getDashboard();
  }

  async handleSeletedBaseline() {
    await this.getDashboard();
  }

  handleOnFullScreen(fullScreenMode: boolean) {
    this.cardDashboardProperties.fullScreen = fullScreenMode;
    this.dashboardSrv.next(fullScreenMode);
  }
}
