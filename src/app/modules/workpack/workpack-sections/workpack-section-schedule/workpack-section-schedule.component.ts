import { IStepPost } from 'src/app/shared/interfaces/ISchedule';
import { IWorkpackData, IWorkpackParams } from '../../../../shared/interfaces/IWorkpackDataParams';
import { IMeasureUnit } from '../../../../shared/interfaces/IMeasureUnit';
import { IScheduleStepCardItem } from '../../../../shared/interfaces/IScheduleStepCardItem';
import { IScheduleDetail } from '../../../../shared/interfaces/ISchedule';
import { ScheduleService } from '../../../../shared/services/schedule.service';
import { IScheduleSection } from '../../../../shared/interfaces/ISectionWorkpack';
import { takeUntil } from 'rxjs/operators';
import { ResponsiveService } from '../../../../shared/services/responsive.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { TranslateService } from '@ngx-translate/core';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { Router } from '@angular/router';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef , Input} from '@angular/core';
import { Subject } from 'rxjs';
import * as moment from 'moment';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';
import { MenuItem, MessageService } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { ICartItemCostAssignment } from 'src/app/shared/interfaces/ICartItemCostAssignment';
import { DashboardService } from 'src/app/shared/services/dashboard.service';

@Component({
  selector: 'app-workpack-section-schedule',
  templateUrl: './workpack-section-schedule.component.html',
  styleUrls: ['./workpack-section-schedule.component.scss']
})
export class WorkpackSectionScheduleComponent implements OnInit, OnDestroy {

  @ViewChild('cardCostEditPanel') cardCostEditPanel: OverlayPanel;
  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  workpackParams: IWorkpackParams;
  workpackData: IWorkpackData;
  $destroy = new Subject();
  collapsePanelsStatus: boolean;
  responsive = false;
  sectionSchedule: IScheduleSection;
  schedule: IScheduleDetail;
  showDetails = true;
  unitMeansure: IMeasureUnit;
  editPermission: boolean;
  showTabview = false;
  costAssignmentsCardItemsEdited: ICartItemCostAssignment[] = [];
  indexCardEdited = 0;
  stepShow: IStepPost;
  showTypeDistributionDialog = false;
  typeDistribution = 'SIGMOIDAL';
  costAccountsConsumesStepChangeds = [];
  changedSteps: {
    changedGroupYear;
    changedIdStep;
  }[] = [];
  spreadEvent;
  spreadMulticost = false;
  sectionActive = false;
  formIsSaving = false;

