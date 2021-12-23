import { ConfirmationService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { BreadcrumbService } from './../../../shared/services/breadcrumb.service';
import { ResponsiveService } from './../../../shared/services/responsive.service';
import { BaselineService } from './../../../shared/services/baseline.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { IBaseline } from './../../../shared/interfaces/IBaseline';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-baseline-view',
  templateUrl: './baseline-view.component.html',
  styleUrls: ['./baseline-view.component.scss']
})
export class BaselineViewComponent implements OnInit {

  @ViewChild('buttonNo') buttonNo: ElementRef;

  idBaseline: number;
  responsive: boolean;
  baseline: IBaseline;
  $destroy = new Subject();
  comment: string;
  language: string;
  showCostDetails = false;
  showScheduleDetails = false;
  showScopeDetails = false;
  evaluationComment: string;
  baselineEvaluatedByUser = false;
  showDialogConfirmation = false;
  messageDialog: string;
  evaluateDecision: string;
  selectedComment = '';
  showCommentDialog = false;
  
  constructor(
    private actRouter: ActivatedRoute,
    private baselineSrv: BaselineService,
    private responsiveSrv: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private translateSrv: TranslateService,
    private router: Router,
    private confirmationSrv: ConfirmationService
  ) {
    this.actRouter.queryParams
      .subscribe(({ id }) => {
        this.idBaseline = +id;
      });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
      this.ngOnInit();
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.setLanguage();
    await this.loadPropertiesBaseline()
    await this.setBreadcrumb();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en';
  }

  async setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'baseline',
        routerLink: ['/ccbmember-baselines-view/baseline'],
        queryParams: { id: this.idBaseline },
        info: this.baseline?.name,
        tooltip: this.baseline?.name
      }
    ]);
  }

  async loadPropertiesBaseline() {
    const result = await this.baselineSrv.getBaselineView(this.idBaseline);
    if (result.success) {
      this.baseline = result.data;
      this.loadChartScheduleValues();
      this.checkEvaluation();
    }
  }

  checkEvaluation() {
    this.baselineEvaluatedByUser = this.baseline.evaluations && this.baseline.evaluations.filter(evaluation => !!evaluation.myEvaluation && !!evaluation.decision).length > 0;
  }

  loadChartScheduleValues() {
    if (this.baseline && this.baseline.schedule) {
      const startDate = (this.baseline?.schedule?.currentStartDate && this.baseline?.schedule?.proposedStartDate) ? (moment(this.baseline?.schedule?.currentStartDate, 'yyyy-MM-DD').isBefore(moment(this.baseline.schedule.proposedStartDate, 'yyyy-MM-DD')) ?
      moment(this.baseline?.schedule?.currentStartDate, 'yyyy-MM-DD') :
      moment(this.baseline?.schedule?.proposedStartDate, 'yyyy-MM-DD')) : (this.baseline?.schedule?.currentStartDate ? moment(this.baseline?.schedule?.currentStartDate, 'yyyy-MM-DD') : moment(this.baseline?.schedule?.proposedStartDate, 'yyyy-MM-DD'));
    const endDate = (this.baseline.schedule.currentEndDate && this.baseline.schedule.proposedEndDate) ? (moment(this.baseline.schedule.currentEndDate, 'yyyy-MM-DD').isAfter(moment(this.baseline.schedule.proposedEndDate, 'yyyy-MM-DD')) ?
      moment(this.baseline?.schedule?.currentEndDate, 'yyyy-MM-DD') :
      moment(this.baseline?.schedule?.proposedEndDate, 'yyyy-MM-DD')) : (this.baseline.schedule.currentEndDate ? moment(this.baseline.schedule.currentEndDate, 'yyyy-MM-DD') : moment(this.baseline.schedule.proposedEndDate, 'yyyy-MM-DD'));
    this.baseline.schedule.monthsInPeriod = Number((endDate.diff(startDate, 'days') / 30).toFixed(1));
    this.baseline.schedule.difStartCurrentDateAndStartProposedDate = Number((moment(this.baseline.schedule.currentStartDate, 'yyyy-MM-DD').diff(moment(this.baseline.schedule.proposedStartDate, 'yyyy-MM-DD'), 'days') / 30).toFixed(1));
    this.baseline.schedule.difEndCurrentDateAndEndProposedDate = Number((moment(this.baseline.schedule.currentEndDate, 'yyyy-MM-DD').diff(moment(this.baseline.schedule.proposedEndDate, 'yyyy-MM-DD'), 'days') / 30).toFixed(1));
    this.baseline.schedule.marginHightProposedBar = this.baseline.schedule.difEndCurrentDateAndEndProposedDate > 0 ?
      (this.baseline.schedule.monthsInPeriod > 0 ? (100 / this.baseline.schedule.monthsInPeriod) * this.baseline.schedule.difEndCurrentDateAndEndProposedDate : 0) : 0;
    this.baseline.schedule.marginLeftCurrentBar = this.baseline.schedule.difStartCurrentDateAndStartProposedDate > 0 ?
      (this.baseline.schedule.monthsInPeriod > 0 ? (100 / this.baseline.schedule.monthsInPeriod) * this.baseline.schedule.difStartCurrentDateAndStartProposedDate : 0) : 0;
    }
  }

  async handleEvaluateBaseline(decision: string) {
    const result = await this.baselineSrv.evaluateBaseline(this.idBaseline, { decision, comment: this.comment });
    if (result.success) {
      this.router.navigate(
        ['/ccbmember-baselines-view']
      );
    }
  }

  handleShowCardDetails(card: string) {
    switch (card) {
      case 'cost':
        this.showCostDetails = true;
        this.showScheduleDetails = false;
        this.showScopeDetails = false;
        break;
      case 'schedule':
        this.showCostDetails = false;
        this.showScheduleDetails = true;
        this.showScopeDetails = false;
        break;
      case 'scope':
        this.showCostDetails = false;
        this.showScheduleDetails = false;
        this.showScopeDetails = true;
        break;
      default:
        break;
    }
  }

  handleCloseCardDetails(card: string) {
    switch (card) {
      case 'cost':
        this.showCostDetails = false;
        break;
      case 'schedule':
        this.showScheduleDetails = false;
        break;
      case 'scope':
        this.showScopeDetails = false;
        break;
      default:
        break;
    }
  }

  handleEvaluate(decision: string) {
    this.messageDialog = decision === 'APPROVED' ?
      (!this.baseline.cancelation ? `${this.translateSrv.instant('messages.confirmeApproveBaselineMessage')}` : `${this.translateSrv.instant('messages.confirmeApproveCancellingProjectMessage')}`)
      : (!this.baseline.cancelation ? `${this.translateSrv.instant('messages.confirmeRejectBaselineMessage')}` : `${this.translateSrv.instant('messages.confirmeRejectCancellingProjectMessage')}`);
    this.showDialogConfirmation = true;
    setTimeout(() => {
      this.buttonNo.nativeElement.focus();
    });
    this.evaluateDecision = decision;
  }

  async submitEvaluate() {
    this.showDialogConfirmation = false;
    this.messageDialog = null;
    const result = await this.baselineSrv.evaluateBaseline(this.idBaseline, { decision: this.evaluateDecision, comment: this.evaluationComment });
    if (result.success) {
      this.router.navigate(['ccbmember-baselines-view']);
    }
  }

  handleCancelEvaluate() {
    this.showDialogConfirmation = false;
    this.messageDialog = null;
  }

  handleShowDialogComment(comment) {
    this.selectedComment = comment;
    this.showCommentDialog = true;
  }

}
