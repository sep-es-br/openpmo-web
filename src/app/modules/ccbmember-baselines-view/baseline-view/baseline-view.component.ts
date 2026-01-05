import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { BreadcrumbService } from '../../../shared/services/breadcrumb.service';
import { ResponsiveService } from '../../../shared/services/responsive.service';
import { BaselineService } from '../../../shared/services/baseline.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { IBaseline, ITripleConstraintBreakdown } from '../../../shared/interfaces/IBaseline';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as moment from 'moment';
import { TypeWorkpackEnumWBS } from 'src/app/shared/enums/TypeWorkpackEnum';
import { UnitMeasure } from 'src/app/shared/interfaces/IUnitMeasureIndicators';

@Component({
  selector: 'app-baseline-view',
  templateUrl: './baseline-view.component.html',
  styleUrls: ['./baseline-view.component.scss'],
})
export class BaselineViewComponent implements OnInit, OnDestroy {
  @ViewChild('buttonNo') buttonNo: ElementRef;

  idBaseline: number;

  responsive: boolean;

  baseline: IBaseline;

  $destroy = new Subject();

  comment: string;

  language: string;

  evaluationComment: string;

  baselineEvaluatedByUser = false;

  showDialogConfirmation = false;

  messageDialog: string;

  evaluateDecision: string;

  selectedComment = '';

  showCommentDialog = false;

  isLoading = false;

  formIsSaving = false;

  tripleConstraintsTree: Array<any>;

  treeShouldStartExpanded: boolean = true;

  constructor(
    private actRouter: ActivatedRoute,
    private baselineSrv: BaselineService,
    private responsiveSrv: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private translateSrv: TranslateService,
    private router: Router,
  ) {
    this.actRouter.queryParams.subscribe(({ id }) => {
      this.idBaseline = +id;
    });
    this.responsiveSrv.observable
      .pipe(takeUntil(this.$destroy))
      .subscribe((value) => (this.responsive = value));
    this.translateSrv.onLangChange
      .pipe(takeUntil(this.$destroy))
      .subscribe(async () => {
        setTimeout(() => this.setLanguage(), 200);
        await this.ngOnInit();
      });
  }

  async ngOnInit() {
    this.setLanguage();
    await this.loadPropertiesBaseline();
    await this.setBreadcrumb();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en';
  }