  constructor(
    private router: Router,
    private workpackSrv: WorkpackService,
    public  translateSrv: TranslateService,
    private configDataViewSrv: ConfigDataViewService,
    private responsiveSrv: ResponsiveService,
    private scheduleSrv: ScheduleService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService,
    private messageSrv: MessageService,
    private dashboardSrv: DashboardService
  ) {
    
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(responsive => this.responsive = responsive);
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.sectionSchedule = this.sectionSchedule && Object.assign({}, {
        ...this.sectionSchedule,
        cardSection: {
          ...this.sectionSchedule.cardSection,
          initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus
        }
      });
    });
    this.sectionSchedule = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: 'schedule',
        collapseble: this.showTabview ? false : true,
        isLoading: true,
        initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus,
      }
    };
    this.scheduleSrv.observableResetSchedule.pipe(takeUntil(this.$destroy)).subscribe(reset => {
      if (reset) {
        this.loadScheduleData();
      }
    });
  }

  ngOnInit(): void {
  }

  loadScheduleData() {
    const {
      workpackParams,
      workpackData,
      schedule,
      loading
    } = this.scheduleSrv.getScheduleData();
    this.workpackParams = workpackParams;
    this.workpackData = workpackData;
    this.schedule = schedule;
    this.sectionActive = workpackData && !!workpackData.workpack && !!workpackData.workpack.id  &&
      workpackData.workpackModel && workpackData.workpackModel.scheduleSessionActive;
    if (!loading) this.loadScheduleSession();
  }

  async loadScheduleSession() {
    if (!this.sectionActive) return;
    this.editPermission = this.workpackSrv.getEditPermission();
    this.unitMeansure = this.workpackSrv.getUnitMeansure();
    if (this.schedule) {
      if (this.unitMeansure && !this.unitMeansure.precision) {
        this.unitMeansure.precision = 0;
      }
      const groupStep = this.schedule.groupStep.map((group, groupIndex, groupArray) => {
        const cardItemSection = group.steps.map((step, stepIndex, stepArray) => ({
          type: 'listStep',
          editPermission: !!this.editPermission && !this.workpackData.workpack.canceled,
          stepName: new Date(step.periodFromStart + 'T00:00:00'),
          menuItems: (groupIndex === 0 && stepIndex === 0) ? [{
            label: this.translateSrv.instant('properties'),
            icon: 'fas fa-edit',
            command: () => this.editScheduleStep(step.id, this.unitMeansure.name, this.unitMeansure.precision, 'start'),
            disabled: !this.editPermission || !!this.workpackData.workpack.canceled
          }] : ((groupIndex === groupArray.length - 1 && stepIndex === stepArray.length - 1) ?
            [{
              label: this.translateSrv.instant('properties'),
              icon: 'fas fa-edit',
              command: () => this.editScheduleStep(step.id, this.unitMeansure.name, this.unitMeansure.precision, 'end'),
              disabled: !this.editPermission || !!this.workpackData.workpack.canceled
            }] : [{
              label: this.translateSrv.instant('properties'),
              icon: 'fas fa-edit',
              command: () => this.editScheduleStep(step.id, this.unitMeansure.name, this.unitMeansure.precision, 'step'),
              disabled: !this.editPermission || !!this.workpackData.workpack.canceled
            }]),
          stepOrder: (groupIndex === 0 && stepIndex === 0) ? 'start' :
            ((groupIndex === groupArray.length - 1 && stepIndex === stepArray.length - 1) ? 'end' : 'step'),
          unitPlanned: step.plannedWork ? step.plannedWork : 0,
          unitActual: step.actualWork ? step.actualWork : 0,
          unitBaseline: step.baselinePlannedWork ? step.baselinePlannedWork : 0,
          unitProgressBar: {
            total: step.plannedWork,
            progress: step.actualWork,
            color: '#FF8C00',
          },
          costPlanned: step.consumes?.reduce((total, v) => (total + (v.plannedCost ? v.plannedCost : 0)), 0),
          costActual: step.consumes?.reduce((total, v) => (total + (v.actualCost ? v.actualCost : 0)), 0),
          baselinePlannedCost: step.consumes?.reduce((total, v) => (total + (v.baselinePlannedCost ? v.baselinePlannedCost : 0)), 0),
          costProgressBar: {
            total: (step.consumes?.reduce((total, v) => (total + (v.plannedCost ? v.plannedCost : 0)), 0)),
            progress: step.consumes?.reduce((total, v) => (total + (v.actualCost ? v.actualCost : 0)), 0),
            color: '#44B39B'
          },
          unitName: this.unitMeansure && this.unitMeansure.name,
          unitPrecision: this.unitMeansure && this.unitMeansure.precision,
          idStep: step.id,
          editCosts: step.consumes && step.consumes.length === 1 ? true : false,
          multipleCosts: step.consumes && step.consumes.length > 1 ? true : false,
        }));
        const groupProgressBar = [
          {
            total: Number(group.planed.toFixed(this.unitMeansure.precision)),
            progress: Number(group.actual.toFixed(this.unitMeansure.precision)),
            labelTotal: 'planned',
            labelProgress: 'actual',
            valueUnit: this.unitMeansure && this.unitMeansure.name,
            color: 'rgba(236, 125, 49, 1)',
            type: 'scope'
          }
        ];
        if (group.planedCost > 0) {
          groupProgressBar.push({
            total: group.planedCost,
            progress: group.actualCost,
            labelTotal: 'planned',
            labelProgress: 'actual',
            valueUnit: 'currency',
            color: '#6cd3bd',
            type: 'cost'
          });
        }
        return {
          year: group.year,
          cardItemSection,
          groupProgressBar
        };
      });
      const startDate = this.schedule && new Date(this.schedule.start + 'T00:00:00');
      const endDate = this.schedule && new Date(this.schedule.end + 'T00:00:00');
      const startScheduleStep = !!this.editPermission && {
        type: 'newStart',
        stepOrder: 'newStart',
        unitName: this.unitMeansure.name,
        unitPrecision: this.unitMeansure.precision,
      };
      const endScheduleStep = !!this.editPermission && {
        type: 'newEnd',
        stepOrder: 'newEnd',
        unitName: this.unitMeansure.name,
        unitPrecision: this.unitMeansure.precision,
      };
      const initialDatePlanned = moment(startDate);
      const finalDatePlanned = moment(endDate);
      const daysToPlanned = finalDatePlanned.diff(initialDatePlanned, 'days');
      const dateActual = moment(new Date());
      const daysToNow = finalDatePlanned.isSameOrBefore(dateActual) ? finalDatePlanned.diff(initialDatePlanned, 'days') : dateActual.diff(initialDatePlanned, 'days');
      const baselineStartDate = this.schedule && new Date(this.schedule.baselineStart + 'T00:00:00');
      const baselineEndDate = this.schedule && new Date(this.schedule.baselineEnd + 'T00:00:00');
      const baselineDaysPlanned = moment(baselineEndDate).diff(moment(baselineStartDate), 'days');
      this.sectionSchedule = {
        cardSection: {
          toggleable: false,
          isLoading: false,
          initialStateToggle: false,
          cardTitle: this.showTabview ? '' : 'schedule',
          collapseble: this.showTabview ? false : true,
          initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus,
          headerDates: this.schedule && {
            startDate,
            endDate
          },
          progressBarValues: [
            {
              total: Number(this.schedule.planed.toFixed(this.unitMeansure.precision)),
              progress: Number(this.schedule.actual.toFixed(this.unitMeansure.precision)),
              labelTotal: 'planned',
              labelProgress: 'actual',
              valueUnit: this.unitMeansure && this.unitMeansure.name,
              color: 'rgba(236, 125, 49, 1)',
              barHeight: 17,
              baselinePlanned: Number(this.schedule.baselinePlaned.toFixed(this.unitMeansure.precision)),
              type: 'scope'
            },
            {
              total: this.schedule.planedCost,
              progress: this.schedule.actualCost,
              labelTotal: 'planned',
              labelProgress: 'actual',
              valueUnit: 'currency',
              color: '#6cd3bd',
              barHeight: 17,
              baselinePlanned: Number(this.schedule.baselineCost.toFixed(this.unitMeansure.precision)),
              type: 'cost'
            },
            {
              total: daysToPlanned,
              progress: daysToNow < 0 ? 0 : daysToNow,
              labelTotal: 'planned',
              labelProgress: 'actual',
              valueUnit: 'time',
              color: '#659ee1',
              barHeight: 17,
              baselinePlanned: baselineDaysPlanned,
              startDateBaseline: baselineStartDate,
              endDateBaseline: baselineEndDate,
              startDateTotal: startDate,
              endDateTotal: endDate,
              type: 'schedule'
            }
          ],
        },
        startScheduleStep,
        endScheduleStep,
        groupStep
      };
      if (this.sectionSchedule.groupStep && this.sectionSchedule.groupStep[0].cardItemSection) {
        this.sectionSchedule.groupStep[0].start = true;
        const idStartStep = this.sectionSchedule.groupStep[0].cardItemSection[0].idStep;
        if (!!this.editPermission) {
          this.sectionSchedule.groupStep[0].cardItemSection[0].menuItems.push({
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteScheduleStep(idStartStep),
            disabled: !this.editPermission || !!this.workpackData.workpack.canceled
          });
        }
        this.sectionSchedule.groupStep[0].cardItemSection[0].stepDay = startDate;
        const groupStepItems: IScheduleStepCardItem[] = [startScheduleStep];
        this.sectionSchedule.groupStep[0].cardItemSection.forEach(card => {
          groupStepItems.push(card);
        });
        this.sectionSchedule.groupStep[0].cardItemSection = Array.from(groupStepItems);
      }
      const groupLenght = this.sectionSchedule.groupStep && this.sectionSchedule.groupStep.length;
      if (this.sectionSchedule.groupStep && this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection) {
        this.sectionSchedule.groupStep[groupLenght - 1].end = true;
        const cardItemSectionLenght = this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection.length;
        if (this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection[cardItemSectionLenght - 1].stepOrder === 'end') {
          const idEndStep = this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection[cardItemSectionLenght - 1].idStep;
          if (!!this.editPermission) {
            this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection[cardItemSectionLenght - 1].menuItems.push({
              label: this.translateSrv.instant('delete'),
              icon: 'fas fa-trash-alt',
              command: (event) =>
                this.deleteScheduleStep(idEndStep),
              disabled: !this.editPermission || !!this.workpackData.workpack.canceled
            });
          }
        }
        this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection[cardItemSectionLenght - 1].stepDay = endDate;
        this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection.push(endScheduleStep);
      }
      this.sectionSchedule.cardSection.isLoading = false;
      return;
    } else {
      this.schedule = undefined;
    }
    this.sectionSchedule = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: 'schedule',
        collapseble: this.showTabview ? false : true,
        isLoading: false,
        initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus,
      }
    };
  }

  async handleNewSchedule() {
    this.router.navigate(
      ['workpack/schedule'],
      {
        queryParams: {
          idWorkpack: this.workpackParams.idWorkpack,
          unitMeansureName: this.unitMeansure?.name
        }
      }
    );
  }

  handleCreateNewStep(params) {
    this.router.navigate(['/workpack' , 'schedule', 'step' ], {
      queryParams: {
        ...params
      }
    });
  }

  handleShowDetails() {
    this.showDetails = !this.showDetails;
  }

  async handleDeleteSchedule() {
    const result = await this.scheduleSrv.DeleteSchedule(this.schedule.id, { useConfirm: true, message: this.translateSrv.instant('messages.deleteScheduleConfirmation') });
    if (result.success) {
      this.schedule = null;
      this.sectionSchedule.groupStep = null;
      this.workpackSrv.nextCanEditCheckCompleted(true);
      this.scheduleSrv.loadSchedule();
      this.workpackSrv.nextPendingChanges(false);
      this.saveButton.hideButton();
    }
  }

  editScheduleStep(idStep: number, unitName: string, unitPrecision: number, stepType: string) {
    this.router.navigate(
      ['workpack/schedule/step'],
      {
        queryParams: {
          id: idStep,
          stepType,
          unitName,
          unitPrecision
        }
      }
    );
  }

  async deleteScheduleStep(idStep: number) {
    const result = await this.scheduleSrv.DeleteScheduleStep(idStep);
    if (result.success) {
      this.scheduleSrv.loadSchedule();
    }
  }

  async saveStepChanged(groupYear: number, idStep: number) {
    const stepIsChangedBefore = this.changedSteps.find(step => step.changedIdStep === idStep);
    if (!stepIsChangedBefore) {
      this.changedSteps.push({
        changedGroupYear: groupYear,
        changedIdStep: idStep
      })
    }
    this.workpackSrv.nextPendingChanges(true);
    this.saveButton.showButton();
    // atualizando a progressBar de custo do ano
    const hasNegativeValues = this.checkNegativeValues();
    if (hasNegativeValues) {
      this.messageSrv.add({
        detail: this.translateSrv.instant('messages.scheduleCantHasNegativeValues'),
        severity: 'warn',
        summary: this.translateSrv.instant('atention')
      });
      this.saveButton.hideButton();
      return;
    }
    const groupIndex = this.sectionSchedule.groupStep.findIndex(group => group.cardItemSection.filter(item => item.idStep === idStep).length > 0);
    if (groupIndex > -1) {
      // atualizando a progressBar de custo do ano
      this.sectionSchedule.groupStep[groupIndex].groupProgressBar.forEach(group => {
        if (group.valueUnit === 'currency') {
          const groupTotalCost = this.sectionSchedule.groupStep[groupIndex].cardItemSection.filter(card => card.type === 'listStep')
            .reduce((total, step) => {
              return total + (step.costPlanned ? step.costPlanned : 0)
            }, 0);
          group.total = groupTotalCost;
          const groupProgressCost = this.sectionSchedule.groupStep[groupIndex].cardItemSection.filter(card => card.type === 'listStep')
            .reduce((total, step) => {
              return total + (step.costActual ? step.costActual : 0)
            }, 0);
          group.progress = groupProgressCost;
        }
        if (group.valueUnit !== 'currency' && group.valueUnit !== 'time') {
          const groupTotalUnit = this.sectionSchedule.groupStep[groupIndex].cardItemSection.filter(card => card.type === 'listStep')
            .reduce((total, step) => {
              return total + (step.unitPlanned ? step.unitPlanned : 0)
            }, 0);
          group.total = groupTotalUnit;
          const groupProgressUnit = this.sectionSchedule.groupStep[groupIndex].cardItemSection.filter(card => card.type === 'listStep')
            .reduce((total, step) => {
              return total + (step.unitActual ? step.unitActual : 0)
            }, 0);
          group.progress = groupProgressUnit;
        }
      });
    }
    // atualizando a progressBar de custo do schedule geral
    this.sectionSchedule.cardSection.progressBarValues.filter(progress => progress.valueUnit === 'currency').forEach((section, index) => {
      section.total = this.sectionSchedule.groupStep.reduce((total, group) => {
        const progressBarCost = group.groupProgressBar.find(progressBar => progressBar.valueUnit === 'currency');
        return total + (progressBarCost ? progressBarCost.total : 0);
      }, 0);
      section.progress = this.sectionSchedule.groupStep.reduce((total, group) => {
        const progressBarCost = group.groupProgressBar.find(progressBar => progressBar.valueUnit === 'currency');
        return total + (progressBarCost ? progressBarCost.progress : 0);
      }, 0);
    });
    this.sectionSchedule.cardSection.progressBarValues.filter(progress => progress.valueUnit !== 'currency' && progress.valueUnit !== 'time').forEach((section, index) => {
      section.total = this.sectionSchedule.groupStep.reduce((total, group) => {
        const progressBarUnit = group.groupProgressBar.find(progressBar => progressBar.valueUnit !== 'currency' && progressBar.valueUnit !== 'time');
        return total + (progressBarUnit ? progressBarUnit.total : 0);
      }, 0);
      section.progress = this.sectionSchedule.groupStep.reduce((total, group) => {
        const progressBarUnit = group.groupProgressBar.find(progressBar => progressBar.valueUnit !== 'currency' && progressBar.valueUnit !== 'time');
        return total + (progressBarUnit ? progressBarUnit.progress : 0);
      }, 0);
    });
  }

  checkNegativeValues() {
    const negativeValues = this.sectionSchedule.groupStep.filter(group => group.cardItemSection
      .filter(item => item.unitActual < 0 || item.unitPlanned < 0 || item.costActual < 0 || item.costPlanned < 0).length > 0);
    return negativeValues && negativeValues.length > 0;
  }

  requestTypeDistributionInformation(event, spreadMultiCost) {
    this.spreadEvent = event;
    this.showTypeDistributionDialog = true;
    this.typeDistribution = 'SIGMOIDAL';
    this.spreadMulticost = spreadMultiCost
  }

  handleSpreadDifference(event) {
    let difference = event.difference;
    const stepDate = event.stepDate;
    const idStep = event.idStep;
    const type = event.type;
    const groupIndex = this.sectionSchedule.groupStep.findIndex(group => group.cardItemSection.filter(item => item.idStep === idStep).length > 0);
    if (groupIndex > -1) {
      const stepsList = this.sectionSchedule.groupStep[groupIndex].cardItemSection.filter(step => moment(step.stepName).isAfter(moment(stepDate)) &&
        step.type === 'listStep');
      if (this.sectionSchedule.groupStep.length - (groupIndex + 1) > 0) {
        for (let i = groupIndex + 1; i < this.sectionSchedule.groupStep.length; i++) {
          this.sectionSchedule.groupStep[i].cardItemSection.filter(listStep => listStep.type === 'listStep').forEach(step => {
            stepsList.push(step);
          })
        }
      }
      if (stepsList.length > 0) {
        if (this.typeDistribution === 'LINEAR') {
          let stepIndex = 0;
          for (let month = stepsList.length; month > 0; month--) {
            const resultValue = difference / month;
            const value = type === 'unitActual' ? +(resultValue.toFixed(this.unitMeansure.precision)) : +(resultValue.toFixed(2));
            difference = difference - value;
            if (type === 'unitActual') {
              stepsList[stepIndex].unitPlanned = stepsList[stepIndex].unitPlanned + value;
            } else {
              const idCost = this.getCostAccountStepChanged(idStep);
              this.replicateCostAccountValues(stepsList[stepIndex].idStep, idCost, value);
            }
            stepIndex++;
          }
        } else {
          const quantSteps = stepsList.length;
          let middle = (quantSteps - (quantSteps % 2)) / 2;
          let indexes = [];
          for (let i = 0; i < quantSteps; i++) {
            indexes.unshift(middle);
            middle--;
          }
          const values = stepsList.map( (step, index) => {
            return index === (stepsList.length -1) ? 1 : 1 / ( 1 + Math.exp(- indexes[index]));
          });

          stepsList.forEach( (step, index) => {
            const resultValue = index === 0 ? (values[index] * difference) : ((values[index] * difference) - (values[index - 1] * difference));
            const value = type === 'unitActual' ? +(resultValue.toFixed(this.unitMeansure.precision)) : +(resultValue.toFixed(2));
            if (type === 'unitActual') {
              step.unitPlanned = step.unitPlanned + value;
            } else {
              const idCost = this.getCostAccountStepChanged(idStep);
              this.replicateCostAccountValues(step.idStep, idCost, value);
            }
          })
        }
        
      }
      stepsList.forEach(step => {
        const groupIndex = this.sectionSchedule.groupStep.findIndex(group => group.cardItemSection.filter(item => item.idStep === step.idStep).length > 0);
        if (groupIndex > -1) {
          const stepIndex = this.sectionSchedule.groupStep[groupIndex].cardItemSection.findIndex(selectedStep => selectedStep.idStep === step.idStep);
          if (stepIndex > -1) {
            this.sectionSchedule.groupStep[groupIndex].cardItemSection[stepIndex] = { ...step };
            this.saveStepChanged(this.sectionSchedule.groupStep[groupIndex].year, step.idStep);
          }
        }
      });

    }
  }

  getCostAccountStepChanged(idStep) {
    const groupIndex = this.schedule.groupStep.findIndex(group => group.steps.filter(step => step.id === idStep).length > 0);
    if (groupIndex > -1) {
      const stepIndex = this.schedule.groupStep[groupIndex].steps.findIndex(step => step.id === idStep);
      if (stepIndex > -1) {
        const stepCost = this.schedule.groupStep[groupIndex].steps[stepIndex].consumes[0];
        return stepCost.costAccount.id
      }
    }
  }

  ngOnDestroy(): void {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

  async handleShowEditCost(event, group) {
    this.indexCardEdited = 0;
    const idStep = event.idStep;
    const stepOrder = event.stepOrder;
    const groupIndex = this.schedule.groupStep.findIndex(group => group.steps.filter(step => step.id === idStep).length > 0);
    if (groupIndex > -1) {
      const stepIndex = this.schedule.groupStep[groupIndex].steps.findIndex(step => step.id === idStep);
      if (stepIndex > -1) {
        const step =this.schedule.groupStep[groupIndex].steps[stepIndex];
        const actualDate = moment();
        const stepDate = moment(step.periodFromStart, 'yyyy-MM-DD');
        const showReplicateButton = stepDate.isSameOrBefore(actualDate) ? true : false;
        this.stepShow = {
          id: step.id,
          plannedWork: step.plannedWork,
          actualWork: step.actualWork,
          showReplicateButton,
          periodFromStart: step.periodFromStart,
          consumes: step.consumes && step.consumes.map(consume => ({
            actualCost: consume.actualCost,
            plannedCost: consume.plannedCost,
            idCostAccount: consume.costAccount.id,
            nameCostAccount: consume.costAccount.name,
            id: consume.id
          })),
          group
        };
        if (this.stepShow && this.stepShow.consumes) {
          this.costAssignmentsCardItemsEdited = this.stepShow.consumes.map(consume => {
            return {
              type: 'cost-card',
              unitMeasureName: '$',
              idCost: consume.idCostAccount,
              idCostAssignment: consume.id,
              costAccountName: consume.nameCostAccount,
              plannedWork: consume.plannedCost,
              actualWork: consume.actualCost,
              readonly: !this.editPermission,
              showReplicateButton: this.stepShow.showReplicateButton,
              endStep: stepOrder === 'end'
            };
          });
          this.cardCostEditPanel.show(event.clickEvent);
        }
      }
    }    
  }

  decrementIndex() {
    this.indexCardEdited--;
  }

  incrementIndex() {
    this.indexCardEdited++;
  }

  async handleChangeValuesCardItem() {
    const cardChanged = this.costAssignmentsCardItemsEdited[this.indexCardEdited];

    if (!cardChanged.actualWork || cardChanged.actualWork === null) {
      cardChanged.actualWork = 0;
      this.costAssignmentsCardItemsEdited[this.indexCardEdited].actualWork = 0;
    }
    if (!cardChanged.plannedWork || cardChanged.plannedWork === null) {
      cardChanged.plannedWork = 0;
      this.costAssignmentsCardItemsEdited[this.indexCardEdited].plannedWork = 0;
    }

    const stepIsChangedBefore = this.changedSteps.find(step => step.changedIdStep === this.stepShow.id);
    if (!stepIsChangedBefore) {
      this.changedSteps.push({
        changedGroupYear: this.stepShow.group,
        changedIdStep: this.stepShow.id
      })
    }
    const groupStepIndex = this.schedule.groupStep.findIndex(group => group.year === this.stepShow.group);
    if (groupStepIndex > -1) {
      const stepIndex = this.schedule.groupStep[groupStepIndex].steps.findIndex(step => step.id === this.stepShow.id);
      if (stepIndex > -1) {
        const consumesIndex = this.schedule.groupStep[groupStepIndex].steps[stepIndex].consumes.findIndex(cons => cons.costAccount.id === cardChanged.idCost);
        if (consumesIndex > -1) {
          this.schedule.groupStep[groupStepIndex].steps[stepIndex].consumes[consumesIndex] = {
            ...this.schedule.groupStep[groupStepIndex].steps[stepIndex].consumes[consumesIndex],
            actualCost: cardChanged.actualWork,
            plannedCost: cardChanged.plannedWork
          };
        }
      }
    }
    this.workpackSrv.nextPendingChanges(true);
    this.saveButton.showButton();
    const groupIndex = this.sectionSchedule.groupStep.findIndex(group => group.cardItemSection.filter(item => item.idStep === this.stepShow.id).length > 0);
    if (groupIndex > -1) {
      const stepIndex = this.sectionSchedule.groupStep[groupIndex].cardItemSection.findIndex(card => card.idStep === this.stepShow.id);
      if (stepIndex > -1) {
        this.sectionSchedule.groupStep[groupIndex].cardItemSection[stepIndex].costActual = this.costAssignmentsCardItemsEdited.reduce((total, item) => {
          return total + item.actualWork;
        }, 0);
        this.sectionSchedule.groupStep[groupIndex].cardItemSection[stepIndex].costPlanned = this.costAssignmentsCardItemsEdited.reduce((total, item) => {
          return total + item.plannedWork;
        }, 0);
        // Atualizando a progressBar de custo do card
        this.sectionSchedule.groupStep[groupIndex].cardItemSection[stepIndex].costProgressBar = {
          ...this.sectionSchedule.groupStep[groupIndex].cardItemSection[stepIndex].costProgressBar,
          progress: this.costAssignmentsCardItemsEdited.reduce((total, item) => {
            return total + item.actualWork;
          }, 0),
          total: this.costAssignmentsCardItemsEdited.reduce((total, item) => {
            return total + item.plannedWork;
          }, 0)
        }
      }
      // atualizando a progressBar de custo do ano
      this.sectionSchedule.groupStep[groupIndex].groupProgressBar.forEach(group => {
        if (group.valueUnit === 'currency') {
          group.total = this.sectionSchedule.groupStep[groupIndex].cardItemSection.filter(itemStep => itemStep.type === 'listStep').reduce((total, step) => { return total + step.costPlanned }, 0);
          group.progress = this.sectionSchedule.groupStep[groupIndex].cardItemSection.filter(itemStep => itemStep.type === 'listStep').reduce((total, step) => { return total + step.costActual }, 0);
        }
      })
    }
    const hasNegativeValues = this.checkNegativeValues();
    if (hasNegativeValues) {
      this.messageSrv.add({
        detail: this.translateSrv.instant('messages.scheduleCantHasNegativeValues'),
        severity: 'warn',
        summary: this.translateSrv.instant('atention')
      });
      this.saveButton.hideButton();
      return;
    }
    // atualizando a progressBar de custo do schedule geral
    this.sectionSchedule.cardSection.progressBarValues.filter(progress => progress.valueUnit === 'currency').forEach((section, index) => {
      section.total = this.sectionSchedule.groupStep.reduce((total, group) => {
        const progressBarCost = group.groupProgressBar.find(progressBar => progressBar.valueUnit === 'currency');
        return total + (progressBarCost ? progressBarCost.total : 0);
      }, 0);
      section.progress = this.sectionSchedule.groupStep.reduce((total, group) => {
        const progressBarCost = group.groupProgressBar.find(progressBar => progressBar.valueUnit === 'currency');
        return total + (progressBarCost ? progressBarCost.progress : 0);
      }, 0);
    });
  }

  handleSpreadDifferenceMultiCost(event) {
    let difference = event.difference;
    const cardChanged = this.costAssignmentsCardItemsEdited[this.indexCardEdited];
    const stepDate = this.stepShow.periodFromStart;
    const idStep = this.stepShow.id;
    this.handleChangeValuesCardItem();
    const groupIndex = this.sectionSchedule.groupStep.findIndex(group => group.cardItemSection.filter(item => item.idStep === idStep).length > 0);
    if (groupIndex > -1) {
      const stepsList = this.sectionSchedule.groupStep[groupIndex].cardItemSection.filter(step => moment(step.stepName).isAfter(moment(stepDate)) &&
        step.type === 'listStep');
      if (this.sectionSchedule.groupStep.length - (groupIndex + 1) > 0) {
        for (let i = groupIndex + 1; i < this.sectionSchedule.groupStep.length; i++) {
          this.sectionSchedule.groupStep[i].cardItemSection.filter(listStep => listStep.type === 'listStep').forEach(step => {
            stepsList.push(step);
          });
        }
      }
      if (stepsList.length > 0) {
        let stepIndex = 0;
        if (this.typeDistribution === 'LINEAR') {
          for (let month = stepsList.length; month > 0; month--) {
            const resultValue = difference / month;
            const value = +(resultValue.toFixed(2));
            difference = difference - value;
            this.replicateCostAccountValues(stepsList[stepIndex].idStep, cardChanged.idCost, value);
            stepIndex++;
          }
        } else {
          const quantSteps = stepsList.length;
          let middle = (quantSteps - (quantSteps % 2)) / 2;
          let indexes = [];
          for (let i = 0; i < quantSteps; i++) {
            indexes.unshift(middle);
            middle--;
          }
          const values = stepsList.map( (step, index) => {
            return index === (stepsList.length -1) ? 1 : 1 / ( 1 + Math.exp(- indexes[index]));
          });
          stepsList.forEach( ( step, index ) => {
            const valueStep = index === 0 ? (values[index] * difference) : ((values[index] * difference) - (values[index - 1] * difference));
            this.replicateCostAccountValues(step.idStep, cardChanged.idCost, valueStep);
          });
        }
        
      }
    }
  }

  replicateCostAccountValues(idStep, idCost, value) {
    const groupIndex = this.schedule.groupStep.findIndex(group => group.steps.filter(step => step.id === idStep).length > 0);
    if (groupIndex > -1) {
      const stepIndex = this.schedule.groupStep[groupIndex].steps.findIndex(step => step.id === idStep);
      if (stepIndex > -1) {
        const stepsCost = this.schedule.groupStep[groupIndex].steps[stepIndex].consumes.filter( consume => consume.costAccount.id === idCost);
        if (stepsCost && stepsCost.length > 0) {
          this.schedule.groupStep[groupIndex].steps[stepIndex].consumes.forEach(consume => {
            if (consume.costAccount.id === idCost) {
              consume.plannedCost = consume.plannedCost + value;
            }
          });
        } else {
          const totalPlannedCostAccounts =  this.schedule.groupStep[groupIndex].steps[stepIndex].consumes.reduce( (total, consume) => total + consume.plannedCost, 0);
          this.schedule.groupStep[groupIndex].steps[stepIndex].consumes.forEach(consume => {
            const plannedProp = totalPlannedCostAccounts ?  (consume.plannedCost / totalPlannedCostAccounts) * value : value;
            consume.plannedCost = consume.plannedCost + plannedProp;
          });
        }
        this.stepShow = {
          id: this.schedule.groupStep[groupIndex].steps[stepIndex].id,
          plannedWork: this.schedule.groupStep[groupIndex].steps[stepIndex].plannedWork,
          actualWork: this.schedule.groupStep[groupIndex].steps[stepIndex].actualWork,
          periodFromStart: this.schedule.groupStep[groupIndex].steps[stepIndex].periodFromStart,
          consumes: this.schedule.groupStep[groupIndex].steps[stepIndex].consumes && this.schedule.groupStep[groupIndex].steps[stepIndex].consumes.map(consume => ({
            actualCost: consume.actualCost,
            plannedCost: consume.plannedCost,
            idCostAccount: consume.costAccount.id,
            nameCostAccount: consume.costAccount.name,
            id: consume.id
          })),
          group: this.schedule.groupStep[groupIndex].year
        };
        if (this.stepShow && this.stepShow.consumes) {
          this.costAssignmentsCardItemsEdited = this.stepShow.consumes.map(consume => {
            return {
              type: 'cost-card',
              unitMeasureName: '$',
              idCost: consume.idCostAccount,
              idCostAssignment: consume.id,
              costAccountName: consume.nameCostAccount,
              plannedWork: consume.plannedCost,
              actualWork: consume.actualCost,
              readonly: !this.editPermission,
              showReplicateButton: this.stepShow.showReplicateButton
            };
          });
        }
        this.handleChangeValuesCardItem();
      }
    }
  }

  async refreshScheduleProgressBar() {
    this.workpackSrv.nextPendingChanges(false);
    const scheduleChanged = await this.scheduleSrv.GetScheduleById(this.schedule.id);
    if (scheduleChanged.success) {
      const scheduleValues = scheduleChanged.data;
      this.scheduleSrv.setScheduleChanged(scheduleValues);
      const costIndex = this.sectionSchedule.cardSection.progressBarValues.findIndex(item => item.type === 'cost');
      if (costIndex > -1) {
        this.sectionSchedule.cardSection.progressBarValues[costIndex].total = scheduleValues.planedCost;
        this.sectionSchedule.cardSection.progressBarValues[costIndex].progress = scheduleValues.actualCost;
      }
      const scopeIndex = this.sectionSchedule.cardSection.progressBarValues.findIndex(item => item.type === 'scope');
      if (scopeIndex > -1) {
        this.sectionSchedule.cardSection.progressBarValues[scopeIndex].total = scheduleValues.planed;
        this.sectionSchedule.cardSection.progressBarValues[scopeIndex].progress = scheduleValues.actual;
      }
      this.sectionSchedule.groupStep.forEach(group => {
        const costProgressIndex = group.groupProgressBar.findIndex(progress => progress.type === 'cost');
        if (costProgressIndex > -1) {
          const groupValue = scheduleValues.groupStep.find(groupStep => groupStep.year === group.year);
          if (groupValue) {
            group.groupProgressBar[costProgressIndex].total = groupValue.planedCost;
            group.groupProgressBar[costProgressIndex].progress = groupValue.actualCost;
          }
        }
        const scopeProgressIndex = group.groupProgressBar.findIndex(progress => progress.type === 'scope');
        if (scopeProgressIndex > -1) {
          const groupValue = scheduleValues.groupStep.find(groupStep => groupStep.year === group.year);
          if (groupValue) {
            group.groupProgressBar[scopeProgressIndex].total = groupValue.planed;
            group.groupProgressBar[scopeProgressIndex].progress = groupValue.actual;
          }
        }
      })
    }
  }

  async saveCostAccountsStepChangeds() {
    const costAccountChangedSaved = await Promise.all(this.costAccountsConsumesStepChangeds.map(async (item) => {
      const result = await this.scheduleSrv.putScheduleStepConsume(item.idStep, item.idCost, {
        actualCost: item.actualCost,
        plannedCost: item.plannedCost
      });
      if (result.success) {
        return item.idCost;
      }
    }));
    if (costAccountChangedSaved.length === this.costAccountsConsumesStepChangeds.length) {
      this.costAccountsConsumesStepChangeds = [];
    }
  }

  async onSaveButtonClicked() {
    this.formIsSaving = true;
    if (this.changedSteps && this.changedSteps.length > 0) {
      const stepsToSave = this.changedSteps.map(stepToSave => {
        const stepGroup = this.schedule.groupStep.find(group => group.year === stepToSave.changedGroupYear);
        const step = stepGroup.steps.find(s => s.id === stepToSave.changedIdStep);
        const stepChanged = this.sectionSchedule.groupStep.find(group => group.year === stepToSave.changedGroupYear)
          .cardItemSection.find(s => s.idStep === stepToSave.changedIdStep);
        return {
          id: step.id,
          plannedWork: stepChanged.unitPlanned,
          actualWork: stepChanged.unitActual,
          consumes: step.consumes && step.consumes.length === 1 ?
            step.consumes?.map(consume => ({
              actualCost: stepChanged.costActual,
              plannedCost: stepChanged.costPlanned,
              idCostAccount: consume.costAccount.id,
              id: consume.id
            })) :
            step.consumes?.map(consume => ({
              actualCost: consume.actualCost,
              plannedCost: consume.plannedCost,
              idCostAccount: consume.costAccount.id,
              id: consume.id
            }))
        }
      });
      const hasNegativeValues = stepsToSave.filter(step => step.plannedWork < 0 || step.actualWork < 0 ||
        (step.consumes && step.consumes.filter(consume => consume.actualCost < 0 || consume.plannedCost < 0).length > 0)).length > 0;
      if (hasNegativeValues) {
        this.messageSrv.add({
          detail: this.translateSrv.instant('messages.scheduleCantHasNegativeValues'),
          severity: 'warn',
          summary: this.translateSrv.instant('atention')
        });
        this.saveButton.hideButton();
        return;
      }
      const result = await this.scheduleSrv.putScheduleStepBatch(stepsToSave);
      if (result.success) {
        this.dashboardSrv.resetDashboardData();
        this.changedSteps = [];
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
        
        this.refreshScheduleProgressBar();
        this.formIsSaving = false;
        setTimeout( () => {
          const linked = this.workpackParams.idWorkpackModelLinked ? true : false;
          this.dashboardSrv.loadDashboard(linked);
        }, 1000)
      }
    }

  }

}
