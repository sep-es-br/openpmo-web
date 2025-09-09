import { AuthService } from './../../../../shared/services/auth.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IIssueResponse } from './../../../../shared/interfaces/IIssueResponse';
import { IconsEnum } from './../../../../shared/enums/IconsEnum';
import { IssueResponsesPropertiesOptions } from './../../../../shared/constants/issueResponsesPropertiesOptions';
import { takeUntil, filter } from 'rxjs/operators';
import { IssueResponseService } from './../../../../shared/services/issue-response.service';
import { IssueService } from './../../../../shared/services/issue.service';
import { BreadcrumbService } from './../../../../shared/services/breadcrumb.service';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from './../../../../shared/services/responsive.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SelectItem, MessageService, MenuItem } from 'primeng/api';
import { IssuesPropertiesOptions } from './../../../../shared/constants/issuesPropertiesOptions';
import { RisksPropertiesOptions } from './../../../../shared/constants/risksPropertiesOptions';
import { IIssue } from './../../../../shared/interfaces/IIssue';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ICardItem } from './../../../../shared/interfaces/ICardItem';
import { ICard } from './../../../../shared/interfaces/ICard';
import { Subject } from 'rxjs';
import { Calendar } from 'primeng/calendar';
import { SaveButtonComponent } from './../../../../shared/components/save-button/save-button.component';
import { Component, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

@Component({
  selector: 'app-issue',
  templateUrl: './issue.component.html',
  styleUrls: ['./issue.component.scss']
})
export class IssueComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;
  @ViewChildren(Calendar) calendarComponents: Calendar[];

  responsive: boolean;
  idIssue: number;
  idWorkpack: number;
  idWorkpackModelLinked: number;
  editPermission: boolean;
  $destroy = new Subject();
  cardIssueProperties: ICard;
  cardIssueResponsesProperties: ICard;
  issueResponseCardItems: ICardItem[];
  formIssue: FormGroup;
  issue: IIssue;
  riskPropertiesOptions = RisksPropertiesOptions;
  issuePropertiesOptions = IssuesPropertiesOptions;
  issueResponsePropertiesOptions = IssueResponsesPropertiesOptions;
  importanceOptions: SelectItem[];
  idPlan: number;
  formIsSaving = false;

  constructor(
    private actRouter: ActivatedRoute,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private issueSrv: IssueService,
    private issueResponseSrv: IssueResponseService,
    private workpackSrv: WorkpackService,
    private authSrv: AuthService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idIssue = queryParams.idIssue && +queryParams.idIssue;
      this.idWorkpack = queryParams.idWorkpack && +queryParams.idWorkpack;
      this.idWorkpackModelLinked = queryParams.idWorkpackModelLinked && +queryParams.idWorkpackModelLinked;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.formIssue = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      triggeredBy: null,
      description: ['', Validators.required],
      importance: [null, Validators.required],
      nature: [this.issuePropertiesOptions.nature.PROBLEM.value, Validators.required],
      status: [this.issuePropertiesOptions.status.OPEN.value, Validators.required],
    });
    this.formIssue.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formIssue.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formIssue.dirty && this.formIssue.valid))
      .subscribe(() => this.saveButton.showButton());
    this.formIssue.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formIssue.dirty))
      .subscribe(() => this.cancelButton.showButton());
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    await this.loadPropertiesIssue();
    await this.setBreadcrumb();
    if (!this.idIssue) {
      this.editPermission = true;
    }
  }

  mirrorDescription(): boolean {
    return (isNaN(this.idIssue) && this.formIssue.get('description').pristine);
  }

  setFormIssue() {
    this.formIssue.reset({
      name: this.issue.name,
      triggeredBy: this.issue.triggeredBy,
      description: this.issue.description,
      importance: this.issue.importance,
      nature: this.issue.nature,
      status: this.issue.status,
    });
  }

  async loadPropertiesIssue() {
    this.cardIssueProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false,
      isLoading: this.idIssue ? true : false
    };
    this.importanceOptions = Object.keys(this.issuePropertiesOptions.importance).map(key => ({
      label: this.translateSrv.instant(this.issuePropertiesOptions.importance[key].label),
      value: this.issuePropertiesOptions.importance[key].value
    }));
    const result = !!this.idIssue && await this.issueSrv.GetById(this.idIssue);
    if (result.success) {
      this.issue = result.data;
      await this.loadPermissions();
      this.setFormIssue();
    }
    if (this.idIssue) {
      this.loadIssueResponseCardItems();
    }
  }

  async loadPermissions() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    const idWorkpack = this.idIssue ? this.issue.idWorkpack : this.idWorkpack;
    const result = await this.workpackSrv.GetWorkpackPermissions(idWorkpack, { 'id-plan': this.idPlan });
    if (result.success) {
      const workpack = result.data;
      if (isUserAdmin) {
        this.editPermission = !workpack.canceled;
      } else {
        this.editPermission = (workpack.permissions && workpack.permissions.filter(p => p.level === 'EDIT').length > 0) && !workpack.canceled;
      }
    }

    if (!this.editPermission) {
      this.formIssue.disable();
    } else {
      this.formIssue.enable();
    }
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
        info: this.issue?.name,
        tooltip: this.issue?.name
      }
    ]);
  }

  loadIssueResponseCardItems() {
    this.issueResponseCardItems = [];
    if (this.issue && this.issue.responses && this.issue.responses.length > 0) {
      this.issueResponseCardItems = this.issue.responses.map(resp => ({
        typeCardItem: 'listItem',
        icon: 'fire-extinguisher',
        iconSvg: true,
        nameCardItem: resp.name,
        subtitleCardItem: this.translateSrv.instant(this.issueResponsePropertiesOptions.STATUS[resp.status].label),
        itemId: resp.id,
        idAtributeName: 'idIssueResponse',
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteIssueResponse(resp),
          disabled: !this.editPermission
        }] as MenuItem[],
        urlCard: '/workpack/issues/response',
        paramsUrlCard: [
          { name: 'id', value: resp.id },
          { name: 'idIssue', value: this.idIssue },
          { name: 'issueName', value: this.issue.name },
          { name: 'edit', value: this.editPermission ? 'true' : 'false' },
          { name: 'idWorkpack', value: this.idWorkpack }
        ]
      }));
    }
    if (this.editPermission) {
      this.issueResponseCardItems.push({
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        iconSvg: true,
        nameCardItem: null,
        subtitleCardItem: null,
        statusItem: null,
        itemId: null,
        menuItems: null,
        urlCard: '/workpack/issues/response',
        paramsUrlCard: [
          { name: 'idIssue', value: this.idIssue },
          { name: 'issueName', value: this.issue.name },
          { name: 'edit', value: this.editPermission ? 'true' : 'false' },
          { name: 'idWorkpack', value: this.idWorkpack }
        ]
      });
      this.cardIssueProperties.isLoading = false;
    } else {
      this.cardIssueProperties.isLoading = false;
    }
    if (this.issueResponseCardItems && this.issueResponseCardItems.length > 0) {
      this.cardIssueResponsesProperties = {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: 'responsePlan',
        collapseble: false,
        initialStateCollapse: false
      }
    }
  }

  async deleteIssueResponse(resp: IIssueResponse) {
    const result = await this.issueResponseSrv.delete(resp, { useConfirm: true });
    if (result.success) {
      this.issueResponseCardItems = Array.from(this.issueResponseCardItems.filter(r => r.itemId !== resp.id));
    }
  }

  async saveIssue() {
    this.cancelButton.hideButton();
    this.formIsSaving = true;
    const sender: IIssue = {
      id: this.idIssue,
      idWorkpack: this.idWorkpack,
      name: this.formIssue.controls.name.value,
      description: this.formIssue.controls.description.value,
      importance: this.formIssue.controls.importance.value,
      nature: this.formIssue.controls.nature.value,
      status: this.formIssue.controls.status.value
    };
    const put = !!this.idIssue;
    const result =  put ? await this.issueSrv.put(sender) : await this.issueSrv.post(sender);
    this.formIsSaving = false;
    if (result.success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.idIssue = result.data.id;
      this.issue = {
        ...this.issue,
        ...sender
      };
      this.setBreadcrumb();
      this.loadIssueResponseCardItems();
    }
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    if (this.idIssue) {
      this.setFormIssue();
    } else {
      this.formIssue.reset({
        name: '',
        triggeredBy: null,
        description: '',
        importance: null,
        nature: this.issuePropertiesOptions.nature.PROBLEM.value,
        status: this.issuePropertiesOptions.status.OPEN.value
      });
    }
  }

}
