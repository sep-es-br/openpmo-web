import { Component, OnDestroy, Output, EventEmitter } from '@angular/core';
import {
  IWorkpackBreakdownStructure,
} from 'src/app/shared/interfaces/IWorkpackBreakdownStructure';
import { TypeWorkpackEnumWBS } from 'src/app/shared/enums/TypeWorkpackEnum';
import { Subject } from 'rxjs';
import { MilestoneStatusEnum } from 'src/app/shared/enums/MilestoneStatusEnum';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { BreakdownStructureService } from 'src/app/shared/services/breakdown-structure.service';
import { ActivatedRoute, Router } from '@angular/router';
import { IWorkpackParams } from 'src/app/shared/interfaces/IWorkpackDataParams';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { WorkpackBreadcrumbStorageService } from 'src/app/shared/services/workpack-breadcrumb-storage.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { JournalService } from 'src/app/shared/services/journal.service';

@Component({
  selector: 'app-workpack-section-wbs',
  templateUrl: './workpack-section-wbs.component.html',
  styleUrls: ['./workpack-section-wbs.component.scss']
})
export class WorkpackSectionWBSComponent implements OnDestroy {

  @Output() onHasWBS = new EventEmitter();
  typeWorkpackEnum = TypeWorkpackEnumWBS;
  wbsTree: any = [];
  language: string;
  $destroy = new Subject();
  attentionMilestone = false;
  milestoneStatusEnum = MilestoneStatusEnum;
  label;
  isLoading = false;
  idPlan: number;
  topPosLoading = 128;
  collapsed = true;
  workpackParams: IWorkpackParams;

