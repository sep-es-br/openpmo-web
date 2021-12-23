import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IWorkpackBaselines } from 'src/app/shared/interfaces/IWorkpackBaselines';
import { BaselineService } from 'src/app/shared/services/baseline.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { IBaseline } from './../../../shared/interfaces/IBaseline';


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

  constructor(
    private responsiveSrv: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private baselineSrv: BaselineService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  async ngOnInit(): Promise<void> {
    this.setBreadcrumb();
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
        key: 'baseline',
        routerLink: ['/ccbmember-baselines-view'],
      }
    ]);
  }

  async loadBaselines() {
    const { data, success } = await this.baselineSrv.getBaselinesFromCcbMember();
    if (success) {
      this.baselines = data;
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
      iconSvg: !baselineItem.cancelation ? true : false,
      nameCardItem: baselineItem.name,
      baselineStatus: baselineItem.status.toLowerCase(),
      baselineStatusDate: baselineItem.active ? baselineItem.activationDate :
      (baselineItem.status === 'PROPOSED' ? baselineItem.proposalDate : 'NONE'),
      baselineActive: baselineItem.active,
      itemId: baselineItem.id,
      urlCard: '/ccbmember-baselines-view/baseline',
      paramsUrlCard: [
        { name: 'id', value: baselineItem.id },
      ]
    });
    return baseline.baselines.map(getCardItem);
  }

  handleChangeCollapseExpandPanel(event) {
    this.collapsePanelsStatus = event.mode === 'collapse' ? true : false;
    this.cardsBaselines = this.cardsBaselines.map(card => ({
      ...card,
      initialStateCollapse: this.collapsePanelsStatus,
    }));
  }

  handleChangeDisplayMode(event) {
    this.displayModeAll = event.displayMode;
  }

  handleChangePageSize(event) {
    this.pageSize = event.pageSize;
  }

}
