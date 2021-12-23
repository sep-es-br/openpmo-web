import { AuthService } from './../../../../shared/services/auth.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IIssueResponse } from './../../../../shared/interfaces/IIssueResponse';
import { IIssue } from './../../../../shared/interfaces/IIssue';
import { IssueService } from './../../../../shared/services/issue.service';
import { IconsEnum } from './../../../../shared/enums/IconsEnum';
import { RiskResponseService } from './../../../../shared/services/risk-response.service';
import { IRiskResponse } from './../../../../shared/interfaces/IRiskResponse';
import { RiskResponsesPropertiesOptions } from './../../../../shared/constants/riskResponsesPropertiesOptions';
import { ICardItem } from './../../../../shared/interfaces/ICardItem';
import { PlanService } from './../../../../shared/services/plan.service';
import { RiskService } from './../../../../shared/services/risk.service';
import { RisksPropertiesOptions } from './../../../../shared/constants/risksPropertiesOptions';
import { IRisk } from './../../../../shared/interfaces/IRisk';
import { ICard } from './../../../../shared/interfaces/ICard';
import { filter, takeUntil } from 'rxjs/operators';
import { MessageService, SelectItem, MenuItem } from 'primeng/api';
import { BreadcrumbService } from './../../../../shared/services/breadcrumb.service';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from './../../../../shared/services/responsive.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { Calendar } from 'primeng/calendar';
import { SaveButtonComponent } from './../../../../shared/components/save-button/save-button.component';
import { Component, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { Subject } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-risk',
  templateUrl: './risk.component.html',
  styleUrls: ['./risk.component.scss']
})
export class RiskComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
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
      this.idRisk = +queryParams.id;
      this.idWorkpack = +queryParams.idWorkpack;
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
    this.formRisk = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      importance: [null, Validators.required],
      nature: [this.riskPropertiesOptions.nature.THREAT.value, Validators.required],
      status: [this.riskPropertiesOptions.status.OPEN.value, Validators.required],
      likelyToHappenFrom: null,
      likelyToHappenTo: null,
      happenedIn: null
    });
    this.formRisk.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton.hideButton());
    this.formRisk.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formRisk.dirty && this.formRisk.valid))
      .subscribe(() => this.saveButton.showButton());
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    await this.loadPropertiesRisk();
    await this.setBreadcrumb();
    if (!this.editPermission) {
      this.formRisk.disable;
    } else {
      this.formRisk.enable;
    }
  }

  setFormRisk() {
    this.formRisk.controls.name.setValue(this.risk.name);
    this.formRisk.controls.description.setValue(this.risk.description);
    this.formRisk.controls.importance.setValue(this.risk.importance);
    this.formRisk.controls.nature.setValue(this.risk.nature);
    this.formRisk.controls.status.setValue(this.risk.status);
    if (this.risk.likelyToHappenFrom) {
      this.formRisk.controls.likelyToHappenFrom.setValue(new Date(this.risk.likelyToHappenFrom + 'T00:00:00'));
    }
    if (this.risk.likelyToHappenTo) {
      this.formRisk.controls.likelyToHappenTo.setValue(new Date(this.risk.likelyToHappenTo + 'T00:00:00'));
    }
    if (this.risk.happenedIn) {
      this.formRisk.controls.happenedIn.setValue(new Date(this.risk.happenedIn + 'T00:00:00'));
    }
  }

  async loadPropertiesRisk() {
    this.cardRiskProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false
    };
    this.importanceOptions = Object.keys(this.riskPropertiesOptions.importance).map(key => ({
      label: this.translateSrv.instant(this.riskPropertiesOptions.importance[key].label),
      value: this.riskPropertiesOptions.importance[key].value
    }));
    this.calculateYearRange();
    const result = this.idRisk && await this.riskSrv.GetById(this.idRisk);
    if (result.success) {
      this.risk = result.data;
      await this.loadPermissions();
      this.setFormRisk();
    }
    if (this.idRisk) {
      this.loadRiskResponseCardItems();
    }
  }

  async loadPermissions() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    if (isUserAdmin) {
      this.editPermission = true;
    } else {
      const idWorkpack = this.idRisk ? this.risk.idWorkpack : this.idWorkpack;
      this.idPlan = Number(localStorage.getItem('@currentPlan'));
      const result = await this.workpackSrv.GetWorkpackById(idWorkpack, { 'id-plan': this.idPlan });
      if (result.success) {
        const workpack = result.data;
        this.editPermission = workpack.permissions && workpack.permissions.filter(p => p.level === 'EDIT').length > 0;
      }
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
        info: this.risk?.name,
        tooltip: this.risk?.name
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

  loadRiskResponseCardItems() {
    this.riskResponseCardItems = [];
    if (this.risk && this.risk.responsePlans && this.risk.responsePlans.length > 0) {
      this.riskResponseCardItems = this.risk.responsePlans.map(resp => ({
        typeCardItem: 'listItem',
        icon: 'response_risk',
        iconSvg: true,
        nameCardItem: resp.name,
        subtitleCardItem: this.risk.nature === this.riskPropertiesOptions.nature.OPPORTUNITY.value ?
          this.translateSrv.instant(this.riskResponsePropertiesOptions.STRATEGY.POSITIVE[resp.strategy].label) :
          this.translateSrv.instant(this.riskResponsePropertiesOptions.STRATEGY.NEGATIVE[resp.strategy].label),
        statusItem: this.translateSrv.instant(this.riskResponsePropertiesOptions.STATUS[resp.status].label),
        itemId: resp.id,
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteRiskResponse(resp),
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
    }
    if (this.editPermission) {
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
          { name: 'riskNature', value: this.risk.nature },
          { name: 'riskName', value: this.risk.name },
          { name: 'edit', value: this.editPermission ? 'true' : 'false' },
          { name: 'idWorkpack', value: this.idWorkpack },
        ]
      });
    }
    if (this.riskResponseCardItems && this.riskResponseCardItems.length > 0) {
      this.cardRiskResponsesProperties = {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: 'responsePlan',
        collapseble: false,
        initialStateCollapse: false
      }
    }
  }

  async deleteRiskResponse(resp: IRiskResponse) {
    const result = await this.riskResponseSrv.delete(resp, { useConfirm: true });
    if (result.success) {
      this.riskResponseCardItems = Array.from(this.riskResponseCardItems.filter(r => r.itemId === resp.id));
    }
  }

  async saveRisk() {
    const sender: IRisk = {
      id: this.idRisk,
      idWorkpack: this.idWorkpack,
      name: this.formRisk.controls.name.value,
      description: this.formRisk.controls.description.value,
      importance: this.formRisk.controls.importance.value,
      likelyToHappenFrom: moment(this.formRisk.controls.likelyToHappenFrom.value).format('yyyy-MM-DD'),
      likelyToHappenTo: moment(this.formRisk.controls.likelyToHappenTo.value).format('yyyy-MM-DD'),
      happenedIn: this.formRisk.controls.happenedIn.value,
      nature: this.formRisk.controls.nature.value,
      status: this.formRisk.controls.status.value
    };
    const result = this.idRisk ? await this.riskSrv.put(sender) : await this.riskSrv.post(sender);
    if (result.success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.idRisk = result.data.id;
      this.risk = {
        ...sender
      };
      this.loadRiskResponseCardItems();
      if (this.risk.status === this.riskPropertiesOptions.status.HAPPENED.value) {
        const existsIssueForRisk = await this.getIssueForRisk();
        if (!existsIssueForRisk) {
          const idIssue = await this.createIssueForRisk();
        }
      }
    }
  }

  async getIssueForRisk() {
    const result = await this.issueSrv.GetAll({ 'id-workpack': this.idWorkpack, idRisk: this.idRisk });
    if (result.success && result.data && result.data.length > 0) {
      return true;
    }
    return false;
  }

  async createIssueForRisk() {
    const result = await this.issueSrv.CreateIssueFromRisk(this.idRisk);
    if (result.success) {
      const idIssue = result.data.id;
      this.router.navigate(['/workpack/issues'], {
        queryParams: {
          id: idIssue,
          idWorkpack: this.idWorkpack,
          idWorkpackModelLinked: this.idWorkpackModelLinked,
          edit: this.editPermission
        }
      })
    }
  }

}