  async setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'changeControlBoard',
        routerLink: ['/ccbmember-baselines-view'],
        info: 'baselines',
      },
      {
        key: 'baseline',
        info: this.baseline.name,
      },
    ]);
  }

  async loadPropertiesBaseline() {
    this.isLoading = true;
    const result = await this.baselineSrv.getBaselineView(this.idBaseline);
    if (result.success) {
      this.baseline = result.data;
      this.loadChartScheduleValues();
      this.checkEvaluation();
      this.assembleBreakdownTree(this.baseline.tripleConstraintBreakdown, this.baseline.officeUnitMeasures);

      this.isLoading = false;
    }
  }

  checkEvaluation() {
    this.baselineEvaluatedByUser =
      this.baseline.evaluations &&
      this.baseline.evaluations.filter(
        (evaluation) => !!evaluation.myEvaluation && !!evaluation.decision
      ).length > 0;
  }

  loadChartScheduleValues() {
    if (this.baseline && this.baseline.schedule) {
      const currentStartDate = moment(this.baseline.schedule?.currentStartDate, 'yyyy-MM-DD');
      const currentEndDate = moment(this.baseline.schedule?.currentEndDate, 'yyyy-MM-DD');
      const proposedStartDate = moment(this.baseline.schedule?.proposedStartDate, 'yyyy-MM-DD');
      const proposedEndDate = moment(this.baseline.schedule?.proposedEndDate, 'yyyy-MM-DD');

      const startDate =
        this.baseline.schedule?.currentStartDate &&
        this.baseline.schedule?.proposedStartDate
          ? currentStartDate.isBefore(proposedStartDate)
            ? currentStartDate
            : proposedStartDate
          : this.baseline.schedule?.currentStartDate
          ? currentStartDate
          : proposedStartDate;

      const endDate =
        this.baseline.schedule?.currentEndDate &&
        this.baseline.schedule?.proposedEndDate
          ? currentEndDate.isAfter(proposedEndDate)
            ? currentEndDate
            : proposedEndDate
          : this.baseline.schedule?.currentEndDate
          ? currentEndDate
          : proposedEndDate;

      this.baseline.schedule.monthsInPeriod = Number((endDate.diff(startDate, 'days') / 30).toFixed(1));
      this.baseline.schedule.difStartCurrentDateAndStartProposedDate = Number(
        (currentStartDate.diff(proposedStartDate, 'days') / 30).toFixed(1)
      );
      this.baseline.schedule.difEndCurrentDateAndEndProposedDate = Number(
        (currentEndDate.diff(proposedEndDate, 'days') / 30).toFixed(1)
      );

      this.baseline.schedule.marginHightProposedBar =
        this.baseline.schedule.difEndCurrentDateAndEndProposedDate > 0
          ? this.baseline.schedule.monthsInPeriod > 0
            ? (100 / this.baseline.schedule.monthsInPeriod) *
              this.baseline.schedule.difEndCurrentDateAndEndProposedDate
            : 0
          : 0;
      this.baseline.schedule.marginLeftCurrentBar =
        this.baseline.schedule.difStartCurrentDateAndStartProposedDate > 0
          ? this.baseline.schedule.monthsInPeriod > 0
            ? (100 / this.baseline.schedule.monthsInPeriod) *
              this.baseline.schedule.difStartCurrentDateAndStartProposedDate
            : 0
          : 0;
    }
  }

  handleEvaluate(decision: string) {
    this.messageDialog =
      decision === 'APPROVED'
        ? !this.baseline.cancelation
          ? `${this.translateSrv.instant(
              'messages.confirmeApproveBaselineMessage'
            )}`
          : `${this.translateSrv.instant(
              'messages.confirmeApproveCancellingProjectMessage'
            )}`
        : !this.baseline.cancelation
        ? `${this.translateSrv.instant(
            'messages.confirmeRejectBaselineMessage'
          )}`
        : `${this.translateSrv.instant(
            'messages.confirmeRejectCancellingProjectMessage'
          )}`;
    this.showDialogConfirmation = true;
    setTimeout(() => {
      this.buttonNo.nativeElement.focus();
    });
    this.evaluateDecision = decision;
  }

  async submitEvaluate() {
    this.formIsSaving = true;
    this.showDialogConfirmation = false;
    this.messageDialog = null;
    const result = await this.baselineSrv.evaluateBaseline(this.idBaseline, {
      decision: this.evaluateDecision,
      comment: this.evaluationComment,
    });
    this.formIsSaving = false;
    if (result.success) {
      await this.router.navigate(['ccbmember-baselines-view']);
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

  assembleBreakdownTree(workpacks: Array<ITripleConstraintBreakdown>, unitsOfMeasurement: Array<UnitMeasure>) {
    // A função abaixo serve para obter o nível de precisão baseado na unidade de medida
    const getPrecisionFactor = (unit: string): number => {
      if (!unit) return 2;

      const unitRef = unitsOfMeasurement.find((el) => el.name === unit);
      if (unitRef) return unitRef.precision;

      return 2;
    };

    // A função abaixo serve para criar os objetos de Marcos Críticos e Entregas que serão inseridos na árvore
    const buildMilestonesAndDeliveries = (
      childs: Array<ITripleConstraintBreakdown>  = []
    ): {
      milestoneTitleObject?: any;
      deliveryTitleObject?: any;
    } => {
      const milestones = childs.filter(
        (el) => el.type === TypeWorkpackEnumWBS.Milestone
      );
      const deliveries = childs.filter(
        (el) => el.type === TypeWorkpackEnumWBS.Deliverable
      );

      let finalResult: {
        milestoneTitleObject?: any;
        deliveryTitleObject?: any;
      } = {};

      if (milestones.length > 0) {
        const milestoneTitleObject = {
          label: 'Marcos críticos',
          icon: 'fas fa-flag',
          children: [],
          property: 'title',
          expanded: this.treeShouldStartExpanded,
        };

        milestones.forEach((milestone) => {
          const milestoneObject = {
            label: milestone.name,
            icon: milestone.fontIcon,
            children: [],
            property: 'value',
            idWorkpack: milestone.idWorkpack,
            costDetails: milestone?.costDetails,
            scheduleDetails: milestone?.scheduleDetails,
            scopeDetails: milestone?.scopeDetails,
            workpackStatus: milestone?.workpackStatus,
            precisionFactor: getPrecisionFactor(milestone.scopeDetails?.unitName),
            statusDisplayMessage: milestone?.workpackStatus || undefined,
            shouldDisplayBothDates: (
              (
                milestone?.scheduleDetails &&
                milestone.scheduleDetails?.currentDate &&
                milestone.scheduleDetails?.proposedDate &&
                !milestone.scheduleDetails.currentDate.match(milestone.scheduleDetails.proposedDate)
              ) ||
              (
                milestone.scheduleDetails?.currentDate &&
                !milestone.scheduleDetails?.proposedDate
              ) ||
              (
                !milestone.scheduleDetails?.currentDate &&
                milestone.scheduleDetails?.proposedDate
              )
            )
          };

          milestoneTitleObject.children.push(milestoneObject);
        });

        finalResult = {
          ...finalResult,
          milestoneTitleObject,
        };
      }

      if (deliveries.length > 0) {
        const deliveryTitleObject = {
          label: 'Entregas',
          icon: 'fas fa-boxes',
          children: [],
          property: 'title',
          expanded: this.treeShouldStartExpanded,
        };

        deliveries.forEach((delivery) => {
          const deliveryObject = {
            label: delivery.name,
            icon: delivery.fontIcon,
            children: [],
            property: 'value',
            idWorkpack: delivery.idWorkpack,
            classification: delivery?.workpackStatus || '',
            costDetails: delivery?.costDetails,
            scheduleDetails: delivery?.scheduleDetails,
            scopeDetails: delivery?.scopeDetails,
            workpackStatus: delivery?.workpackStatus,
            precisionFactor: getPrecisionFactor(delivery?.scopeDetails.unitName),
            statusDisplayMessage: delivery?.workpackStatus || undefined,
            shouldDisplayBothDates: (
              (
                delivery?.scheduleDetails &&
                delivery.scheduleDetails?.currentDate &&
                delivery.scheduleDetails?.proposedDate &&
                !delivery.scheduleDetails.currentDate.match(delivery.scheduleDetails.proposedDate)
              ) ||
              (
                delivery.scheduleDetails?.currentDate &&
                !delivery.scheduleDetails?.proposedDate
              ) ||
              (
                !delivery.scheduleDetails?.currentDate &&
                delivery.scheduleDetails?.proposedDate
              )
            )
          };

          deliveryTitleObject.children.push(deliveryObject);
        });

        finalResult = {
          ...finalResult,
          deliveryTitleObject,
        };
      }

      return finalResult;
    };

    const etapasTitleObject = {
      label: 'Etapas',
      icon: 'fas fa-tasks',
      children: [],
      property: 'title',
      expanded: this.treeShouldStartExpanded,
    };

    workpacks.forEach((etapa) => {
      const etapaObject = {
        label: etapa.name,
        icon: etapa.fontIcon,
        children: [],
        property: 'subtitle',
        expanded: this.treeShouldStartExpanded,
      };

      etapasTitleObject.children.push(etapaObject);

      if (etapa.children) {
        if (
          etapa.children.some(
            (el) => el.type === 'Organizer' && el.modelName === 'Subetapa'
          )
        ) {
          const subetapaTitleObject = {
            label: 'Subetapas',
            icon: 'fas fa-tasks',
            children: [],
            property: 'title',
            expanded: this.treeShouldStartExpanded,
          };

          etapaObject.children.push(subetapaTitleObject);

          etapa.children.forEach((subetapa) => {
            const subetapaObject = {
              label: subetapa.name,
              icon: subetapa.fontIcon,
              children: [],
              property: 'subtitle',
              expanded: this.treeShouldStartExpanded,
            };

            subetapaTitleObject.children.push(subetapaObject);

            const milestonesAndDeliveries = buildMilestonesAndDeliveries(
              subetapa.children
            );
            if (milestonesAndDeliveries.milestoneTitleObject)
              subetapaObject.children.push(
                milestonesAndDeliveries.milestoneTitleObject
              );
            if (milestonesAndDeliveries.deliveryTitleObject)
              subetapaObject.children.push(
                milestonesAndDeliveries.deliveryTitleObject
              );
            // Nesse ponto, o TitleObject dos Marcos e Entregas já estão carregados com os Marcos e as Entregas
          });
        } else {
          const milestonesAndDeliveries = buildMilestonesAndDeliveries(
            etapa.children
          );
          if (milestonesAndDeliveries.milestoneTitleObject)
            etapaObject.children.push(
              milestonesAndDeliveries.milestoneTitleObject
            );
          if (milestonesAndDeliveries.deliveryTitleObject)
            etapaObject.children.push(
              milestonesAndDeliveries.deliveryTitleObject
            );
          // Nesse ponto, o TitleObject dos Marcos e Entregas já estão carregados com os Marcos e as Entregas
        }
      }
    });

    this.tripleConstraintsTree = [etapasTitleObject];
  }
}
