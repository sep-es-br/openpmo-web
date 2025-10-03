import { AuthService } from '../../../../shared/services/auth.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IssueService } from '../../../../shared/services/issue.service';
import { IconsEnum } from '../../../../shared/enums/IconsEnum';
import { RiskResponseService } from '../../../../shared/services/risk-response.service';
import { IRiskResponse } from '../../../../shared/interfaces/IRiskResponse';
import { RiskResponsesPropertiesOptions } from '../../../../shared/constants/riskResponsesPropertiesOptions';
import { ICardItem } from '../../../../shared/interfaces/ICardItem';
import { RiskService } from '../../../../shared/services/risk.service';
import { RisksPropertiesOptions } from '../../../../shared/constants/risksPropertiesOptions';
import { IRisk } from '../../../../shared/interfaces/IRisk';
import { ICard } from '../../../../shared/interfaces/ICard';
import { filter, takeUntil } from 'rxjs/operators';
import { MenuItem, MessageService, SelectItem } from 'primeng/api';
import { BreadcrumbService } from '../../../../shared/services/breadcrumb.service';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from '../../../../shared/services/responsive.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Calendar } from 'primeng/calendar';
import { SaveButtonComponent } from '../../../../shared/components/save-button/save-button.component';
import { Component, OnDestroy, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { Subject } from 'rxjs';
import * as moment from 'moment';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

@Component({
  selector: 'app-risk',
  templateUrl: './risk.component.html',
  styleUrls: ['./risk.component.scss']
})
export class RiskComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;
  @ViewChildren(Calendar) calendarComponents: Calendar[];

  responsive: boolean;
  idRisk: number;
  idWorkpack: number;
  idWorkpackModelLinked: number;
  editPermission: boolean;
  $destroy = new Subject();
  calendarFormat: string;
  cardRiskProperties: ICard;
  cardRiskResponsesProperties: ICard;
  riskResponseCardItems: ICardItem[];
  formRisk: FormGroup;
  risk: IRisk;
  riskPropertiesOptions = RisksPropertiesOptions;
  riskResponsePropertiesOptions = RiskResponsesPropertiesOptions;
  importanceOptions: SelectItem[];
  yearRangeCalculated: string;
  idPlan: number;
  formIsSaving = false;
  isLoadingResponseItems = false;

  constructor(
    private actRouter: ActivatedRoute,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private riskSrv: RiskService,
    private riskResponseSrv: RiskResponseService,
    private issueSrv: IssueService,
    private router: Router,
    private workpackSrv: WorkpackService,
    private authSrv: AuthService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idRisk = +queryParams.idRisk;
      this.idWorkpack = +queryParams.idWorkpack;
    });

    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.calendarComponents?.map(calendar => {
        calendar.ngOnInit();
        calendar.dateFormat = this.translateSrv.instant('dateFormat');
        calendar.updateInputfield();
      }, 150));
    });

    this.formRisk = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(600)]],
      importance: [null, Validators.required],
      nature: [this.riskPropertiesOptions.nature.THREAT.value, Validators.required],
      status: [this.riskPropertiesOptions.status.OPEN.value, Validators.required],
      likelyToHappenFrom: null,
      likelyToHappenTo: null,
      happenedIn: null
    });

    this.formRisk.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formRisk.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formRisk.dirty && this.formRisk.valid))
      .subscribe(() => this.saveButton.showButton());
    this.formRisk.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formRisk.dirty))
      .subscribe(() => this.cancelButton.showButton());
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    await this.loadPropertiesRisk();
    await this.setBreadcrumb();
  }

  mirrorDescription(): boolean {
    return (isNaN(this.idRisk) && this.formRisk.get('description').pristine);
  }

  setFormRisk() {
    this.formRisk.reset({
      name: this.risk.name,
      description: this.risk.description,
      importance: this.risk.importance,
      nature: this.risk.nature,
      status: this.risk.status,
      likelyToHappenFrom: this.risk.likelyToHappenFrom ? new Date(this.risk.likelyToHappenFrom + 'T00:00:00') : null,
      likelyToHappenTo: this.risk.likelyToHappenTo ? new Date(this.risk.likelyToHappenTo + 'T00:00:00') : null,
      happenedIn: this.risk.happenedIn ? new Date(this.risk.happenedIn + 'T00:00:00') : null
    });

    this.cardRiskProperties.isLoading = false;
  }

  async loadPropertiesRisk() {
    this.cardRiskProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false,
      isLoading: true
    };

    this.importanceOptions = Object.keys(this.riskPropertiesOptions.importance).map(key => ({
      label: this.translateSrv.instant(this.riskPropertiesOptions.importance[key].label),
      value: this.riskPropertiesOptions.importance[key].value
    }));

    this.calculateYearRange();
    const result = this.idRisk && await this.riskSrv.GetById(this.idRisk);
    await this.loadPermissions();

    if (result.success) {
      this.risk = result.data;
      this.setFormRisk();
    }

    if (this.idRisk) {
      this.loadRiskResponseCardItems();
    } else {
      this.createAddRiskCard();

      this.cardRiskProperties.isLoading = false;
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
        this.editPermission =
          workpack.permissions &&
          workpack.permissions.filter(p => p.level === 'EDIT').length > 0 && !workpack.canceled;
      }
    }

    if (!this.editPermission) {
      this.formRisk.disable();
    } else {
      this.formRisk.enable();
    }
  }

  calculateYearRange() {
    const date = moment();
    const rangeYearStart = date.year();
    const rangeYearEnd = date.add(10, 'years').year();
    this.yearRangeCalculated = `${rangeYearStart}:${rangeYearEnd};`;
  }

  async setBreadcrumb() {
    let breadcrumbItems = this.breadcrumbSrv.get;
    if (!breadcrumbItems || breadcrumbItems.length === 0) {
      breadcrumbItems = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(this.idWorkpack, this.idPlan);
    }

    this.breadcrumbSrv.setMenu([
      ...breadcrumbItems,
      {
        key: 'risk',
        routerLink: ['/workpack/risks'],
        queryParams: { idWorkpack: this.idWorkpack, idRisk: this.idRisk },
        info: this.risk?.name,
        tooltip: this.risk?.name
      }
    ]);
  }

  loadRiskResponseCardItems() {
    this.isLoadingResponseItems = true;
    this.riskResponseCardItems = [];
    if (this.risk && this.risk.responsePlans && this.risk.responsePlans.length > 0) {
      this.riskResponseCardItems = this.risk.responsePlans.map(resp => ({
        typeCardItem: 'listItem',
        icon: 'pistola',
        iconSvg: true,
        nameCardItem: resp.name,
        subtitleCardItem: this.risk.nature === this.riskPropertiesOptions.nature.OPPORTUNITY.value ?
          this.translateSrv.instant(this.riskResponsePropertiesOptions.STRATEGY.POSITIVE[resp.strategy].label) :
          this.translateSrv.instant(this.riskResponsePropertiesOptions.STRATEGY.NEGATIVE[resp.strategy].label),
        statusItem: this.translateSrv.instant(this.riskResponsePropertiesOptions.STATUS[resp.status].label),
        itemId: resp.id,
        idAtributeName: 'idRiskResponse',
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (_event) => this.deleteRiskResponse(resp),
          disabled: !this.editPermission
        }] as MenuItem[],
        urlCard: '/workpack/risks/response',
        paramsUrlCard: [
          { name: 'id', value: resp.id },
          { name: 'idRisk', value: this.idRisk },
          { name: 'riskNature', value: this.risk.nature },
          { name: 'riskName', value: this.risk.name },
          { name: 'edit', value: this.editPermission ? 'true' : 'false' },
          { name: 'idWorkpack', value: this.idWorkpack },
        ]
      }));
      this.isLoadingResponseItems = false;
    }

    this.createAddRiskCard();

    if (this.riskResponseCardItems && this.riskResponseCardItems.length > 0) {
      this.cardRiskResponsesProperties = {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: 'responsePlan',
        collapseble: false,
        initialStateCollapse: false
      };
    }
  }

  createAddRiskCard() {
    if (this.editPermission) {
      if (!this.riskResponseCardItems) this.riskResponseCardItems = [];
      this.riskResponseCardItems.push({
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        iconSvg: true,
        nameCardItem: null,
        subtitleCardItem: null,
        statusItem: null,
        itemId: null,
        menuItems: null,
        urlCard: '/workpack/risks/response',
        paramsUrlCard: [
          { name: 'idRisk', value: this.idRisk },
          { name: 'riskNature', value: this.risk?.nature },
          { name: 'riskName', value: this.risk?.name },
          { name: 'edit', value: this.editPermission ? 'true' : 'false' },
          { name: 'idWorkpack', value: this.idWorkpack },
        ]
      });

      this.isLoadingResponseItems = false;
    } else {
      this.isLoadingResponseItems = false;
    }
  }

  async deleteRiskResponse(resp: IRiskResponse) {
    const result = await this.riskResponseSrv.delete(resp, { useConfirm: true });
    if (result.success) {
      this.riskResponseCardItems = Array.from(this.riskResponseCardItems.filter(r => r.itemId !== resp.id));
    }
  }

  async saveRisk() {
    this.cancelButton.hideButton();
    const likelyToHappenFrom = this.getLikelyToHappenFrom();
    const likelyToHappenTo = this.getLikelyToHappenTo();

    if (likelyToHappenFrom && likelyToHappenTo && moment(likelyToHappenFrom).isAfter(likelyToHappenTo)) {
      this.messageSrv.add({
        severity: 'warn',
        summary: this.translateSrv.instant('warn'),
        detail: this.translateSrv.instant('messages.startDateIsAfterEndDate')
      });
      return;
    }

    this.formIsSaving = true;
    const sender: IRisk = {
      id: this.idRisk,
      idWorkpack: this.idWorkpack,
      name: this.formRisk.controls.name.value,
      description: this.formRisk.controls.description.value,
      importance: this.formRisk.controls.importance.value,
      likelyToHappenFrom,
      likelyToHappenTo,
      happenedIn: this.formRisk.controls.happenedIn.value,
      nature: this.formRisk.controls.nature.value,
      status: this.formRisk.controls.status.value
    };

    const put = !!this.idRisk;
    const result = put ? await this.riskSrv.put(sender) : await this.riskSrv.post(sender);
    this.formIsSaving = false;
    if (result.success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });

      this.idRisk = result.data.id;
      this.risk = {
        ...this.risk,
        ...sender,
        id: result.data.id
      };

      if (!put) this.setBreadcrumb();
      this.loadRiskResponseCardItems();

      if (this.risk.status === this.riskPropertiesOptions.status.HAPPENED.value) {
        const existsIssueForRisk = await this.getIssueForRisk();
        if (!existsIssueForRisk) {
          await this.createIssueForRisk();
        }
      }
    }
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    if (this.idRisk) {
      this.setFormRisk();
    } else {
      this.formRisk.reset({
        name: '',
        description: '',
        importance: null,
        nature: this.riskPropertiesOptions.nature.THREAT.value,
        status: this.riskPropertiesOptions.status.OPEN.value,
        likelyToHappenFrom: null,
        likelyToHappenTo: null,
        happenedIn: null
      });
    }
  }

  async getIssueForRisk() {
    const result = await this.issueSrv.GetAll({ 'id-workpack': this.idWorkpack, idRisk: this.idRisk });
    return result.success && result.data && result.data.length > 0;
  }

  async createIssueForRisk() {
    const result = await this.issueSrv.CreateIssueFromRisk(this.idRisk);
    if (result.success) {
      const idIssue = result.data.id;
      await this.router.navigate(['/workpack/issues'], {
        queryParams: {
          id: idIssue,
          idWorkpack: this.idWorkpack,
          idWorkpackModelLinked: this.idWorkpackModelLinked,
          edit: this.editPermission
        }
      });
    }
  }

  private getLikelyToHappenTo() {
    const value = this.formRisk.controls.likelyToHappenTo.value;
    if (value) {
      return moment(value).format('yyyy-MM-DD');
    }
    return null;
  }

  private getLikelyToHappenFrom() {
    const value = this.formRisk.controls.likelyToHappenFrom.value;
    if (value) {
      return moment(value).format('yyyy-MM-DD');
    }
    return null;
  }

}
