import { AuthService } from './../../../../shared/services/auth.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { StakeholderService } from './../../../../shared/services/stakeholder.service';
import { IRiskResponse } from './../../../../shared/interfaces/IRiskResponse';
import { takeUntil, filter } from 'rxjs/operators';
import { RiskResponseService } from './../../../../shared/services/risk-response.service';
import { RiskService } from './../../../../shared/services/risk.service';
import { BreadcrumbService } from './../../../../shared/services/breadcrumb.service';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from './../../../../shared/services/responsive.service';
import { ActivatedRoute } from '@angular/router';
import { SelectItem, MessageService } from 'primeng/api';
import { RiskResponsesPropertiesOptions } from './../../../../shared/constants/riskResponsesPropertiesOptions';
import { IRisk } from './../../../../shared/interfaces/IRisk';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { ICard } from './../../../../shared/interfaces/ICard';
import { Subject } from 'rxjs';
import { Calendar } from 'primeng/calendar';
import { SaveButtonComponent } from './../../../../shared/components/save-button/save-button.component';
import { Component, OnInit, ViewChild, ViewChildren } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-risk-response',
  templateUrl: './risk-response.component.html',
  styleUrls: ['./risk-response.component.scss']
})
export class RiskResponseComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChildren(Calendar) calendarComponents: Calendar[];

  responsive: boolean;
  idRisk: number;
  riskName: string;
  idWorkpack: number;
  riskNature: string;
  idRiskResponse: number;
  editPermission: boolean;
  $destroy = new Subject();
  calendarFormat: string;
  cardRiskResponseProperties: ICard;
  formRiskResponse: FormGroup;
  riskResponse: IRiskResponse;
  riskResponsePropertiesOptions = RiskResponsesPropertiesOptions;
  yearRangeCalculated: string;
  strategyOptions: SelectItem[];
  statusOptions: SelectItem[];
  stakeholderOptions: SelectItem[];
  idPlan: number;

  constructor(
    private actRouter: ActivatedRoute,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private riskResponseSrv: RiskResponseService,
    private stakeholderSrv: StakeholderService,
    private workpackSrv: WorkpackService,
    private authSrv: AuthService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idRiskResponse = queryParams.id && +queryParams.id;
      this.idRisk = queryParams.idRisk && +queryParams.idRisk;
      this.riskName = queryParams.riskName && queryParams.riskName;
      this.idWorkpack = queryParams.idWorkpack && +queryParams.idWorkpack;
      this.riskNature = queryParams.riskNature && queryParams.riskNature;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.calendarComponents?.map(calendar => {
        calendar.ngOnInit();
        calendar.dateFormat = this.translateSrv.instant('dateFormat');
        calendar.updateInputfield();
      }, 150));
    }
    );
    this.formRiskResponse = this.formBuilder.group({
      name: ['', Validators.required],
      when: ['', Validators.required],
      startDate: null,
      endDate: null,
      strategy: ['', Validators.required],
      status: ['', Validators.required],
      trigger: ['', Validators.required],
      plan: ['', Validators.required],
      responsible: ['', Validators.required],
    });
    this.formRiskResponse.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton.hideButton());
    this.formRiskResponse.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formRiskResponse.dirty && this.formRiskResponse.valid))
      .subscribe(() => this.saveButton.showButton());
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    await this.loadPropertiesRiskResponse();
    await this.setBreadcrumb();
    if (!this.editPermission) {
      this.formRiskResponse.disable;
    } else {
      this.formRiskResponse.enable;
    }
  }

  setFormRiskResponse() {
    this.formRiskResponse.controls.name.setValue(this.riskResponse.name);
    this.formRiskResponse.controls.when.setValue(this.riskResponse.when);
    this.formRiskResponse.controls.startDate.setValue(new Date(this.riskResponse.startDate + 'T00:00:00'));
    this.formRiskResponse.controls.endDate.setValue(new Date(this.riskResponse.endDate + 'T00:00:00'));
    this.formRiskResponse.controls.strategy.setValue(this.riskResponse.strategy);
    this.formRiskResponse.controls.status.setValue(this.riskResponse.status);
    this.formRiskResponse.controls.trigger.setValue(this.riskResponse.trigger);
    this.formRiskResponse.controls.plan.setValue(this.riskResponse.plan);
    if (this.riskResponse.responsible && this.riskResponse.responsible.length > 0) {
      this.formRiskResponse.controls.responsible.setValue(this.riskResponse.responsible.map(resp => resp.id));
    }
  }

  async loadPropertiesRiskResponse() {
    this.cardRiskResponseProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false
    };
    this.strategyOptions = this.riskNature === 'OPPORTUNITY' ? Object.keys(this.riskResponsePropertiesOptions.STRATEGY.POSITIVE).map(key => ({
      label: this.translateSrv.instant(this.riskResponsePropertiesOptions.STRATEGY.POSITIVE[key].label),
      value: this.riskResponsePropertiesOptions.STRATEGY.POSITIVE[key].value
    })) : Object.keys(this.riskResponsePropertiesOptions.STRATEGY.NEGATIVE).map(key => ({
      label: this.translateSrv.instant(this.riskResponsePropertiesOptions.STRATEGY.NEGATIVE[key].label),
      value: this.riskResponsePropertiesOptions.STRATEGY.NEGATIVE[key].value
    }));
    this.statusOptions = Object.keys(this.riskResponsePropertiesOptions.STATUS).map(key => ({
      label: this.translateSrv.instant(this.riskResponsePropertiesOptions.STATUS[key].label),
      value: this.riskResponsePropertiesOptions.STATUS[key].value
    }));
    await this.loadStakeholdersList();
    this.calculateYearRange();
    const result = this.idRiskResponse && await this.riskResponseSrv.GetById(this.idRiskResponse);
    if (result && result.success) {
      this.riskResponse = result.data;
      await this.loadPermissions();
      this.setFormRiskResponse();
    }
  }

  async loadPermissions() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    if (isUserAdmin) {
      this.editPermission = true;
    } else {
      this.idPlan = Number(localStorage.getItem('@currentPlan'));
      const result = await this.workpackSrv.GetWorkpackById(this.idWorkpack, { 'id-plan': this.idPlan });
      if (result.success) {
        const workpack = result.data;
        this.editPermission = workpack.permissions && workpack.permissions.filter(p => p.level === 'EDIT').length > 0;
      }
    }
  }

  async loadStakeholdersList() {
    const result = await this.stakeholderSrv.GetResponsibles({ 'id-workpack': this.idWorkpack });
    if (result.success) {
      this.stakeholderOptions = result.data.map(stake => ({
        label: stake.name,
        value: stake.id
      }));
    }
  }

  calculateYearRange() {
    const date = moment();
    const rangeYearStart = date.year();
    const rangeYearEnd = date.add(10, 'years').year();
    this.yearRangeCalculated = `${rangeYearStart}:${rangeYearEnd};`
  }

  async setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      ... await this.getBreadcrumbs(this.idWorkpack),
      {
        key: 'risk',
        routerLink: ['/workpack/risks'],
        queryParams: { idWorkpack: this.idWorkpack, id: this.idRisk },
        info: this.riskName,
        tooltip: this.riskName
      },
      {
        key: 'response',
        routerLink: ['/workpack/risks/response'],
        queryParams: {
          idWorkpack: this.idWorkpack,
          id: this.idRiskResponse,
          idRisk: this.idRisk,
          riskNature: this.riskNature,
          riskName: this.riskName
        },
        info: this.riskResponse?.name,
        tooltip: this.riskResponse?.name
      }
    ]);
  }

  async getBreadcrumbs(idWorkpack: number) {
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(idWorkpack, { 'id-plan': this.idPlan });
    return success
      ? data.map(p => ({
        key: !p.modelName ? p.type.toLowerCase() : p.modelName,
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: { id: p.id },
        modelName: p.modelName
      }))
      : [];
  }

  getRouterLinkFromType(type: string): string[] {
    switch (type) {
      case 'office':
        return ['/offices', 'office'];
      case 'plan':
        return ['plan'];
      default:
        return ['/workpack'];
    }
  }

  async saveRiskResponse() {
    const sender: IRiskResponse = {
      id: this.idRiskResponse,
      idRisk: this.idRisk,
      name: this.formRiskResponse.controls.name.value,
      when: this.formRiskResponse.controls.when.value,
      startDate: this.formRiskResponse.controls.when.value === 'PRE_OCCURRENCE' ? moment(this.formRiskResponse.controls.startDate.value).format('yyyy-MM-DD') : undefined,
      endDate: this.formRiskResponse.controls.when.value === 'PRE_OCCURRENCE' ? moment(this.formRiskResponse.controls.endDate.value).format('yyyy-MM-DD') : undefined,
      strategy: this.formRiskResponse.controls.strategy.value,
      status: this.formRiskResponse.controls.status.value,
      trigger: this.formRiskResponse.controls.trigger.value,
      plan: this.formRiskResponse.controls.plan.value,
      responsible: this.formRiskResponse.controls.responsible.value
    };
    const result = this.idRiskResponse ? await this.riskResponseSrv.put(sender) : await this.riskResponseSrv.post(sender);
    if (result.success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.idRiskResponse = result.data.id;
      this.riskResponse = { ...result.data };
    }
  }

}
