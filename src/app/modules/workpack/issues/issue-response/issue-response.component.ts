import { AuthService } from './../../../../shared/services/auth.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IssueResponseService } from './../../../../shared/services/issue-response.service';
import { takeUntil, filter } from 'rxjs/operators';
import { StakeholderService } from './../../../../shared/services/stakeholder.service';
import { BreadcrumbService } from './../../../../shared/services/breadcrumb.service';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from './../../../../shared/services/responsive.service';
import { ActivatedRoute } from '@angular/router';
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

@Component({
  selector: 'app-issue-response',
  templateUrl: './issue-response.component.html',
  styleUrls: ['./issue-response.component.scss']
})
export class IssueResponseComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
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
    private authSrv: AuthService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idIssueResponse = queryParams.id && +queryParams.id;
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
      .subscribe(() => this.saveButton.hideButton());
    this.formIssueResponse.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formIssueResponse.dirty && this.formIssueResponse.valid))
      .subscribe(() => this.saveButton.showButton());
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    await this.loadPropertiesIssueResponse();
    await this.setBreadcrumb();
    if (!this.editPermission) {
      this.formIssueResponse.disable;
    } else {
      this.formIssueResponse.enable;
    }
  }

  setFormIssueResponse() {
      this.formIssueResponse.controls.name.setValue(this.issueResponse.name);
      this.formIssueResponse.controls.date.setValue(new Date(this.issueResponse.date + 'T00:00:00'));
      this.formIssueResponse.controls.status.setValue(this.issueResponse.status);
      this.formIssueResponse.controls.plan.setValue(this.issueResponse.plan);
      this.formIssueResponse.controls.responsible.setValue(this.issueResponse.responsible.map( resp => (resp.id)));
  }

  async loadPropertiesIssueResponse() {
    this.cardIssueResponseProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false
    };
    this.statusOptions =  Object.keys(this.issueResponsePropertiesOptions.STATUS).map(key => ({
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
    if (isUserAdmin) {
      this.editPermission = true;
    } else {
      this.idPlan = Number(localStorage.getItem('@currentPlan'));
      const result = await this.workpackSrv.GetWorkpackById(this.idWorkpack, {'id-plan': this.idPlan});
      if (result.success) {
        const workpack = result.data;
        this.editPermission = workpack.permissions && workpack.permissions.filter( p => p.level === 'EDIT').length > 0;
      }
    }
  }

  async loadStakeholdersList() {
    const result = await this.stakeholderSrv.GetResponsibles({ 'id-workpack': this.idWorkpack});
    if (result.success) {
      this.stakeholderOptions = result.data.map( stake => ({
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
        key: 'issue',
        routerLink: ['/workpack/issues'],
        queryParams: { idWorkpack: this.idWorkpack, id: this.idIssue },
        info: this.issueName,
        tooltip: this.issueName
      },
      {
        key: 'response',
        routerLink: ['/workpack/issues/response'],
        queryParams: {
          idWorkpack: this.idWorkpack,
          id: this.idIssueResponse,
          idIssue: this.idIssue,
          issueName: this.issueName },
        info: this.issueResponse?.name,
        tooltip: this.issueResponse?.name
      }
    ]);
  }

  async getBreadcrumbs(idWorkpack: number) {
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(idWorkpack, {'id-plan': this.idPlan});
    return success
      ? data.map(p => ({
            key: !p.modelName ? p.type.toLowerCase() : p.modelName,
            info: p.name,
            tooltip: p.fullName,
            routerLink: this.getRouterLinkFromType(p.type),
            queryParams: { id: p.id, idWorkpackModelLinked: p.idWorkpackModelLinked },
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

  async saveIssueResponse() {
    const sender: IIssueResponse = {
      id: this.idIssueResponse,
      idIssue: this.idIssue,
      name: this.formIssueResponse.controls.name.value,
      date: moment(this.formIssueResponse.controls.date.value).format('yyyy-MM-DD'),
      status: this.formIssueResponse.controls.status.value,
      plan: this.formIssueResponse.controls.plan.value,
      responsible: this.formIssueResponse.controls.responsible.value
    };
    const result = this.idIssueResponse ? await this.issueResponseSrv.put(sender) : await this.issueResponseSrv.post(sender);
    if (result.success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.idIssueResponse = result.data.id;
      this.issueResponse = {...result.data};
    }
  }

}
