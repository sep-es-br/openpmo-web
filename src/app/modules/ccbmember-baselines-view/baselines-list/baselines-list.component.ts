import { ConfigDataViewService } from './../../../shared/services/config-dataview.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IWorkpackBaselines } from 'src/app/shared/interfaces/IWorkpackBaselines';
import { BaselineService } from 'src/app/shared/services/baseline.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { IBaseline } from '../../../shared/interfaces/IBaseline';


@Component({
  selector: 'app-baselines-list',
  templateUrl: './baselines-list.component.html',
  styleUrls: ['./baselines-list.component.scss']
})
export class BaselinesListComponent implements OnInit, OnDestroy {
  $destroy = new Subject();
  responsive: boolean;
  baselines: IWorkpackBaselines[] = [];
  cardsBaselines: ICard[] = [];

  displayModeAll = 'grid';
  collapsePanelsStatus = true;
  pageSize = 5;
  isLoading = false;

  constructor(
    private responsiveSrv: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private baselineSrv: BaselineService,
    private configDataViewSrv: ConfigDataViewService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.cardsBaselines = this.cardsBaselines.map(card => ({
        ...card,
        initialStateCollapse: this.collapsePanelsStatus,
      }));
    });
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
  }

  async ngOnInit(): Promise<void> {
    await this.setBreadcrumb();
    await this.loadBaselines();
    this.setCardsBaselines(this.baselines);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'changeControlBoard',
        routerLink: ['/ccbmember-baselines-view'],
      }
    ]);
  }

  async loadBaselines() {
    this.isLoading = true;
    const { data, success } = await this.baselineSrv.getBaselinesFromCcbMember();
    if (success) {
      this.baselines = data;
      this.isLoading = false;
    }
  }

  setCardsBaselines(baselines: IWorkpackBaselines[]) {
    this.cardsBaselines = baselines ? baselines.map(baseline => ({
      toggleable: false,
      initialStateToggle: false,
      collapseble: true,
      initialStateCollapse: false,
      cardTitle: baseline.nameWorkpack,
      totalRecords: baseline.baselines.length,
      cardItems: this.getCardItemsBaseline(baseline),
    })) : [];
  }

  getCardItemsBaseline(baseline: IWorkpackBaselines) {
    const getCardItem = (baselineItem: IBaseline) => ({
      typeCardItem: 'listItem',
      icon: !!baselineItem.cancelation ? 'fas fa-times' : 'baseline',
      iconColor: baselineItem.cancelation && '#FF7F81',
      iconSvg: !baselineItem.cancelation,
      nameCardItem: baselineItem.name,
      baselineStatus: baselineItem.status.toLowerCase(),
      baselineStatusDate: baselineItem.active ? baselineItem.activationDate :
        (['PROPOSED', 'REJECTED'].includes(baselineItem.status) ? baselineItem.proposalDate : (baselineItem.status === 'APPROVED' ? baselineItem.activationDate : 'NONE')),
      baselineActive: baselineItem.active,
      itemId: baselineItem.id,
      urlCard: '/ccbmember-baselines-view/baseline',
      paramsUrlCard: [
        { name: 'id', value: baselineItem.id },
      ]
    });
    return baseline.baselines.map(getCardItem);
  }

}
