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
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import * as moment from 'moment';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-workpack-section-schedule',
  templateUrl: './workpack-section-schedule.component.html',
  styleUrls: ['./workpack-section-schedule.component.scss']
})
export class WorkpackSectionScheduleComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  $destroy = new Subject();
  collapsePanelsStatus: boolean;
  responsive = false;
  sectionSchedule: IScheduleSection;
  schedule: IScheduleDetail;
  showDetails = true;
  unitMeansure: IMeasureUnit;
  editPermission: boolean;
  showTabview = false;
  changedSteps: {
    changedGroupYear;
    changedIdStep;
  }[] = [];

  constructor(
    private router: Router,
    private workpackSrv: WorkpackService,
    public translateSrv: TranslateService,
    private configDataViewSrv: ConfigDataViewService,
    private responsiveSrv: ResponsiveService,
    private scheduleSrv: ScheduleService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService,
    private messageSrv: MessageService
  ) {
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(responsive => this.responsive = responsive);
    this.workpackSrv.observableResetWorkpack.pipe(takeUntil(this.$destroy)).subscribe(reset => {
      if (reset) {
        this.workpackData = this.workpackSrv.getWorkpackData();
        this.workpackParams = this.workpackSrv.getWorkpackParams();
        if (this.workpackData && this.workpackData?.workpack?.id && this.workpackData?.workpackModel && this.workpackData?.workpackModel?.scheduleSessionActive) {
          this.loadScheduleSession();
        }
      }
    });
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
  }

  ngOnInit(): void {
  }

  async loadScheduleSession() {
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
    this.editPermission = this.workpackSrv.getEditPermission();
    this.unitMeansure = this.workpackSrv.getUnitMeansure();
    const result = await this.scheduleSrv.GetSchedule({ 'id-workpack': this.workpackParams.idWorkpack });
    if (result.success && result.data && result.data.length > 0) {
      this.schedule = result.data[0];
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
          editCosts: step.consumes && step.consumes.length === 1 ? true : false
        }));
        const groupProgressBar = [
          {
            total: Number(group.planed.toFixed(this.unitMeansure.precision)),
            progress: Number(group.actual.toFixed(this.unitMeansure.precision)),
            labelTotal: 'planned',
            labelProgress: 'actual',
            valueUnit: this.unitMeansure && this.unitMeansure.name,
            color: '#ffa342',
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
      const daysToNow = dateActual.diff(initialDatePlanned, 'days');
      const baselineStartDate = this.schedule && new Date(this.schedule.baselineStart + 'T00:00:00');
      const baselineEndDate = this.schedule && new Date(this.schedule.baselineEnd + 'T00:00:00');
      const baselineDaysPlanned = moment(baselineEndDate).diff(moment(baselineStartDate), 'days');
      this.sectionSchedule = {
        cardSection: {
          toggleable: false,
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
              color: '#ffa342',
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
      if (this.sectionSchedule.groupStep && this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection
        && this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection.length > 3) {
        this.sectionSchedule.groupStep[groupLenght - 1].end = true;
        const cardItemSectionLenght = this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection.length;
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
        this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection[cardItemSectionLenght - 1].stepDay = endDate;
        this.sectionSchedule.groupStep[groupLenght - 1].cardItemSection.push(endScheduleStep);
      }
      this.sectionSchedule.cardSection.isLoading = false;
      return;
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

  handleShowDetails() {
    this.showDetails = !this.showDetails;
  }

  async handleDeleteSchedule() {
    const result = await this.scheduleSrv.DeleteSchedule(this.schedule.id, { useConfirm: true });
    if (result.success) {
      this.schedule = null;
      this.sectionSchedule.groupStep = null;
      this.workpackData.workpack.hasScheduleSectionActive = false;
      this.workpackSrv.nextCanEditCheckCompleted(true);
      await this.loadScheduleSession();
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
      await this.loadScheduleSession();
    }
  }

  async saveStepChanged(groupYear: number, idStep: number) {
    const stepIsChangedBefore = this.changedSteps.find( step => step.changedIdStep === idStep);
    if (!stepIsChangedBefore) {
      this.changedSteps.push({
        changedGroupYear: groupYear,
        changedIdStep: idStep
      })
    }
    this.workpackSrv.nextPendingChanges(true);
    this.saveButton.showButton();
  }

  async onSaveButtonClicked() {
    if (this.changedSteps && this.changedSteps.length > 0) {
      const stepsSaved = await Promise.all(this.changedSteps.map(async (stepToSave) => {
        const stepGroup = this.schedule.groupStep.find(group => group.year === stepToSave.changedGroupYear);
        const step = stepGroup.steps.find(s => s.id === stepToSave.changedIdStep);
        const stepChanged = this.sectionSchedule.groupStep.find(group => group.year === stepToSave.changedGroupYear)
          .cardItemSection.find(s => s.idStep === stepToSave.changedIdStep);
        try {
          const result = await this.scheduleSrv.putScheduleStep({
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
          });
          if (result.success) {
            return stepToSave.changedIdStep;
          }
        } catch (error) {
          return;
        }
        
      }));
      if (this.changedSteps.length === stepsSaved.length) {
        this.changedSteps = [];
        this.workpackSrv.nextPendingChanges(false);
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
        const scheduleChanged = await this.scheduleSrv.GetScheduleById(this.schedule.id);
        if (scheduleChanged.success) {
          const scheduleValues = scheduleChanged.data;
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
    }
  }

  ngOnDestroy(): void {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

}
