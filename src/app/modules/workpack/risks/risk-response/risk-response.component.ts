import { AuthService } from './../../../../shared/services/auth.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { StakeholderService } from './../../../../shared/services/stakeholder.service';
import { IRiskResponse } from './../../../../shared/interfaces/IRiskResponse';
import { takeUntil, filter } from 'rxjs/operators';
import { RiskResponseService } from './../../../../shared/services/risk-response.service';
import { BreadcrumbService } from './../../../../shared/services/breadcrumb.service';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from './../../../../shared/services/responsive.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SelectItem, MessageService } from 'primeng/api';
import { RiskResponsesPropertiesOptions } from './../../../../shared/constants/riskResponsesPropertiesOptions';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ICard } from './../../../../shared/interfaces/ICard';
import { Subject } from 'rxjs';
import { Calendar } from 'primeng/calendar';
import { SaveButtonComponent } from './../../../../shared/components/save-button/save-button.component';
import { Component, OnInit, ViewChild, ViewChildren } from '@angular/core';
import * as moment from 'moment';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

@Component({
  selector: 'app-risk-response',
  templateUrl: './risk-response.component.html',
  styleUrls: ['./risk-response.component.scss']
})
export class RiskResponseComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;
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
  language: string;
  formIsSaving = false;

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
    private authSrv: AuthService,
    private router: Router
  ) {
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
    });
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idRiskResponse = queryParams.idRiskResponse && +queryParams.idRiskResponse;
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
      trigger: [''],
      plan: [''],
      responsible: [],
    });
    this.formRiskResponse.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formRiskResponse.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formRiskResponse.dirty && this.formRiskResponse.valid))
      .subscribe(() => this.saveButton.showButton());
    this.formRiskResponse.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formRiskResponse.dirty))
      .subscribe(() => this.cancelButton.showButton());
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.setLanguage();
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    await this.loadPropertiesRiskResponse();
    await this.setBreadcrumb();
    if (!this.editPermission) {
      this.formRiskResponse.disable;
    } else {
      this.formRiskResponse.enable;
    }
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

  setFormRiskResponse() {
    this.formRiskResponse.reset({
      name: this.riskResponse.name,
      when: this.riskResponse.when,
      startDate: this.riskResponse.startDate ? new Date(this.riskResponse.startDate + 'T00:00:00') : null,
      endDate: this.riskResponse.endDate ? new Date(this.riskResponse.endDate + 'T00:00:00') : null,
      strategy: this.riskResponse.strategy,
      status: this.riskResponse.status,
      trigger: this.riskResponse.trigger,
      plan: this.riskResponse.plan,
      responsible: this.riskResponse.responsible && this.riskResponse.responsible.length > 0 ? this.riskResponse.responsible.map(resp => resp.id) : [],
    })
    this.cardRiskResponseProperties.isLoading = false;
  }

  async loadPropertiesRiskResponse() {
    this.cardRiskResponseProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false,
      isLoading: true
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
    if (!this.idRiskResponse) this.cardRiskResponseProperties.isLoading = false;
    const result = this.idRiskResponse && await this.riskResponseSrv.GetById(this.idRiskResponse);
    if (result && result.success) {
      this.riskResponse = result.data;
      await this.loadPermissions();
      this.setFormRiskResponse();
    }
  }

  async loadPermissions() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    const result = await this.workpackSrv.GetWorkpackPermissions(this.idWorkpack, { 'id-plan': this.idPlan });
    if (result.success) {
      const workpack = result.data;
      if (isUserAdmin) {
        this.editPermission = !workpack.canceled;
      } else {
        this.editPermission = workpack.permissions && workpack.permissions.filter(p => p.level === 'EDIT').length > 0 && !workpack.canceled;
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
    let breadcrumbItems = this.breadcrumbSrv.get;
    if (!breadcrumbItems || breadcrumbItems.length === 0) {
      breadcrumbItems = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(this.idWorkpack, this.idPlan)
    }
    this.breadcrumbSrv.setMenu([
      ...breadcrumbItems,
      {
        key: 'risk',
        routerLink: ['/workpack/risks'],
        queryParams: { idWorkpack: this.idWorkpack, idRisk: this.idRisk },
        info: this.riskName,
        tooltip: this.riskName
      },
      {
        key: 'response',
        info: this.riskResponse?.name,
        tooltip: this.riskResponse?.name
      }
    ]);
  }

  async saveRiskResponse() {
    this.cancelButton.hideButton();
    this.formIsSaving = true;
    const sender: IRiskResponse = {
      id: this.idRiskResponse,
      idRisk: this.idRisk,
      name: this.formRiskResponse.controls.name.value,
      when: this.formRiskResponse.controls.when.value,
      startDate: this.formRiskResponse.controls.when.value === 'PRE_OCCURRENCE' && (this.formRiskResponse.controls.startDate.value && this.formRiskResponse.controls.startDate.value !== null)
        ? moment(this.formRiskResponse.controls.startDate.value).format('yyyy-MM-DD') : undefined,
      endDate: this.formRiskResponse.controls.when.value === 'PRE_OCCURRENCE' && (this.formRiskResponse.controls.endDate.value && this.formRiskResponse.controls.endDate.value !== null)
        ? moment(this.formRiskResponse.controls.endDate.value).format('yyyy-MM-DD') : undefined,
      strategy: this.formRiskResponse.controls.strategy.value,
      status: this.formRiskResponse.controls.status.value,
      trigger: this.formRiskResponse.controls.trigger.value,
      plan: this.formRiskResponse.controls.plan.value,
      responsible: this.formRiskResponse.controls.responsible.value
    };
    const put = !!this.idRiskResponse;
    const result =  put ? await this.riskResponseSrv.put(sender) : await this.riskResponseSrv.post(sender);
    this.formIsSaving = false;
    if (result.success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.router.navigate(['/workpack/risks'], {
        queryParams: {
          idWorkpack: this.idWorkpack,
          idRisk: this.idRisk
        }
      });
    }
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    if (this.idRiskResponse) {
      this.setFormRiskResponse();
    } else {
      this.formRiskResponse.reset({
        name: '',
        when: '',
        startDate: null,
        endDate: null,
        strategy: '',
        status: '',
        trigger: '',
        plan: '',
        responsible: [],
      });
    }
  }

}
