import { AuthService } from './../../../../shared/services/auth.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IssueResponseService } from './../../../../shared/services/issue-response.service';
import { takeUntil, filter } from 'rxjs/operators';
import { StakeholderService } from './../../../../shared/services/stakeholder.service';
import { BreadcrumbService } from './../../../../shared/services/breadcrumb.service';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from './../../../../shared/services/responsive.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SelectItem, MessageService } from 'primeng/api';
import { IssueResponsesPropertiesOptions } from './../../../../shared/constants/issueResponsesPropertiesOptions';
import { IIssueResponse } from './../../../../shared/interfaces/IIssueResponse';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ICard } from './../../../../shared/interfaces/ICard';
import { Subject } from 'rxjs';
import { Calendar } from 'primeng/calendar';
import { SaveButtonComponent } from './../../../../shared/components/save-button/save-button.component';
import { Component, OnInit, ViewChild, ViewChildren } from '@angular/core';
import * as moment from 'moment';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

@Component({
  selector: 'app-issue-response',
  templateUrl: './issue-response.component.html',
  styleUrls: ['./issue-response.component.scss']
})
export class IssueResponseComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;
  @ViewChildren(Calendar) calendarComponents: Calendar[];

  responsive: boolean;
  idIssue: number;
  issueName: string;
  idWorkpack: number;
  idIssueResponse: number;
  editPermission: boolean;
  $destroy = new Subject();
  calendarFormat: string;
  cardIssueResponseProperties: ICard;
  formIssueResponse: FormGroup;
  issueResponse: IIssueResponse;
  issueResponsePropertiesOptions = IssueResponsesPropertiesOptions;
  yearRangeCalculated: string;
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
    private issueResponseSrv: IssueResponseService,
    private stakeholderSrv: StakeholderService,
    private workpackSrv: WorkpackService,
    private authSrv: AuthService,
    private router: Router
  ) {
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
    });
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idIssueResponse = queryParams.idIssueResponse && +queryParams.idIssueResponse;
      this.idIssue = queryParams.idIssue && +queryParams.idIssue;
      this.issueName = queryParams.issueName && queryParams.issueName;
      this.idWorkpack = queryParams.idWorkpack && +queryParams.idWorkpack;
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
    this.formIssueResponse = this.formBuilder.group({
      name: ['', Validators.required],
      date: null,
      status: ['', Validators.required],
      plan: ['', Validators.required],
      responsible: ['', Validators.required],
    });
    this.formIssueResponse.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formIssueResponse.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formIssueResponse.dirty && this.formIssueResponse.valid))
      .subscribe(() => this.saveButton.showButton());
    this.formIssueResponse.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formIssueResponse.dirty))
      .subscribe(() => this.cancelButton.showButton());
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.setLanguage()
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    await this.loadPropertiesIssueResponse();
    await this.setBreadcrumb();
    if (!this.editPermission) {
      this.formIssueResponse.disable;
    } else {
      this.formIssueResponse.enable;
    }
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

  setFormIssueResponse() {
    this.formIssueResponse.reset({
      name: this.issueResponse.name,
      date: new Date(moment(this.issueResponse.date, 'DD/MM/YYYY').format('YYYY-MM-DD') + 'T00:00:00'),
      status: this.issueResponse.status,
      plan: this.issueResponse.plan,
      responsible: this.issueResponse.responsible ? this.issueResponse.responsible.map(resp => (resp.id)) : []
    });
    this.cardIssueResponseProperties.isLoading = false;
  }

  async loadPropertiesIssueResponse() {
    this.cardIssueResponseProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false,
      isLoading: this.idIssueResponse ? true : false
    };
    this.statusOptions = Object.keys(this.issueResponsePropertiesOptions.STATUS).map(key => ({
      label: this.translateSrv.instant(this.issueResponsePropertiesOptions.STATUS[key].label),
      value: this.issueResponsePropertiesOptions.STATUS[key].value
    }));
    await this.loadStakeholdersList();
    this.calculateYearRange();
    const result = this.idIssueResponse && await this.issueResponseSrv.GetById(this.idIssueResponse);
    if (result && result.success) {
      this.issueResponse = result.data;
      await this.loadPermissions();
      this.setFormIssueResponse();
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
        key: 'issue',
        routerLink: ['/workpack/issues'],
        queryParams: { idWorkpack: this.idWorkpack, idIssue: this.idIssue },
        info: this.issueName,
        tooltip: this.issueName
      },
      {
        key: 'response',
        info: this.issueResponse?.name,
        tooltip: this.issueResponse?.name
      }
    ]);
  }

  async saveIssueResponse() {
    this.cancelButton.hideButton();
    this.formIsSaving = true;
    const sender: IIssueResponse = {
      id: this.idIssueResponse,
      idIssue: this.idIssue,
      name: this.formIssueResponse.controls.name.value,
      date: this.formIssueResponse.controls.date.value && this.formIssueResponse.controls.date.value !== null ?
        moment(this.formIssueResponse.controls.date.value).format('yyyy-MM-DD') : undefined,
      status: this.formIssueResponse.controls.status.value,
      plan: this.formIssueResponse.controls.plan.value,
      responsible: this.formIssueResponse.controls.responsible.value
    };
    const result = this.idIssueResponse ? await this.issueResponseSrv.put(sender) : await this.issueResponseSrv.post(sender);
    this.formIsSaving = false;
    if (result.success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.router.navigate(['/workpack/issues'], {
        queryParams: {
          idWorkpack: this.idWorkpack,
          idIssue: this.idIssue
        }
      })
    }
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    if (this.idIssueResponse) {
      this.setFormIssueResponse();
    } else {
      this.formIssueResponse.reset({
        name: '',
        date: null,
        status: '',
        plan: '',
        responsible: [],
      });
    }
  }


}

