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
    const firstEAPElement = this.wbsTree[0];

    if (
      firstEAPElement.dashboard &&
      firstEAPElement.dashboard.tripleConstraint.scheduleForeseenStartDate &&
      firstEAPElement.dashboard.tripleConstraint.scheduleForeseenEndDate
    ) {
      // Habilita os alertas apenas se o primeiro elemento da hierarquia houver cronograma
      // let tooltipMessages = ['Projeto não possui Linha de Base ativa'];
      let tooltipMessages = ['workpack-section-wbs-alert-project-without-baseline'];

      if (
        node &&
        (node.workpackType === TypeWorkpackEnumWBS.Program) ||
        (
          node.workpackType === TypeWorkpackEnumWBS.Organizer &&
          node.workpackModels.some(
            (wpck: any) =>
              wpck.workpackModelType === 'Program' ||
              wpck.workpackModelType === 'Project' ||
              wpck.workpackModelName === 'Subprogramas'
            )
        )
      ) {
        // É um node de Programa ou Área Temática
        return {
          displayWarningIcon: false,
          displayColoredText: false,
          displayDashedText: false,
          textTooltipMessages: [],
        };
      } else if (node && node.workpackType === TypeWorkpackEnumWBS.Milestone) {
        if (node.milestoneStatus === 'NEW') {
          if (!node.hasActiveBaseline) {
            // Se o projeto não possui linha de base ativa, mantém o alerta nos Milestones
            tooltipMessages.push('workpack-section-wbs-alert-item-is-new');
          } else {
            tooltipMessages = ['workpack-section-wbs-alert-item-is-new'];
          }

          return {
            displayWarningIcon: true,
            displayColoredText: true,
            displayDashedText: false,
            textTooltipMessages: tooltipMessages,
          };
        } else if (node.milestoneStatus === 'CHANGED') {
          if (!node.hasActiveBaseline) {
            // Se o projeto não possui linha de base ativa, mantém o alerta nos Milestones
            // tooltipMessages.push('Este item foi reestruturado e requer um novo salvamento da linha de base no projeto');
            tooltipMessages.push('workpack-section-wbs-alert-item-was-changed');
          } else {
            // tooltipMessages = ['Este item foi reestruturado e requer um novo salvamento da linha de base no projeto'];
            tooltipMessages = ['workpack-section-wbs-alert-item-was-changed'];
          }

          return {
            displayWarningIcon: true,
            displayColoredText: true,
            displayDashedText: false,
            textTooltipMessages: tooltipMessages,
          };
        } else if (node.milestoneStatus === 'TO_CANCEL') {
          if (!node.hasActiveBaseline) {
            // tooltipMessages.push('Este item está \"a cancelar\" e requer um novo salvamento da linha de base no projeto');
            tooltipMessages.push('workpack-section-wbs-alert-item-to-cancel');
          } else {
            // tooltipMessages = ['Este item está \"a cancelar\" e requer um novo salvamento da linha de base no projeto'];
            tooltipMessages = ['workpack-section-wbs-alert-item-to-cancel'];
          }

          return {
            displayWarningIcon: true,
            displayColoredText: true,
            displayDashedText: true,
            textTooltipMessages: tooltipMessages,
          };
        }
      } else if (node && node.workpackType === TypeWorkpackEnumWBS.Deliverable) {
        if (node.deliverableStatus === 'NEW') {
          if (node?.dashboard?.tripleConstraint?.costActualValue > 0) {
            // tooltipMessages.push('Este item foi criado e requer um novo salvamento da linha de base no projeto');
            tooltipMessages.push('workpack-section-wbs-alert-item-new-valid-scope');
          } else {
            // tooltipMessages.push('Este item foi criado e requer validação de escopo');
            tooltipMessages.push('workpack-section-wbs-alert-item-new-invalid-scope');
          }
        } else if (node.deliverableStatus === 'CHANGED') {
          if (!node.hasActiveBaseline) {
            // Se o projeto não possui linha de base ativa, mantém o alerta nas Entregas
            // tooltipMessages.push('Este item foi reestruturado e requer um novo salvamento da linha de base no projeto');
            tooltipMessages.push('workpack-section-wbs-alert-item-was-changed');
          } else {
            // tooltipMessages = ['Este item foi reestruturado e requer um novo salvamento da linha de base no projeto'];
            tooltipMessages = ['workpack-section-wbs-alert-item-was-changed'];
          }

          return {
            displayWarningIcon: true,
            displayColoredText: true,
            displayDashedText: false,
            textTooltipMessages: tooltipMessages,
          };
        } else if (node.deliverableStatus === 'TO_CANCEL') {
          if (!node.hasActiveBaseline) {
            // tooltipMessages.push('Este item está \"a cancelar\" e requer um novo salvamento da linha de base no projeto');
            tooltipMessages.push('workpack-section-wbs-alert-item-to-cancel');
          } else {
            // tooltipMessages = ['Este item está \"a cancelar\" e requer um novo salvamento da linha de base no projeto'];
            tooltipMessages = ['workpack-section-wbs-alert-item-to-cancel'];
          }

          return {
            displayWarningIcon: true,
            displayColoredText: true,
            displayDashedText: true,
            textTooltipMessages: tooltipMessages,
          };
        }
      }

      if (node && node.hasActiveBaseline !== null && node.hasActiveBaseline === false) {
        // Se não há linha de base ativa

        return {
          displayWarningIcon: true,
          displayColoredText: true,
          displayDashedText: false,
          textTooltipMessages: tooltipMessages,
        };
      } else {
        return {
          displayWarningIcon: false,
          displayColoredText: false,
          displayDashedText: false,
          textTooltipMessages: [],
        };
      }
    } else {
      // Desabilita todos os alertas caso o primeiro elemento da hierarquia não possuir cronograma
      return {
        displayWarningIcon: false,
        displayColoredText: false,
        displayDashedText: false,
        textTooltipMessages: [],
      };
    }
  }

  parseTooltipTranslatedStrings(messages: Array<string>): string {
    if (messages && messages.length > 0) {
      const finalMessagesObj = this.translateSrv.instant(messages);
      const finalMessages = Object.values(finalMessagesObj);
      finalMessages[0] = `- ${finalMessages[0]}`;

      return finalMessages.join('\n- ');
    }

    return '';
  }
}
