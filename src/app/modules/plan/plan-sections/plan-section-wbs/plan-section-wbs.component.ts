import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MilestoneStatusEnum } from 'src/app/shared/enums/MilestoneStatusEnum';
import { TypeWorkpackEnumWBS } from 'src/app/shared/enums/TypeWorkpackEnum';
import {
  DeliverableStatus,
  ProjectStatus,
  WorkpackStatusConfig,
  getWorkpackStatusConfigByStatus,
} from 'src/app/shared/enums/WorkpackStatusEnum';
import { IWorkpackBreakdownStructure } from 'src/app/shared/interfaces/IWorkpackBreakdownStructure';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { JournalService } from 'src/app/shared/services/journal.service';
import { PlanBreakdownStructureService } from 'src/app/shared/services/plan-breakdown-structure.service';
import { WorkpackBreadcrumbStorageService } from 'src/app/shared/services/workpack-breadcrumb-storage.service';

@Component({
  selector: 'app-plan-section-wbs',
  templateUrl: './plan-section-wbs.component.html',
  styleUrls: ['./plan-section-wbs.component.scss'],
})
export class PlanSectionWBSComponent implements OnChanges, OnDestroy {
  @Input() planId: number;

  @Output() onHasWBS = new EventEmitter<boolean>();

  typeWorkpackEnum = TypeWorkpackEnumWBS;

  wbsTree: any[] = [];

  language: string;

  attentionMilestone = false;

  milestoneStatusEnum = MilestoneStatusEnum;

  label;

  isLoading = false;

  topPosLoading = 128;

  collapsed = true;

  private $destroy = new Subject();