  constructor(
    private breakdownStructureSrv: BreakdownStructureService,
    private translateSrv: TranslateService,
    private actRouter: ActivatedRoute,
    private route: Router,
    private workpackSrv: WorkpackService,
    private workpackBreadcrumbStorageSrv: WorkpackBreadcrumbStorageService,
    private breadcrumbSrv: BreadcrumbService,
    private journalSrv: JournalService
  ) {
    this.isLoading = true;
    this.actRouter.queryParams.subscribe(async({ idPlan }) => {
      this.idPlan = idPlan && +idPlan;
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 500);
    });
    this.breakdownStructureSrv.observableResetBreakdownStructure.pipe(takeUntil(this.$destroy)).subscribe(reset => {
      if (reset) {
        this.loadBreakdownStructureData();
      }
    });
  }

  ngOnDestroy(): void {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

  async handleCollapseAll(collapsed: boolean) {
    this.collapsed = collapsed;
    if (collapsed) {
      this.breakdownStructureSrv.collapseAll();
    } else {
      this.isLoading = true;
      this.breakdownStructureSrv.loadBWSExpandedAll(this.workpackParams.idWorkpack);
    }
  }

  loadBreakdownStructureData() {
    this.setLanguage();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    const { wbsTree, loading } = this.breakdownStructureSrv.getWBSTree();
    this.wbsTree = wbsTree;
    this.isLoading = loading;
  }

  nodeCollapse(nodeList, level) {
    level++;
    return nodeList ? nodeList.map(node => ({
      ...node,
      expanded: level <= 1,
      children: node.children ? this.nodeCollapse(node.children, level) : []
    })) : [];
  }

  async nodeExpand(event) {
    this.getTopPosLoading();
    this.isLoading = true;
    await this.breakdownStructureSrv.nodeExpand(event);
    this.isLoading = false;
  }

  getTopPosLoading() {
    const appWbs = document.querySelector('.app-wbs');
    if (appWbs && appWbs.clientHeight > 300) {
      this.topPosLoading = appWbs?.clientHeight / 2;
    }
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en';
  }

  validateShowTripleConstraintCost(properties: IWorkpackBreakdownStructure) {
    if (properties?.dashboardData?.tripleConstraint?.cost &&
      properties?.dashboardData?.tripleConstraint?.cost?.foreseenValue > 0) {
      return true;
    }
    return false;
  }

  validateShowTripleConstraintSchedule(properties: IWorkpackBreakdownStructure) {
    if (properties?.dashboardData?.tripleConstraint?.schedule &&
      properties?.dashboardData?.tripleConstraint?.schedule?.foreseenStartDate !== null) {
      return true;
    }
    return false;
  }

  validateShowTripleConstraintScope(properties: IWorkpackBreakdownStructure) {
    if (properties?.dashboardData?.tripleConstraint?.scope &&
      properties?.dashboardData?.tripleConstraint?.scope?.foreseenValue > 0) {
      return true;
    }
    return false;
  }

  navigateToWorkpack(item) {
    if (item.idWorkpack === this.workpackParams.idWorkpack) {
      return;
    }
    this.setWorkpackBreadcrumbStorage(item.idWorkpack, this.idPlan);
    this.route.navigate(['/workpack'], {
      queryParams: {
        id: item.idWorkpack,
        idWorkpaModelLinked: item.idWorkpaModelLinked,
        idPlan: this.idPlan
      }
    });
  }

  async setWorkpackBreadcrumbStorage(idWorkpack, idPlan) {
    const breadcrumbItems = await this.workpackBreadcrumbStorageSrv.getBreadcrumbs(idWorkpack, idPlan);
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
      journalInformation.evidences = result.data.evidences && result.data.evidences.map( evidence => {
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
        return {
          ...evidence,
          isImg,
          icon
        };
      });
      journalInformation.loading = false;
    }
  }

  shouldDisplayWarningStyles(node: any): {
    displayWarningIcon: boolean;
    displayColoredText: boolean;
    displayDashedText: boolean;
    textTooltipMessages: Array<string>;
  } {
    if (
      !node.classifications ||
      node.workpackType === TypeWorkpackEnumWBS.Portfolio ||
      node.workpackType === TypeWorkpackEnumWBS.Program
    ) {
      return {
        displayWarningIcon: false,
        displayColoredText: false,
        displayDashedText: false,
        textTooltipMessages: [],
      };
    } else {
      if (
        node.workpackType === TypeWorkpackEnumWBS.Project ||
        node.workpackType === TypeWorkpackEnumWBS.Organizer
      ) {
        if (
          node.classifications.deletedWithBaseline ||
          node.classifications.isNew ||
          node.classifications.noSchedule ||
          node.classifications.noScope ||
          node.classifications.toCancel
        ) {
          return {
            displayWarningIcon: true,
            displayColoredText: true,
            displayDashedText: false,
            textTooltipMessages: [
              'workpack-eap-alert-pending-items',
              // 'Verifique itens pendentes abaixo',
            ],
          };
        } else {
          return {
            displayWarningIcon: false,
            displayColoredText: false,
            displayDashedText: false,
            textTooltipMessages: [],
          };
        }
      } else if (
        node.workpackType === TypeWorkpackEnumWBS.Deliverable ||
        node.workpackType === TypeWorkpackEnumWBS.Milestone
      ) {
        const messages = [];

        if (node.classifications.deletedWithBaseline) {
          // messages.push('Este item foi excluído');
          messages.push('workpack-eap-alert-deleted-item');
        }
        if (node.classifications.isNew) {
          // messages.push('Item novo fora da Linha de Base ativa');
          messages.push('workpack-eap-alert-new-item');
        }
        if (node.classifications.noSchedule) {
          // messages.push('Entrega sem Cronograma');
          messages.push('workpack-eap-alert-no-schedule');
        }
        if (
          !node.classifications.noSchedule &&
          node.classifications.noScope
        ) {
          // messages.push('Entrega sem escopo estimado (físico = 0)');
          messages.push('workpack-eap-alert-no-scope');
        }
        if (node.classifications.toCancel) {
          // messages.push('Item a cancelar. Requer aprovação de nova Linha de Base');
          messages.push('workpack-eap-alert-to-cancel');
        }

        return {
          displayWarningIcon: messages.length > 0,
          displayColoredText: messages.length > 0,
          displayDashedText: false,
          textTooltipMessages: messages,
        };
      }
    }
  }

  shouldDisplayNewTag(node: any) {
    return (
      (
        node.workpackType === TypeWorkpackEnumWBS.Deliverable ||
        node.workpackType === TypeWorkpackEnumWBS.Milestone
      ) &&
      node.classifications &&
      node.classifications.isNew
    );
  }

  parseTooltipTranslatedStrings(messages: Array<string>): string {
    if (messages && messages.length > 0) {
      const finalMessagesObj = this.translateSrv.instant(messages);
      const finalMessages = Object.values(finalMessagesObj);
      if (finalMessages.length > 1) { finalMessages[0] = `- ${finalMessages[0]}`; }

      return finalMessages.join('\n- ');
    }

    return '';
  }
}