  constructor(
    private planBreakdownStructureSrv: PlanBreakdownStructureService,
    private translateSrv: TranslateService,
    private route: Router,
    private workpackBreadcrumbStorageSrv: WorkpackBreadcrumbStorageService,
    private breadcrumbSrv: BreadcrumbService,
    private journalSrv: JournalService
  ) {
    this.translateSrv.onLangChange
      .pipe(takeUntil(this.$destroy))
      .subscribe(() => setTimeout(() => this.setLanguage(), 500));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.planId?.currentValue) {
      this.loadPlanBreakdownStructure();
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async loadPlanBreakdownStructure() {
    this.isLoading = true;
    this.collapsed = true;
    this.setLanguage();
    this.wbsTree = await this.planBreakdownStructureSrv.loadPlanBreakdownStructure(
      this.planId,
      false
    );
    this.isLoading = false;
    this.onHasWBS.emit(this.wbsTree.length > 0);
  }

  async handleCollapseAll(collapsed: boolean) {
    this.collapsed = collapsed;
    this.isLoading = true;
    this.wbsTree = collapsed
      ? this.planBreakdownStructureSrv.collapseAllPlan()
      : await this.planBreakdownStructureSrv.loadExpandedAll();
    this.isLoading = false;
  }

  async nodeExpand(event) {
    this.getTopPosLoading();
    this.isLoading = true;
    await this.planBreakdownStructureSrv.expandPlanNode(event);
    this.isLoading = false;
  }

  getTopPosLoading() {
    const appWbs = document.querySelector('.app-wbs');
    if (appWbs && appWbs.clientHeight > 300) {
      this.topPosLoading = appWbs.clientHeight / 2;
    }
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en';
  }

  validateShowTripleConstraintCost(properties: IWorkpackBreakdownStructure) {
    return !!properties?.dashboardData?.tripleConstraint?.cost &&
      properties.dashboardData.tripleConstraint.cost.foreseenValue > 0;
  }

  validateShowTripleConstraintSchedule(properties: IWorkpackBreakdownStructure) {
    return !!properties?.dashboardData?.tripleConstraint?.schedule &&
      properties.dashboardData.tripleConstraint.schedule.foreseenStartDate !== null;
  }

  validateShowTripleConstraintScope(properties: IWorkpackBreakdownStructure) {
    return !!properties?.dashboardData?.tripleConstraint?.scope &&
      properties.dashboardData.tripleConstraint.scope.foreseenValue > 0;
  }

  navigateToWorkpack(item) {
    if (!item?.idWorkpack) {
      return;
    }
    this.setWorkpackBreadcrumbStorage(item.idWorkpack, this.planId);
    this.route.navigate(['/workpack'], {
      queryParams: {
        id: item.idWorkpack,
        idWorkpackModelLinked: item.idWorkpackModelLinked,
        idPlan: this.planId,
      },
    });
  }

  async setWorkpackBreadcrumbStorage(idWorkpack, idPlan) {
    const breadcrumbItems = await this.workpackBreadcrumbStorageSrv.getBreadcrumbs(
      idWorkpack,
      idPlan
    );
    this.breadcrumbSrv.setBreadcrumbStorage(breadcrumbItems);
  }

  async handleShowJournalInformation(journalInformation) {
    journalInformation.loading = true;
    const result = await this.journalSrv.GetById(journalInformation.id);
    if (result.success) {
      journalInformation.information = result.data.information;
      journalInformation.author = result.data.author;
      journalInformation.dateInformation = result.data.date;
      journalInformation.workpack = result.data.workpack;
      journalInformation.evidences = result.data.evidences?.map(evidence => {
        const isImg = evidence.mimeType.includes('image');
        let icon: string;
        switch (evidence.mimeType) {
          case 'application/pdf':
            icon = 'far fa-file-pdf';
            break;
          case 'text/csv':
            icon = 'fas fa-file-csv';
            break;
          case 'application/msword':
            icon = 'far fa-file-word';
            break;
          case 'application/vnd.ms-excel':
          case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            icon = 'far fa-file-excel';
            break;
          case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
          case 'application/vnd.ms-powerpoint':
            icon = 'far fa-file-powerpoint';
            break;
          default:
            icon = 'far fa-file';
            break;
        }
        return { ...evidence, isImg, icon };
      });
    }
    journalInformation.loading = false;
  }

  shouldDisplayWarningStyles(node: any): {
    displayWarningIcon: boolean;
    displayColoredText: boolean;
    displayDashedText: boolean;
    textTooltipMessages: string[];
  } {
    const noWarning = {
      displayWarningIcon: false,
      displayColoredText: false,
      displayDashedText: false,
      textTooltipMessages: [],
    };

    if (!node.classifications || [
      TypeWorkpackEnumWBS.Portfolio,
      TypeWorkpackEnumWBS.Program,
    ].includes(node.workpackType)) {
      return noWarning;
    }

    if (node.workpackType === TypeWorkpackEnumWBS.Organizer &&
      node.classifications.deletedWithBaseline &&
      node.children?.length > 0 &&
      node.children.every(child => child.workpacks.length > 0 && child.workpacks.every(
        workpack => !workpack.classifications.deletedWithBaseline &&
          !workpack.classifications.isNew &&
          !workpack.classifications.noSchedule &&
          !workpack.classifications.noScope &&
          !workpack.classifications.toCancel
      ))) {
      return {
        ...noWarning,
        displayWarningIcon: true,
        displayColoredText: true,
        textTooltipMessages: ['workpack-eap-alert-deleted-items-below'],
      };
    }

    if ([TypeWorkpackEnumWBS.Project, TypeWorkpackEnumWBS.Organizer].includes(node.workpackType)) {
      const hasPendingItems = node.classifications.deletedWithBaseline ||
        node.classifications.isNew ||
        node.classifications.noSchedule ||
        node.classifications.noScope ||
        node.classifications.toCancel;
      return hasPendingItems ? {
        ...noWarning,
        displayWarningIcon: true,
        displayColoredText: true,
        textTooltipMessages: ['workpack-eap-alert-pending-items'],
      } : noWarning;
    }

    const messages = [];
    if (node.classifications.deletedWithBaseline) messages.push('workpack-eap-alert-deleted-item');
    if (node.classifications.isNew) messages.push('workpack-eap-alert-new-item');
    if (node.classifications.noSchedule) messages.push('workpack-eap-alert-no-schedule');
    if (!node.classifications.noSchedule && node.classifications.noScope) messages.push('workpack-eap-alert-no-scope');
    if (node.classifications.toCancel) messages.push('workpack-eap-alert-to-cancel');
    return {
      ...noWarning,
      displayWarningIcon: messages.length > 0,
      displayColoredText: messages.length > 0,
      textTooltipMessages: messages,
    };
  }

  shouldDisplayNewTag(node: any) {
    return [TypeWorkpackEnumWBS.Deliverable, TypeWorkpackEnumWBS.Milestone].includes(node.workpackType) &&
      node.classifications?.isNew;
  }

  parseTooltipTranslatedStrings(messages: string[]): string {
    if (!messages?.length) {
      return '';
    }
    const translated = Object.values(this.translateSrv.instant(messages));
    if (translated.length > 1) {
      translated[0] = `- ${translated[0]}`;
    }
    return translated.join('\n- ');
  }

  getWorkpackStatusConfig(status: ProjectStatus | DeliverableStatus): WorkpackStatusConfig {
    return getWorkpackStatusConfigByStatus(status);
  }
}
